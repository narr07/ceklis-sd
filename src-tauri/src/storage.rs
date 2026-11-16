//! Manajemen database lokal atomik (`database.json`), snapshot backup, dan paket sinkronisasi.

use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use chrono::{DateTime, Local, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::safety::check_backup_file;

const MAX_BACKUPS: usize = 20;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SyncEnvelope {
    pub schema_version: u32,
    pub npsn: String,
    pub sekolah: String,
    pub updated_at: String,
    pub checksum: String,
    pub data: Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StorageStatus {
    pub db_path: String,
    pub backups_dir: String,
    pub exists: bool,
    pub size_bytes: u64,
    pub updated_at: Option<String>,
    pub checksum: Option<String>,
    pub backup_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BackupEntry {
    pub filename: String,
    pub created_at: String,
    pub size_bytes: u64,
    pub checksum: String,
}

pub fn default_data_dir() -> Result<PathBuf, String> {
    let base = std::env::var_os("APPDATA")
        .or_else(|| std::env::var_os("LOCALAPPDATA"))
        .ok_or_else(|| "Variabel lingkungan APPDATA tidak ditemukan.".to_string())?;
    Ok(PathBuf::from(base).join("ceklis-sd"))
}

pub fn db_file(dir: &Path) -> PathBuf {
    dir.join("database.json")
}

pub fn backups_dir(dir: &Path) -> PathBuf {
    dir.join("backups")
}

pub fn canonical_checksum(data: &Value) -> Result<String, String> {
    let bytes = serde_json::to_vec(data)
        .map_err(|e| format!("Gagal menserialisasi data untuk checksum: {e}"))?;
    Ok(blake3::hash(&bytes).to_hex().to_string())
}

/// Tulis file secara atomik: isi ditulis ke file sementara, di-flush ke disk, lalu di-rename.
///
/// File lama TIDAK dihapus lebih dulu. Di Windows `fs::rename` memakai `MoveFileExW` dengan
/// `MOVEFILE_REPLACE_EXISTING`, jadi target diganti dalam satu langkah; kalau listrik padam
/// di tengah proses, yang tersisa adalah file lama yang utuh, bukan file kosong/hilang.
pub fn write_atomic(target: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Gagal membuat folder data {}: {e}", parent.display()))?;
    }
    let tmp = target.with_extension("json.tmp");
    let tulis = || -> io::Result<()> {
        let mut f = fs::File::create(&tmp)?;
        f.write_all(bytes)?;
        f.sync_all()
    };
    if let Err(e) = tulis() {
        let _ = fs::remove_file(&tmp);
        return Err(format!("Gagal menulis file sementara: {e}"));
    }
    fs::rename(&tmp, target).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        format!("Gagal menyimpan {}: {e}", target.display())
    })
}

fn format_modified(meta: &fs::Metadata) -> Option<String> {
    meta.modified().ok().map(|st| {
        let dt: DateTime<Utc> = st.into();
        dt.to_rfc3339()
    })
}

pub fn load_db_from(dir: &Path) -> Result<Option<Value>, String> {
    let path = db_file(dir);
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Gagal membaca database lokal {}: {e}", path.display()))?;
    let val: Value =
        serde_json::from_str(&raw).map_err(|e| format!("Format JSON database lokal rusak: {e}"))?;
    Ok(Some(val))
}

pub fn save_db_to(dir: &Path, data: &Value) -> Result<StorageStatus, String> {
    let path = db_file(dir);
    let bytes = serde_json::to_vec_pretty(data)
        .map_err(|e| format!("Gagal memformat JSON database: {e}"))?;
    write_atomic(&path, &bytes)?;
    status_in(dir)
}

