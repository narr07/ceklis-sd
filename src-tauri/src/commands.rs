//! Command Tauri async untuk manajemen database lokal, backup, ekspor/impor, dan sinkronisasi.

use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use chrono::Utc;
use serde_json::Value;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

use crate::safety::{check_user_file_path, check_user_json_path};
use crate::storage::{
    BackupEntry, StorageStatus, SyncEnvelope, auto_backup_if_due_in, build_sync_envelope,
    canonical_checksum, create_backup_in, db_file, default_data_dir, delete_backup_in,
    list_backups_in, load_db_from, restore_backup_in, save_db_to, status_in,
    verify_and_apply_envelope, write_atomic,
};

/// Umur maksimal backup terbaru sebelum backup harian otomatis dibuat.
const AUTO_BACKUP_MAX_AGE: Duration = Duration::from_secs(24 * 60 * 60);

#[tauri::command]
pub async fn get_storage_status() -> Result<StorageStatus, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || status_in(&dir))
        .await
        .map_err(|e| format!("Gagal memeriksa status penyimpanan: {e}"))?
}

#[tauri::command]
pub async fn load_database() -> Result<Option<Value>, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || load_db_from(&dir))
        .await
        .map_err(|e| format!("Gagal memuat database lokal: {e}"))?
}

#[tauri::command]
pub async fn save_database(data: Value) -> Result<StorageStatus, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || save_db_to(&dir, &data))
        .await
        .map_err(|e| format!("Gagal menyimpan database lokal: {e}"))?
}

#[tauri::command]
pub async fn create_backup() -> Result<BackupEntry, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || create_backup_in(&dir, None))
        .await
        .map_err(|e| format!("Gagal membuat backup lokal: {e}"))?
}

/// Backup harian otomatis: backend sendiri yang memutuskan perlu tidaknya, UI hanya memicu.
#[tauri::command]
pub async fn auto_backup_if_due() -> Result<Option<BackupEntry>, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || auto_backup_if_due_in(&dir, AUTO_BACKUP_MAX_AGE))
        .await
        .map_err(|e| format!("Gagal menjalankan backup harian: {e}"))?
}

#[tauri::command]
pub async fn list_backups() -> Result<Vec<BackupEntry>, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || list_backups_in(&dir))
        .await
        .map_err(|e| format!("Gagal membaca daftar backup: {e}"))?
}

#[tauri::command]
pub async fn restore_backup(filename: String) -> Result<Value, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || restore_backup_in(&dir, &filename))
        .await
        .map_err(|e| format!("Gagal memulihkan backup: {e}"))?
}

#[tauri::command]
pub async fn delete_backup(filename: String) -> Result<(), String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || delete_backup_in(&dir, &filename))
        .await
        .map_err(|e| format!("Gagal menghapus backup: {e}"))?
}

