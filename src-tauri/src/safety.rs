//! Penjaga path terpusat untuk operasi file backup dan ekspor/impor JSON.

use std::path::{Path, PathBuf};

const SYSTEM_TOP_LEVEL: [&str; 9] = [
    "windows",
    "program files",
    "program files (x86)",
    "programdata",
    "$recycle.bin",
    "system volume information",
    "recovery",
    "perflogs",
    "windowsapps",
];

/// Path absolut Windows yang dinormalkan secara leksikal (huruf kecil, tanpa prefix `\\?\`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Norm(pub Vec<String>);

impl Norm {
    pub fn parse(path: &Path) -> Option<Self> {
        let raw = path.to_string_lossy().replace('/', "\\");
        let s = raw
            .strip_prefix(r"\\?\")
            .or_else(|| raw.strip_prefix(r"\\.\"))
            .unwrap_or(&raw);
        if s.starts_with(r"\\") || s.to_ascii_lowercase().starts_with("unc\\") {
            return None;
        }
        let mut parts = s.split('\\');
        let drive = parts.next()?.to_lowercase();
        let bytes = drive.as_bytes();
        if bytes.len() != 2 || !bytes[0].is_ascii_alphabetic() || bytes[1] != b':' {
            return None;
        }
        let mut out = vec![drive];
        for part in parts {
            match part {
                "" | "." => {}
                ".." => {
                    if out.len() > 1 {
                        out.pop();
                    }
                }
                p => {
                    let trimmed = p.trim_end_matches([' ', '.']);
                    if !trimmed.is_empty() {
                        out.push(trimmed.to_lowercase());
                    }
                }
            }
        }
        Some(Self(out))
    }

    pub fn starts_with(&self, other: &Self) -> bool {
        self.0.len() >= other.0.len() && self.0[..other.0.len()] == other.0[..]
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }
}

/// Pastikan `filename` adalah nama file backup tunggal (`backup-*.json`) di dalam `backups_dir`.
pub fn check_backup_file(backups_dir: &Path, filename: &str) -> Result<PathBuf, String> {
    if filename.is_empty()
        || filename.contains('/')
        || filename.contains('\\')
        || filename.contains(':')
        || filename.contains("..")
    {
        return Err("Nama file backup tidak valid.".to_string());
    }
    if !filename.starts_with("backup-") || !filename.ends_with(".json") {
        return Err("File backup harus berformat backup-*.json.".to_string());
    }

    let base_norm = Norm::parse(backups_dir)
        .ok_or_else(|| "Folder backup harus berupa path lokal yang valid.".to_string())?;
    let joined = backups_dir.join(filename);
    let target_norm =
        Norm::parse(&joined).ok_or_else(|| "Path target backup tidak valid.".to_string())?;

    if !target_norm.starts_with(&base_norm) || target_norm.len() != base_norm.len() + 1 {
        return Err("Path backup keluar dari folder backup yang diizinkan.".to_string());
    }

    Ok(joined)
}

/// Validasi path file JSON yang dipilih pengguna untuk ekspor atau impor.
pub fn check_user_json_path(path: &Path) -> Result<PathBuf, String> {
    check_user_file_path(path, "json")
}

/// Validasi path file yang dipilih pengguna lewat dialog simpan/buka, dengan ekstensi wajib
/// (mis. "json" untuk database, "pdf" untuk dokumen).
pub fn check_user_file_path(path: &Path, ekstensi: &str) -> Result<PathBuf, String> {
    let norm = Norm::parse(path).ok_or_else(|| {
        "Path file harus berupa path Windows lokal (bukan path jaringan/relatif).".to_string()
    })?;

    // Tolak root drive (mis. C:\ atau C:\file.json? len == 1 adalah root drive)
    if norm.len() <= 1 {
        return Err("Root drive tidak boleh dipilih.".to_string());
    }

    // Pastikan ekstensi sesuai pada komponen nama file terakhir
    let last = norm
        .0
        .last()
        .ok_or_else(|| "Nama file tidak ditemukan.".to_string())?;
    let akhiran = format!(".{}", ekstensi.to_ascii_lowercase());
    if !last.ends_with(&akhiran) || *last == akhiran {
        return Err(format!("File harus berekstensi {akhiran}."));
    }

    // Tolak folder sistem pada level pertama setelah drive
    if let Some(top) = norm.0.get(1)
        && SYSTEM_TOP_LEVEL.contains(&top.as_str())
    {
        return Err("Folder sistem Windows tidak boleh diakses.".to_string());
    }

    // Tolak path terlindungi dari environment variables Windows
    for env_key in [
        "SystemRoot",
        "windir",
        "ProgramFiles",
        "ProgramFiles(x86)",
        "ProgramW6432",
        "ProgramData",
    ] {
        if let Some(val) = std::env::var_os(env_key)
            && let Some(prot) = Norm::parse(&PathBuf::from(val))
            && norm.starts_with(&prot)
        {
            return Err("Folder sistem terlindungi tidak boleh diakses.".to_string());
        }
    }

    if let Some(profile) = std::env::var_os("USERPROFILE") {
        let profile_pb = PathBuf::from(profile);
        if let Some(prof_norm) = Norm::parse(&profile_pb) {
            if norm == prof_norm {
                return Err("Folder profil user tidak boleh dipilih.".to_string());
            }
            // Tolak AppData\Microsoft atau AppData\Local\Programs
            for sensitive in [
                profile_pb.join("AppData").join("Microsoft"),
                profile_pb.join("AppData").join("Roaming").join("Microsoft"),
                profile_pb.join("AppData").join("Local").join("Programs"),
            ] {
                if let Some(sens_norm) = Norm::parse(&sensitive)
                    && norm.starts_with(&sens_norm)
                {
                    return Err(
                        "Folder konfigurasi aplikasi sistem tidak boleh diakses.".to_string()
                    );
                }
            }
        }
    }

    // Tolak file yang diletakkan langsung di root drive (C:\data.json)
    if norm.len() == 2 {
        return Err(
            "Simpan file di dalam subfolder (misalnya Documents), bukan di root drive.".to_string(),
        );
    }

    Ok(path.to_path_buf())
}

/// Jenis berkas yang boleh diunggah ke Google Drive: (ekstensi, MIME).
pub const BERKAS_DRIVE: [(&str, &str); 3] = [
    ("pdf", "application/pdf"),
    (
        "docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ),
    (
        "xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ),
];

fn bersihkan_nama(teks: &str, maks: usize) -> String {
    let bersih: String = teks
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || " -_.()".contains(c) {
                c
            } else {
                '_'
            }
        })
        .collect();
    let bersih = bersih
        .trim_matches(|c: char| c == ' ' || c == '.')
        .to_string();
    bersih.chars().take(maks).collect()
}

/// Nama berkas yang aman untuk Drive, dengan ekstensi dari daftar yang diizinkan.
/// Mengembalikan (nama berkas lengkap, MIME).
pub fn nama_berkas_drive(nama: &str, ekstensi: &str) -> Result<(String, &'static str), String> {
    let ekstensi = ekstensi.to_ascii_lowercase();
    let (eks, mime) = BERKAS_DRIVE
        .iter()
        .find(|(e, _)| *e == ekstensi)
        .ok_or_else(|| "Jenis berkas ini tidak boleh diunggah ke Google Drive.".to_string())?;
    let akhiran = format!(".{eks}");
    let dasar = nama.strip_suffix(&akhiran).unwrap_or(nama);
    let dasar = bersihkan_nama(dasar, 150);
    if dasar.is_empty() {
        return Err("Nama berkas kosong.".to_string());
    }
    Ok((format!("{dasar}{akhiran}"), mime))
}

/// Nama subfolder dokumen di Drive (satu tingkat, mis. "2026-2027 Semester 1"). Kosong = langsung di folder Dokumen.
pub fn nama_folder_drive(folder: &str) -> String {
    bersihkan_nama(folder, 80)
}

/// NPSN sebagai bagian nama berkas database: angka/huruf saja.
pub fn npsn_aman(npsn: &str) -> Result<String, String> {
    let n = npsn.trim();
    if n.is_empty() || n.len() > 20 || !n.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err("NPSN sekolah belum diisi atau tidak valid; lengkapi di Profil.".to_string());
    }
    Ok(n.to_string())
}

/// ID berkas Google Drive hanya berisi huruf, angka, `-`, dan `_`.
pub fn id_drive_aman(id: &str) -> Result<&str, String> {
    if id.is_empty()
        || id.len() > 200
        || !id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("ID berkas Google Drive tidak valid.".to_string());
    }
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backup_file_valid_diterima() {
        let dir = Path::new(r"C:\Users\Guru\AppData\Roaming\ceklis-sd\backups");
        let res = check_backup_file(dir, "backup-20261115-183000.json");
        assert!(res.is_ok());
    }

    #[test]
    fn backup_file_traversal_dan_pola_salah_ditolak() {
        let dir = Path::new(r"C:\Users\Guru\AppData\Roaming\ceklis-sd\backups");
        assert!(check_backup_file(dir, r"..\database.json").is_err());
        assert!(check_backup_file(dir, "backup-2026/evil.json").is_err());
        assert!(check_backup_file(dir, "database.json").is_err());
        assert!(check_backup_file(dir, "backup-2026.exe").is_err());
        assert!(check_backup_file(dir, "backup-..json").is_err());
    }

    #[test]
    fn user_json_path_valid_diterima() {
        let p = Path::new(r"C:\Users\Guru\Documents\ceklis-sd-backup.json");
        assert!(check_user_json_path(p).is_ok());
    }

    #[test]
    fn user_pdf_path_diperiksa_ekstensinya() {
        assert!(check_user_file_path(Path::new(r"C:\Users\Guru\Documents\SK.pdf"), "pdf").is_ok());
        assert!(check_user_file_path(Path::new(r"C:\Users\Guru\Documents\SK.PDF"), "pdf").is_ok());
        assert!(
            check_user_file_path(Path::new(r"C:\Users\Guru\Documents\SK.pdf.exe"), "pdf").is_err()
        );
        assert!(check_user_file_path(Path::new(r"C:\Windows\SK.pdf"), "pdf").is_err());
        assert!(check_user_file_path(Path::new(r"C:\SK.pdf"), "pdf").is_err());
    }

    #[test]
    fn user_json_path_berbahaya_ditolak() {
        assert!(check_user_json_path(Path::new(r"C:\")).is_err());
        assert!(check_user_json_path(Path::new(r"C:\backup.json")).is_err());
        assert!(check_user_json_path(Path::new(r"\\server\share\data.json")).is_err());
        assert!(check_user_json_path(Path::new(r"C:\Windows\System32\data.json")).is_err());
        assert!(
            check_user_json_path(Path::new(
                r"C:\Users\Guru\Documents\..\..\..\Windows\x.json"
            ))
            .is_err()
        );
        assert!(check_user_json_path(Path::new(r"C:\Program Files\App\data.json")).is_err());
        assert!(check_user_json_path(Path::new(r"C:\Users\Guru\Documents\payload.exe")).is_err());
        assert!(check_user_json_path(Path::new(r"relative\data.json")).is_err());
    }

    #[test]
    fn nama_dan_folder_drive_dibersihkan() {
        let (nama, mime) = nama_berkas_drive(r"SK Beban/Mengajar..\x", "pdf").unwrap();
        assert_eq!(nama, "SK Beban_Mengajar.._x.pdf");
        assert_eq!(mime, "application/pdf");
        assert_eq!(
            nama_berkas_drive("Jadwal.docx", "DOCX").unwrap().0,
            "Jadwal.docx"
        );
        assert!(nama_berkas_drive("virus", "exe").is_err());
        assert!(nama_berkas_drive("...", "pdf").is_err());
        assert_eq!(
            nama_folder_drive("2026/2027 Semester 1"),
            "2026_2027 Semester 1"
        );
        assert_eq!(nama_folder_drive("../.."), "_");
        assert!(npsn_aman("10000001").is_ok());
        assert!(npsn_aman("' or 1=1").is_err());
        assert!(id_drive_aman("1AbC-d_9").is_ok());
        assert!(id_drive_aman("abc' or '1").is_err());
    }
}