pub fn status_in(dir: &Path) -> Result<StorageStatus, String> {
    let path = db_file(dir);
    let bdir = backups_dir(dir);
    let backups = list_backups_in(dir).unwrap_or_default();

    if !path.exists() {
        return Ok(StorageStatus {
            db_path: path.to_string_lossy().to_string(),
            backups_dir: bdir.to_string_lossy().to_string(),
            exists: false,
            size_bytes: 0,
            updated_at: None,
            checksum: None,
            backup_count: backups.len(),
        });
    }

    let meta = fs::metadata(&path).map_err(|e| format!("Gagal membaca metadata database: {e}"))?;
    let data = load_db_from(dir)?;
    let checksum = match data.as_ref() {
        Some(v) => Some(canonical_checksum(v)?),
        None => None,
    };

    Ok(StorageStatus {
        db_path: path.to_string_lossy().to_string(),
        backups_dir: bdir.to_string_lossy().to_string(),
        exists: true,
        size_bytes: meta.len(),
        updated_at: format_modified(&meta),
        checksum,
        backup_count: backups.len(),
    })
}

fn unique_backup_path(bdir: &Path, tag: Option<&str>) -> PathBuf {
    let stamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let suffix = tag
        .filter(|t| !t.is_empty())
        .map(|t| format!("-{t}"))
        .unwrap_or_default();
    let base_name = format!("backup-{stamp}{suffix}.json");
    let first = bdir.join(&base_name);
    if !first.exists() {
        return first;
    }
    for idx in 1..=99 {
        let candidate = bdir.join(format!("backup-{stamp}{suffix}-{idx}.json"));
        if !candidate.exists() {
            return candidate;
        }
    }
    bdir.join(format!(
        "backup-{stamp}{suffix}-{}.json",
        Utc::now().timestamp_millis()
    ))
}

