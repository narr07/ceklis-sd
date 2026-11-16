//! Membuat PDF dari halaman yang sedang tampil di WebView2 lewat Chrome DevTools Protocol
//! (`Page.printToPDF`). Ukuran & orientasi kertas mengikuti CSS `@page` dokumen
//! (`preferCSSPageSize`), sehingga halaman tegak dan lanskap dalam satu dokumen tetap benar.

use std::sync::mpsc;
use std::time::Duration;

use webview2_com::CallDevToolsProtocolMethodCompletedHandler;
use windows::core::HSTRING;

/// Batas waktu membuat PDF (dokumen panjang seperti SKBM + lampiran tetap selesai jauh di bawah ini).
const BATAS_WAKTU: Duration = Duration::from_secs(90);

/// Ambil PDF halaman yang sedang tampil di jendela pemanggil. Dipanggil dari thread pekerja
/// (bukan thread UI), karena menunggu balasan WebView2 yang berjalan di thread UI.
pub fn pdf_halaman(window: &tauri::WebviewWindow) -> Result<Vec<u8>, String> {
    let (tx, rx) = mpsc::channel::<Result<String, String>>();
    let tx_galat = tx.clone();

    window
        .with_webview(move |wv| {
            let hasil = (|| -> windows::core::Result<()> {
                // SAFETY: dipanggil di thread UI milik WebView2 (dijamin `with_webview`),
                // dan objek COM yang dipakai tetap hidup selama pemanggilan.
                let core = unsafe { wv.controller().CoreWebView2()? };
                let handler = CallDevToolsProtocolMethodCompletedHandler::create(Box::new(
                    move |hasil, json| {
                        let _ = tx.send(hasil.map(|_| json).map_err(|e| e.message()));
                        Ok(())
                    },
                ));
                let metode = HSTRING::from("Page.printToPDF");
                let parameter = HSTRING::from(
                    r#"{"printBackground":true,"preferCSSPageSize":true,"displayHeaderFooter":false}"#,
                );
                // SAFETY: argumen berupa string UTF-16 yang hidup sampai pemanggilan selesai.
                unsafe { core.CallDevToolsProtocolMethod(&metode, &parameter, &handler) }
            })();
            if let Err(e) = hasil {
                let _ = tx_galat.send(Err(e.message()));
            }
        })
        .map_err(|e| format!("Tidak bisa mengakses tampilan aplikasi: {e}"))?;

    let json = rx
        .recv_timeout(BATAS_WAKTU)
        .map_err(|_| "Waktu habis saat membuat PDF.".to_string())?
        .map_err(|e| format!("WebView2 gagal membuat PDF: {e}"))?;
    let nilai: serde_json::Value =
        serde_json::from_str(&json).map_err(|e| format!("Balasan PDF tidak valid: {e}"))?;
    let data = nilai
        .get("data")
        .and_then(|d| d.as_str())
        .ok_or_else(|| "Balasan PDF tidak berisi data.".to_string())?;
    let bytes = dekode_base64(data)?;
    if !bytes.starts_with(b"%PDF") {
        return Err("Hasil bukan file PDF.".to_string());
    }
    Ok(bytes)
}

/// Dekode base64 standar (RFC 4648, dengan padding `=`), tanpa dependensi tambahan.
pub fn dekode_base64(teks: &str) -> Result<Vec<u8>, String> {
    fn nilai(c: u8) -> Option<u32> {
        match c {
            b'A'..=b'Z' => Some(u32::from(c - b'A')),
            b'a'..=b'z' => Some(u32::from(c - b'a') + 26),
            b'0'..=b'9' => Some(u32::from(c - b'0') + 52),
            b'+' => Some(62),
            b'/' => Some(63),
            _ => None,
        }
    }
    let bersih: Vec<u8> = teks.bytes().filter(|c| !c.is_ascii_whitespace()).collect();
    if !bersih.len().is_multiple_of(4) {
        return Err("Panjang base64 tidak valid.".to_string());
    }
    let mut out = Vec::with_capacity(bersih.len() / 4 * 3);
    for (i, blok) in bersih.chunks(4).enumerate() {
        let terakhir = i == bersih.len() / 4 - 1;
        let pad = blok.iter().rev().take_while(|&&c| c == b'=').count();
        if pad > 2 || (pad > 0 && !terakhir) {
            return Err("Padding base64 tidak valid.".to_string());
        }
        let mut n: u32 = 0;
        for &c in &blok[..4 - pad] {
            n = (n << 6) | nilai(c).ok_or_else(|| "Karakter base64 tidak valid.".to_string())?;
        }
        n <<= 6 * pad as u32;
        let byte = n.to_be_bytes();
        out.extend_from_slice(&byte[1..4 - pad]);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::dekode_base64;

    #[test]
    fn base64_sesuai_rfc4648() {
        assert_eq!(dekode_base64("").unwrap(), b"");
        assert_eq!(dekode_base64("Zg==").unwrap(), b"f");
        assert_eq!(dekode_base64("Zm8=").unwrap(), b"fo");
        assert_eq!(dekode_base64("Zm9v").unwrap(), b"foo");
        assert_eq!(dekode_base64("Zm9vYmFy").unwrap(), b"foobar");
        assert_eq!(dekode_base64("JVBERi0xLjQK").unwrap(), b"%PDF-1.4\n");
        assert_eq!(dekode_base64("Zm9v\nYmFy").unwrap(), b"foobar");
    }

    #[test]
    fn base64_rusak_ditolak() {
        assert!(dekode_base64("Zm9").is_err());
        assert!(dekode_base64("Zm=v").is_err());
        assert!(dekode_base64("Zg==Zm9v").is_err());
        assert!(dekode_base64("Zm9*").is_err());
    }
}
