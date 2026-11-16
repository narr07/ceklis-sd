#[cfg(not(windows))]
compile_error!("ceklis-sd hanya ditujukan untuk Windows.");

use tauri::Manager;

mod commands;
mod gdrive;
mod pdf;
mod safety;
mod sandi;
mod storage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if let Some(w) = app.get_webview_window("main") {
                // Paksa tampilkan dan maksimalkan agar startup tersembunyi dari launcher tetap terlihat.
                let _ = w.show();
                let _ = w.maximize();
                let _ = w.set_focus();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_storage_status,
            commands::load_database,
            commands::save_database,
            commands::create_backup,
            commands::auto_backup_if_due,
            commands::list_backups,
            commands::restore_backup,
            commands::delete_backup,
            commands::export_database_file,
            commands::import_database_file,
            commands::prepare_sync_envelope,
            commands::apply_sync_envelope,
            commands::open_data_folder,
            commands::open_sp_datadik,
            commands::simpan_pdf,
            commands::google_status,
            commands::google_masuk,
            commands::google_batal_masuk,
            commands::google_putus,
            commands::drive_atur_sandi,
            commands::drive_lupakan_sandi,
            commands::drive_info_database,
            commands::drive_kirim_database,
            commands::drive_ambil_database,
            commands::drive_simpan_berkas,
            commands::drive_simpan_pdf,
            commands::drive_buka_folder,
        ])
        .run(tauri::generate_context!())
        .expect("gagal menjalankan Ceklis SD");
}
