//! Enkripsi database sebelum diunggah ke Google Drive.
//!
//! Format berkas: `CEKLIS01` (8 byte) | salt (16) | nonce (24) | ciphertext + tag.
//! Kunci 256-bit diturunkan dari kata sandi sekolah dengan Argon2id (parameter bawaan
//! crate argon2: m = 19 MiB, t = 2, p = 1), lalu dienkripsi XChaCha20-Poly1305.
//! Header ikut diautentikasi (AAD), sehingga perubahan apa pun pada berkas terdeteksi.

use argon2::Argon2;
use chacha20poly1305::aead::{Aead, KeyInit, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};

const MAGIC: &[u8; 8] = b"CEKLIS01";
const PANJANG_SALT: usize = 16;
const PANJANG_NONCE: usize = 24;
const PANJANG_HEADER: usize = MAGIC.len() + PANJANG_SALT + PANJANG_NONCE;

/// Panjang minimal kata sandi sinkron Drive.
pub const SANDI_MIN: usize = 8;

/// Penanda galat kata sandi salah, dibaca frontend untuk meminta ulang kata sandi.
pub const GALAT_SANDI_SALAH: &str = "SANDI_SALAH: ";

pub fn acak(n: usize) -> Result<Vec<u8>, String> {
    let mut b = vec![0u8; n];
    getrandom::fill(&mut b).map_err(|e| format!("Gagal membuat bilangan acak: {e}"))?;
    Ok(b)
}

pub fn periksa_sandi(sandi: &str) -> Result<(), String> {
    if sandi.chars().count() < SANDI_MIN {
        return Err(format!("Kata sandi minimal {SANDI_MIN} karakter."));
    }
    if sandi.len() > 256 {
        return Err("Kata sandi terlalu panjang (maksimal 256 byte).".to_string());
    }
    Ok(())
}

fn turunkan_kunci(sandi: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut kunci = [0u8; 32];
    Argon2::default()
        .hash_password_into(sandi.as_bytes(), salt, &mut kunci)
        .map_err(|e| format!("Gagal menurunkan kunci dari kata sandi: {e}"))?;
    Ok(kunci)
}

pub fn enkripsi(isi: &[u8], sandi: &str) -> Result<Vec<u8>, String> {
    periksa_sandi(sandi)?;
    let salt = acak(PANJANG_SALT)?;
    let nonce = acak(PANJANG_NONCE)?;
    let kunci = turunkan_kunci(sandi, &salt)?;

    let mut keluaran = Vec::with_capacity(PANJANG_HEADER + isi.len() + 16);
    keluaran.extend_from_slice(MAGIC);
    keluaran.extend_from_slice(&salt);
    keluaran.extend_from_slice(&nonce);

    let cipher = XChaCha20Poly1305::new((&kunci).into());
    let ct = cipher
        .encrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: isi,
                aad: &keluaran,
            },
        )
        .map_err(|_| "Gagal mengenkripsi database.".to_string())?;
    keluaran.extend_from_slice(&ct);
    Ok(keluaran)
}

pub fn dekripsi(berkas: &[u8], sandi: &str) -> Result<Vec<u8>, String> {
    if berkas.len() < PANJANG_HEADER + 16 || &berkas[..MAGIC.len()] != MAGIC {
        return Err(
            "Berkas di Google Drive bukan database Ceklis SD terenkripsi yang dikenali."
                .to_string(),
        );
    }
    let (header, ct) = berkas.split_at(PANJANG_HEADER);
    let salt = &header[MAGIC.len()..MAGIC.len() + PANJANG_SALT];
    let nonce = &header[MAGIC.len() + PANJANG_SALT..];
    let kunci = turunkan_kunci(sandi, salt)?;

    let cipher = XChaCha20Poly1305::new((&kunci).into());
    cipher
        .decrypt(XNonce::from_slice(nonce), Payload { msg: ct, aad: header })
        .map_err(|_| {
            format!("{GALAT_SANDI_SALAH}Kata sandi salah, atau berkas di Drive rusak/diubah. Data lokal tidak diubah.")
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn enkripsi_bolak_balik() {
        let isi = br#"{"profil":{"npsn":"10000001"}}"#;
        let berkas = enkripsi(isi, "rahasia-sekolah").unwrap();
        assert!(berkas.starts_with(MAGIC));
        assert!(
            !berkas.windows(isi.len()).any(|w| w == isi),
            "isi tidak boleh terlihat polos"
        );
        assert_eq!(dekripsi(&berkas, "rahasia-sekolah").unwrap(), isi);
    }

    #[test]
    fn salt_dan_nonce_berbeda_tiap_enkripsi() {
        let a = enkripsi(b"data", "rahasia-sekolah").unwrap();
        let b = enkripsi(b"data", "rahasia-sekolah").unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn sandi_salah_dan_berkas_diubah_ditolak() {
        let berkas = enkripsi(b"data sekolah", "rahasia-sekolah").unwrap();
        let galat = dekripsi(&berkas, "sandi-lain-123").unwrap_err();
        assert!(galat.starts_with(GALAT_SANDI_SALAH));

        let mut ubah = berkas.clone();
        let akhir = ubah.len() - 1;
        ubah[akhir] ^= 1;
        assert!(dekripsi(&ubah, "rahasia-sekolah").is_err());

        // Header (salt) diubah juga terdeteksi karena ikut diautentikasi.
        let mut ubah_header = berkas;
        ubah_header[MAGIC.len()] ^= 1;
        assert!(dekripsi(&ubah_header, "rahasia-sekolah").is_err());
    }

    #[test]
    fn berkas_asing_dan_sandi_pendek_ditolak() {
        assert!(dekripsi(b"{\"bukan\":\"terenkripsi\"}", "rahasia-sekolah").is_err());
        assert!(enkripsi(b"x", "pendek").is_err());
    }
}
