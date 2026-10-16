# SECURITY_PRIVACY.md

## Prinsip Privasi

- **Pemrosesan lokal**: semua file diproses di browser; tidak ada upload ke server.
- **Validasi**: cek MIME type dan ukuran sebelum diproses.
- **Resource Lifecycle**: revoke object URL setelah preview atau download selesai.
- **Tidak ada pelacakan**: tidak ada analytics, telemetry, atau pelaporan penggunaan.
- **Dependency Review**: hanya gunakan dependency yang sudah dievaluasi (lihat `docs/DEPENDENCIES.md`).
- **CORS & DRM**: tidak ada pengambilan konten dari sumber eksternal (fitur URL masa depan).

## Keamanan Kode
- **Sanitasi Input**: jangan percayakan ekstensi file; verifikasi MIME melalui `File.type` dan `ArrayBuffer` bila perlu.
- **Tidak mengeksekusi**: jangan pernah mengeksekusi konten file (misal, script dalam SVG).
- **Error Handling**: jangan mengekspose stack trace ke UI.

## Batasan
- Tidak ada enkripsi data karena semua berada di client.
- Tidak ada proteksi terhadap serangan file‑based (mis. malicious SVG) selain sanitasi minimal.

## Persetujuan Pengguna
- Tidak ada persetujuan eksplisit diperlukan karena tidak ada transfer data.
- UI dapat menampilkan disclaimer singkat: "Semua pemrosesan terjadi di perangkat Anda; tidak ada data yang di‑upload."

Dokumen ini menjadi acuan kebijakan privasi & keamanan untuk MVP.
