# 🏢 Blob Office: OpenCode Session Character Visualizer

Visualizer sesi AI coding dan multi-agent berbasis procedural blob character, terinspirasi oleh arsitektur Session-Character-Visualizer (Caffa).

Setiap sesi dan agen dirender sebagai karakter blob membal (*spring physics*) dengan balon dialog status, panel kode One Dark animasi mesin tik, dan sub-agent mini yang mengorbit agen induknya.

---

## Fitur Utama

- **Fisika Organik Prosedural (p5.js):** Gerakan membal, bayangan dinamis, dan kedipan mata dengan interpolasi pegas (*spring physics*).
- **Warna Sesi Unik Persisten:** Setiap sesi mendapatkan hue warna khas (0–360°) berbasis hash session ID.
- **Micro-Animations Responsif Tool:**
  - 🧠 **Thinking:** Lingkaran aura membesar lambat dan partikel bintang melayang naik.
  - ✏️ **Editing:** Panel kode One Dark meluncur keluar dengan animasi mesin tik (*typewriter effect*) dan kursor berkedip.
  - 📖 **Reading:** Buku membuka/menutup dan kacamata baca bergoyang saat scanning file/vektor.
  - 💻 **Running:** Garis kecepatan (*motion streaks*) dan getaran frekuensi tinggi saat terminal dieksekusi.
  - ⚠️ **Waiting:** Goyangan gelisah (*nervous shake*) dengan tanda tanya membal saat menunggu input atau izin user.
  - ❌ **Error:** Mata silang `X_X`, getaran cepat, dan kilatan petir.
  - 💤 **Idle:** Kedipan tenang dan pernapasan halus saat sesi siaga.
- **Subagent Orbiting:** Sub-proses atau sub-agent mini (skala 60%) berputar mengorbit agen induk dengan jalur konektor visual.
- **Inter-Agent Pipeline Handoff Beams:** Sinar laser energi melengkung (*curved glowing bezier beam*) dengan paket data bercahaya dan label payload (`Raw WebP`, `16.7MP JPEG`, dll.) yang mengalir antar-agen saat tugas diserahterimakan, lengkap dengan dialog operan tugas.
- **Tata Letak Adaptif 4-Kuadran:** Distribusi spasial dinamis mengikuti aspek rasio kanvas lebar untuk mencegah agen dan balon dialog saling bertabrakan atau berhimpitan.
- **Dynamic Telemetry & Embed Mode:** Auto-discovery WebSocket (`ws://` / `wss://`), scoping room dinamis via query param `?room=...`, dan mode sematan bersih (`?hideControl=true` atau iframe detection) tanpa interupsi controller demo.
- **Dual Mode:** Otomatis mendengarkan WebSocket OpenCode / Hermes Telemetry, dengan simulator bawaan & panel kontrol interaktif jika backend belum aktif.

---

## Quick Start

### 1. Menjalankan di Lingkungan Lokal

```bash
# Install dependensi
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:5173/` pada peramban.

### 2. Membangun untuk Produksi

```bash
npm run build
npm run preview
```

### 3. Integrasi OpenCode Plugin

Tambahkan konfigurasi berikut pada `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["blob-office"]
}
```

---

## Arsitektur Sistem

```text
OpenCode Engine / Local Agents
       |
       v (JSON Events via WebSocket :2727)
  [ BlobWebSocketClient ]
       |
       +--------> [ BlobRenderer (p5.js) ]
       |                 |
[ BlobSimulator ]        +--> Radial Position & Spring Physics
(Fallback Mock)          +--> Dynamic Speech Bubbles & Name Tags
                         +--> One Dark Code Panel & Tool Props
```

---

## Pengujian & Linting

```bash
# Typecheck TypeScript
npm run lint

# Jalankan automated unit & benchmark tests
npm run test
```

---

## Lisensi

MIT License.
