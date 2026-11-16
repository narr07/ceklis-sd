//! Client ID OAuth Google (tipe Desktop) dimasukkan saat build, tidak di-commit ke repo.
//! Sumber: variabel lingkungan `CEKLIS_GOOGLE_CLIENT_ID`/`CEKLIS_GOOGLE_CLIENT_SECRET` (CI),
//! atau file `src-tauri/google-client.json` hasil unduhan Google Cloud Console (lokal, di-gitignore).
//! Tanpa keduanya aplikasi tetap terbangun; fitur Google Drive saja yang nonaktif.

fn main() {
    println!("cargo:rerun-if-env-changed=CEKLIS_GOOGLE_CLIENT_ID");
    println!("cargo:rerun-if-env-changed=CEKLIS_GOOGLE_CLIENT_SECRET");
    println!("cargo:rerun-if-changed=google-client.json");

    let dari_env = std::env::var("CEKLIS_GOOGLE_CLIENT_ID").is_ok_and(|v| !v.trim().is_empty());
    if !dari_env && let Ok(teks) = std::fs::read_to_string("google-client.json") {
        let v: serde_json::Value =
            serde_json::from_str(&teks).expect("google-client.json bukan JSON yang valid");
        let c = &v["installed"];
        match (c["client_id"].as_str(), c["client_secret"].as_str()) {
            (Some(id), Some(rahasia)) => {
                println!("cargo:rustc-env=CEKLIS_GOOGLE_CLIENT_ID={id}");
                println!("cargo:rustc-env=CEKLIS_GOOGLE_CLIENT_SECRET={rahasia}");
            }
            _ => {
                panic!("google-client.json harus berisi client OAuth tipe Desktop (\"installed\")")
            }
        }
    }

    tauri_build::build()
}