#[tauri::command]
pub async fn export_database_file(
    app: tauri::AppHandle,
    data: Value,
    default_name: String,
) -> Result<Option<String>, String> {
    let safe_name = if default_name.ends_with(".json") {
        default_name
    } else {
        format!("{default_name}.json")
    };

    let picked = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .set_file_name(&safe_name)
            .add_filter("Database Ceklis SD (JSON)", &["json"])
            .blocking_save_file()
    })
    .await
    .map_err(|e| format!("Gagal membuka dialog simpan: {e}"))?;

    let Some(file_path) = picked else {
        return Ok(None);
    };
    let path: PathBuf = file_path
        .into_path()
        .map_err(|e| format!("Path ekspor tidak valid: {e}"))?;
    let checked = check_user_json_path(&path)?;

    tauri::async_runtime::spawn_blocking(move || {
        let npsn = data
            .get("profil")
            .and_then(|p| p.get("npsn"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let sekolah = data
            .get("profil")
            .and_then(|p| p.get("sekolah"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let checksum = canonical_checksum(&data)?;
        let envelope = SyncEnvelope {
            schema_version: 1,
            npsn,
            sekolah,
            updated_at: Utc::now().to_rfc3339(),
            checksum,
            data,
        };
        let bytes = serde_json::to_vec_pretty(&envelope)
            .map_err(|e| format!("Gagal memformat file ekspor: {e}"))?;
        write_atomic(&checked, &bytes)?;
        Ok(Some(checked.to_string_lossy().to_string()))
    })
    .await
    .map_err(|e| format!("Gagal mengekspor database: {e}"))?
}

#[tauri::command]
pub async fn import_database_file(app: tauri::AppHandle) -> Result<Option<Value>, String> {
    let picked = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .add_filter("Database Ceklis SD (JSON)", &["json"])
            .blocking_pick_file()
    })
    .await
    .map_err(|e| format!("Gagal membuka dialog pilih file: {e}"))?;

    let Some(file_path) = picked else {
        return Ok(None);
    };
    let path: PathBuf = file_path
        .into_path()
        .map_err(|e| format!("Path impor tidak valid: {e}"))?;
    let checked = check_user_json_path(&path)?;
    let dir = default_data_dir()?;

    tauri::async_runtime::spawn_blocking(move || {
        let raw = fs::read_to_string(&checked)
            .map_err(|e| format!("Gagal membaca file {}: {e}", checked.display()))?;
        let parsed: Value =
            serde_json::from_str(&raw).map_err(|e| format!("File bukan JSON valid: {e}"))?;

        if parsed.get("schemaVersion").is_some() && parsed.get("data").is_some() {
            let envelope: SyncEnvelope = serde_json::from_value(parsed)
                .map_err(|e| format!("Format SyncEnvelope tidak valid: {e}"))?;
            let applied = verify_and_apply_envelope(&dir, &envelope)?;
            return Ok(Some(applied));
        }

        if db_file(&dir).exists() {
            let _ = create_backup_in(&dir, Some("sebelum-impor"));
        }
        save_db_to(&dir, &parsed)?;
        Ok(Some(parsed))
    })
    .await
    .map_err(|e| format!("Gagal mengimpor file: {e}"))?
}

#[tauri::command]
pub async fn prepare_sync_envelope(npsn: String, sekolah: String) -> Result<SyncEnvelope, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || build_sync_envelope(&dir, &npsn, &sekolah))
        .await
        .map_err(|e| format!("Gagal menyiapkan paket sinkronisasi: {e}"))?
}

#[tauri::command]
pub async fn apply_sync_envelope(envelope: SyncEnvelope) -> Result<Value, String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || verify_and_apply_envelope(&dir, &envelope))
        .await
        .map_err(|e| format!("Gagal menerapkan data dari server: {e}"))?
}

/// Simpan halaman dokumen yang sedang tampil sebagai PDF. Pengguna memilih lokasi lewat dialog;
/// UI hanya mengirim nama file usulan, bukan path.
#[tauri::command]
pub async fn simpan_pdf(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    nama_berkas: String,
) -> Result<Option<String>, String> {
    let usulan: String = nama_berkas
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || " -_.()".contains(c) {
                c
            } else {
                '_'
            }
        })
        .collect();
    let usulan = if usulan.to_ascii_lowercase().ends_with(".pdf") {
        usulan
    } else {
        format!("{usulan}.pdf")
    };

    let dipilih = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .set_file_name(&usulan)
            .add_filter("Dokumen PDF", &["pdf"])
            .blocking_save_file()
    })
    .await
    .map_err(|e| format!("Gagal membuka dialog simpan: {e}"))?;

    let Some(berkas) = dipilih else {
        return Ok(None);
    };
    let path: PathBuf = berkas
        .into_path()
        .map_err(|e| format!("Path PDF tidak valid: {e}"))?;
    let tujuan = check_user_file_path(&path, "pdf")?;

    tauri::async_runtime::spawn_blocking(move || {
        let bytes = crate::pdf::pdf_halaman(&window)?;
        write_atomic(&tujuan, &bytes)?;
        Ok(Some(tujuan.to_string_lossy().to_string()))
    })
    .await
    .map_err(|e| format!("Gagal membuat PDF: {e}"))?
}

/// Alamat SP Datadik untuk mengunduh SPTJM. Ditetapkan di backend: UI hanya meminta
/// "buka SP Datadik", tidak bisa menyuruh backend membuka URL sembarang.
const URL_SP_DATADIK: &str = "https://sp.datadik.kemendikdasmen.go.id";

#[tauri::command]
pub async fn open_sp_datadik(app: tauri::AppHandle) -> Result<(), String> {
    app.opener()
        .open_url(URL_SP_DATADIK, None::<&str>)
        .map_err(|e| format!("Gagal membuka SP Datadik di browser: {e}"))
}

