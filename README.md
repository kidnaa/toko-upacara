# Toko Alat Upacara

## Project progress

See [Project status](PROJECT-STATUS.md) for the planned milestones, phase schedule,
Gantt chart, and verified progress snapshot.

## Jalankan seluruh aplikasi dengan Docker

Pastikan Docker Desktop aktif. Salin `.env.example` menjadi `.env`, lalu isi semua nilai rahasia dengan nilai unik:

```sh
Copy-Item .env.example .env
```

Isi `POSTGRES_PASSWORD`, `JWT_SECRET` (minimal 32 karakter), `OWNER_PASSWORD`, dan `STAFF_PASSWORD` (masing-masing minimal 12 karakter). Jangan gunakan contoh password dari proyek lain. Setelah itu jalankan:

```sh
docker compose up --build
```

Setelah semua container siap, buka <http://localhost:8080>. Compose akan menjalankan PostgreSQL, membuat tabel yang belum ada, membuat akun awal, API, dan frontend. API hanya diakses melalui frontend; PostgreSQL hanya terikat ke localhost di port `5432`.

Pada database yang benar-benar baru, seed membuat akun dengan email berikut dan password yang diatur di `.env`:

- Pemilik: `owner@toko.local`
- Petugas: `staff@toko.local`

Jika volume database sudah berisi akun, seed tidak mengganti password akun yang ada. Gunakan password yang sudah tersimpan sebelumnya.

Untuk menghentikan aplikasi tekan `Ctrl+C`, atau jalankan `docker compose down`. Data database tetap tersimpan di volume `pgdata`. **Jangan gunakan `docker compose down -v` kecuali memang ingin menghapus seluruh data database.**

File `.env` tidak ikut di Git. Untuk deployment publik, simpan nilai rahasia melalui secret manager/environment deployment, gunakan HTTPS, dan tinjau aturan jaringan serta CORS.