fn prune_old_backups(bdir: &Path) -> io::Result<()> {
    let mut entries: Vec<(String, PathBuf)> = Vec::new();
    for item in fs::read_dir(bdir)? {
        let entry = item?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with("backup-") && name.ends_with(".json") {
            entries.push((name, entry.path()));
        }
    }
    entries.sort_by(|a, b| b.0.cmp(&a.0));
    for (_, path) in entries.into_iter().skip(MAX_BACKUPS) {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

pub fn create_backup_in(dir: &Path, tag: Option<&str>) -> Result<BackupEntry, String> {
    let data =
        load_db_from(dir)?.ok_or_else(|| "Database lokal belum ada untuk dibackup.".to_string())?;
    let bdir = backups_dir(dir);
    fs::create_dir_all(&bdir)
        .map_err(|e| format!("Gagal membuat folder backup {}: {e}", bdir.display()))?;

    let target = unique_backup_path(&bdir, tag);
    let bytes = serde_json::to_vec_pretty(&data)
        .map_err(|e| format!("Gagal memformat JSON backup: {e}"))?;
    write_atomic(&target, &bytes)?;
    let _ = prune_old_backups(&bdir);

    let meta = fs::metadata(&target).map_err(|e| format!("Gagal membaca metadata backup: {e}"))?;
    let filename = target
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(BackupEntry {
        filename,
        created_at: format_modified(&meta).unwrap_or_else(|| Utc::now().to_rfc3339()),
        size_bytes: meta.len(),
        checksum: canonical_checksum(&data)?,
    })
}

pub fn list_backups_in(dir: &Path) -> Result<Vec<BackupEntry>, String> {
    let bdir = backups_dir(dir);
    if !bdir.exists() {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    let rd = fs::read_dir(&bdir).map_err(|e| format!("Gagal membaca folder backup: {e}"))?;
    for item in rd {
        let entry = item.map_err(|e| format!("Gagal membaca entri backup: {e}"))?;
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with("backup-") || !name.ends_with(".json") {
            continue;
        }
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let meta = fs::metadata(&path)
            .map_err(|e| format!("Gagal membaca metadata backup {name}: {e}"))?;
        let checksum = fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
            .and_then(|v| canonical_checksum(&v).ok())
            .unwrap_or_default();
        out.push(BackupEntry {
            filename: name,
            created_at: format_modified(&meta).unwrap_or_default(),
            size_bytes: meta.len(),
            checksum,
        });
    }
    out.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(out)
}

/// Buat backup bertanda `harian` bila database ada dan backup terbaru (jenis apa pun)
/// lebih tua dari `max_age`. Mengembalikan `None` bila belum waktunya atau database belum ada.
pub fn auto_backup_if_due_in(dir: &Path, max_age: Duration) -> Result<Option<BackupEntry>, String> {
    if !db_file(dir).exists() {
        return Ok(None);
    }
    let bdir = backups_dir(dir);
    let mut terbaru: Option<SystemTime> = None;
    if bdir.exists() {
        let rd = fs::read_dir(&bdir).map_err(|e| format!("Gagal membaca folder backup: {e}"))?;
        for entry in rd.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if !name.starts_with("backup-") || !name.ends_with(".json") {
                continue;
            }
            if let Ok(modified) = entry.metadata().and_then(|m| m.modified()) {
                terbaru = Some(terbaru.map_or(modified, |t| t.max(modified)));
            }
        }
    }
    let perlu = match terbaru {
        None => true,
        Some(t) => SystemTime::now()
            .duration_since(t)
            .map(|umur| umur >= max_age)
            .unwrap_or(false),
    };
    if !perlu {
        return Ok(None);
    }
    create_backup_in(dir, Some("harian")).map(Some)
}

pub fn restore_backup_in(dir: &Path, filename: &str) -> Result<Value, String> {
    let bdir = backups_dir(dir);
    let target = check_backup_file(&bdir, filename)?;
    if !target.exists() {
        return Err(format!("File backup {filename} tidak ditemukan."));
    }
    let raw = fs::read_to_string(&target)
        .map_err(|e| format!("Gagal membaca file backup {filename}: {e}"))?;
    let val: Value = serde_json::from_str(&raw)
        .map_err(|e| format!("Isi file backup {filename} bukan JSON valid: {e}"))?;

    // Buat backup pengaman dari data saat ini sebelum menimpa
    if db_file(dir).exists() {
        let _ = create_backup_in(dir, Some("sebelum-pulih"));
    }
    save_db_to(dir, &val)?;
    Ok(val)
}

pub fn delete_backup_in(dir: &Path, filename: &str) -> Result<(), String> {
    let bdir = backups_dir(dir);
    let target = check_backup_file(&bdir, filename)?;
    if !target.exists() {
        return Err(format!("File backup {filename} tidak ditemukan."));
    }
    fs::remove_file(&target).map_err(|e| format!("Gagal menghapus backup {filename}: {e}"))
}

pub fn build_sync_envelope(dir: &Path, npsn: &str, sekolah: &str) -> Result<SyncEnvelope, String> {
    let data = load_db_from(dir)?.ok_or_else(|| {
        "Database lokal belum tersimpan; simpan profil terlebih dahulu.".to_string()
    })?;
    let checksum = canonical_checksum(&data)?;
    Ok(SyncEnvelope {
        schema_version: 1,
        npsn: npsn.to_string(),
        sekolah: sekolah.to_string(),
        updated_at: Utc::now().to_rfc3339(),
        checksum,
        data,
    })
}

pub fn verify_and_apply_envelope(dir: &Path, envelope: &SyncEnvelope) -> Result<Value, String> {
    let actual = canonical_checksum(&envelope.data)?;
    // Checksum BLAKE3 hanya mendeteksi paket yang rusak/terpotong. Ini bukan autentikasi:
    // siapa pun bisa menghitung ulang checksum, jadi keaslian dijaga oleh token server.
    if !envelope.checksum.is_empty() && actual != envelope.checksum {
        return Err(
            "Checksum paket tidak cocok: file/paket rusak atau terpotong, sehingga data lokal tidak diubah."
                .to_string(),
        );
    }
    if db_file(dir).exists() {
        let _ = create_backup_in(dir, Some("sebelum-sinkron"));
    }
    save_db_to(dir, &envelope.data)?;
    Ok(envelope.data.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn simpan_muat_dan_status_atomik() {
        let tmp = tempfile::tempdir().unwrap();
        assert!(load_db_from(tmp.path()).unwrap().is_none());

        let payload = json!({
            "profil": { "sekolah": "SD Negeri Contoh 1", "npsn": "10000001" },
            "periode": { "ta": "2026/2027", "semester": "ganjil" }
        });
        let st = save_db_to(tmp.path(), &payload).unwrap();
        assert!(st.exists);
        assert!(st.size_bytes > 0);
        assert!(st.checksum.is_some());

        let loaded = load_db_from(tmp.path()).unwrap().unwrap();
        assert_eq!(loaded, payload);
    }

    #[test]
    fn backup_dan_pulihkan_otomatis_menjaga_data_lama() {
        let tmp = tempfile::tempdir().unwrap();
        let awal = json!({ "versi": 1 });
        save_db_to(tmp.path(), &awal).unwrap();
        let b1 = create_backup_in(tmp.path(), None).unwrap();

        let baru = json!({ "versi": 2 });
        save_db_to(tmp.path(), &baru).unwrap();

        let restored = restore_backup_in(tmp.path(), &b1.filename).unwrap();
        assert_eq!(restored, awal);

        let daftar = list_backups_in(tmp.path()).unwrap();
        assert!(daftar.len() >= 2);
        assert!(daftar.iter().any(|x| x.filename.contains("sebelum-pulih")));
    }

    #[test]
    fn simpan_ulang_menimpa_tanpa_menyisakan_file_sementara() {
        let tmp = tempfile::tempdir().unwrap();
        save_db_to(tmp.path(), &json!({ "versi": 1 })).unwrap();
        save_db_to(tmp.path(), &json!({ "versi": 2 })).unwrap();
        assert_eq!(
            load_db_from(tmp.path()).unwrap().unwrap(),
            json!({ "versi": 2 })
        );
        assert!(!db_file(tmp.path()).with_extension("json.tmp").exists());
    }

    #[test]
    fn backup_harian_hanya_dibuat_bila_sudah_waktunya() {
        let tmp = tempfile::tempdir().unwrap();
        // Database belum ada: tidak ada yang dibackup.
        assert!(
            auto_backup_if_due_in(tmp.path(), Duration::from_secs(3600))
                .unwrap()
                .is_none()
        );

        save_db_to(tmp.path(), &json!({ "versi": 1 })).unwrap();
        let pertama = auto_backup_if_due_in(tmp.path(), Duration::from_secs(3600)).unwrap();
        assert!(pertama.unwrap().filename.contains("harian"));

        // Backup barusan dibuat, jadi belum waktunya lagi.
        assert!(
            auto_backup_if_due_in(tmp.path(), Duration::from_secs(3600))
                .unwrap()
                .is_none()
        );
        // Dengan batas umur nol, backup baru selalu dibuat.
        assert!(
            auto_backup_if_due_in(tmp.path(), Duration::ZERO)
                .unwrap()
                .is_some()
        );
    }

    #[test]
    fn sync_envelope_valid_diterima_dan_checksum_palsu_ditolak() {
        let tmp = tempfile::tempdir().unwrap();
        let payload = json!({ "profil": { "npsn": "10000001" } });
        save_db_to(tmp.path(), &payload).unwrap();

        let env = build_sync_envelope(tmp.path(), "10000001", "SD Negeri Contoh 1").unwrap();
        assert_eq!(env.checksum, canonical_checksum(&payload).unwrap());

        let mut palsu = env.clone();
        palsu.checksum = "0000deadbeef".to_string();
        assert!(verify_and_apply_envelope(tmp.path(), &palsu).is_err());

        let mut ubah = env.clone();
        ubah.data = json!({ "profil": { "npsn": "99999999" } });
        ubah.checksum = canonical_checksum(&ubah.data).unwrap();
        let applied = verify_and_apply_envelope(tmp.path(), &ubah).unwrap();
        assert_eq!(applied, ubah.data);
    }
}