#[tauri::command]
pub async fn open_data_folder(app: tauri::AppHandle) -> Result<(), String> {
    let dir = default_data_dir()?;
    tauri::async_runtime::spawn_blocking(move || -> Result<(), String> {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Gagal membuat folder data {}: {e}", dir.display()))?;
        app.opener()
            .open_path(dir.to_string_lossy().as_ref(), None::<&str>)
            .map_err(|e| format!("Gagal membuka folder data: {e}"))
    })
    .await
    .map_err(|e| format!("Gagal menjalankan pembuka folder: {e}"))?
}

/* ── Google Drive milik sekolah (lihat gdrive.rs) ── */

#[tauri::command]
pub async fn google_status() -> Result<crate::gdrive::StatusGoogle, String> {
    tauri::async_runtime::spawn_blocking(crate::gdrive::status)
        .await
        .map_err(|e| format!("Gagal membaca status Google Drive: {e}"))?
}

#[tauri::command]
pub async fn google_masuk(app: tauri::AppHandle) -> Result<crate::gdrive::StatusGoogle, String> {
    crate::gdrive::masuk(&app).await
}

#[tauri::command]
pub async fn google_batal_masuk() -> Result<(), String> {
    crate::gdrive::batal_masuk();
    Ok(())
}

#[tauri::command]
pub async fn google_putus() -> Result<crate::gdrive::StatusGoogle, String> {
    crate::gdrive::putus().await
}

#[tauri::command]
pub async fn drive_atur_sandi(sandi: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || crate::gdrive::atur_sandi(&sandi))
        .await
        .map_err(|e| format!("Gagal menyimpan kata sandi: {e}"))?
}

#[tauri::command]
pub async fn drive_lupakan_sandi() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(crate::gdrive::lupakan_sandi)
        .await
        .map_err(|e| format!("Gagal menghapus kata sandi: {e}"))?
}

#[tauri::command]
pub async fn drive_info_database(
    npsn: String,
) -> Result<Option<crate::gdrive::InfoDatabase>, String> {
    crate::gdrive::info_database(&npsn).await
}

#[tauri::command]
pub async fn drive_kirim_database(
    npsn: String,
    sekolah: String,
    versi_dasar: String,
    paksa: bool,
) -> Result<crate::gdrive::InfoDatabase, String> {
    crate::gdrive::kirim_database(&npsn, &sekolah, &versi_dasar, paksa).await
}

#[tauri::command]
pub async fn drive_ambil_database(
    npsn: String,
    sandi: Option<String>,
) -> Result<crate::gdrive::HasilAmbil, String> {
    crate::gdrive::ambil_database(&npsn, sandi).await
}

/// Unggah berkas yang dibuat di frontend (mis. .docx/.xlsx). Isi dikirim sebagai body mentah;
/// nama, ekstensi, dan folder lewat header (di-encode URI) lalu dibersihkan di backend.
#[tauri::command]
pub async fn drive_simpan_berkas(
    request: tauri::ipc::Request<'_>,
) -> Result<crate::gdrive::HasilUnggah, String> {
    let tauri::ipc::InvokeBody::Raw(isi) = request.body() else {
        return Err("Isi berkas harus dikirim sebagai data biner.".to_string());
    };
    let header = |k: &str| -> String {
        let mentah = request
            .headers()
            .get(k)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        reqwest::Url::parse(&format!("http://x/?v={mentah}"))
            .ok()
            .and_then(|u| u.query_pairs().next().map(|(_, v)| v.into_owned()))
            .unwrap_or_default()
    };
    let (nama, ekstensi, folder) = (header("x-nama"), header("x-ekstensi"), header("x-folder"));
    let isi = isi.clone();
    crate::gdrive::simpan_dokumen(&nama, &ekstensi, &folder, isi).await
}

/// Buat PDF dari dokumen yang sedang disiapkan untuk dicetak, lalu simpan ke Google Drive.
#[tauri::command]
pub async fn drive_simpan_pdf(
    window: tauri::WebviewWindow,
    nama_berkas: String,
    folder: String,
) -> Result<crate::gdrive::HasilUnggah, String> {
    let isi = tauri::async_runtime::spawn_blocking(move || crate::pdf::pdf_halaman(&window))
        .await
        .map_err(|e| format!("Gagal membuat PDF: {e}"))??;
    crate::gdrive::simpan_dokumen(&nama_berkas, "pdf", &folder, isi).await
}

/// Buka folder "Ceklis SD" di Google Drive (URL dibangun backend dari ID folder).
#[tauri::command]
pub async fn drive_buka_folder(app: tauri::AppHandle) -> Result<(), String> {
    let url = crate::gdrive::url_folder_utama().await?;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("Gagal membuka Google Drive di browser: {e}"))
}
