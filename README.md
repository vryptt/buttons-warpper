# Enhanced WhiskeySockets Interactive Buttons

[![npm version](https://img.shields.io/npm/v/buttons-warpper.svg?style=flat-square)](https://www.npmjs.com/package/buttons-warpper)
[![License](https://img.shields.io/npm/l/buttons-warpper.svg?style=flat-square)](https://github.com/vryptt/buttons-warpper/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/buttons-warpper.svg?style=flat-square)](https://nodejs.org)
[![Downloads](https://img.shields.io/npm/dm/buttons-warpper.svg?style=flat-square)](https://www.npmjs.com/package/buttons-warpper)

> Solusi komprehensif untuk mengirim tombol interaktif dan native flow WhatsApp menggunakan WhiskeySockets (fork Baileys) tanpa memodifikasi kode sumber inti.

## 📋 Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Pernyataan Masalah](#pernyataan-masalah)
- [Solusi](#solusi)
- [Fitur Utama](#fitur-utama)
- [Instalasi](#instalasi)
- [Memulai Cepat](#memulai-cepat)
- [Jenis Tombol yang Didukung](#jenis-tombol-yang-didukung)
- [Referensi API](#referensi-api)
- [Detail Teknis](#detail-teknis)
- [Kompatibilitas](#kompatibilitas)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## 🎯 Gambaran Umum

Package ini menyediakan fungsi untuk mengirim setiap jenis tombol interaktif dan native flow WhatsApp yang saat ini diketahui menggunakan WhiskeySockets. Fungsi ini dikemas sebagai package npm `buttons-warpper`, yang mereproduksi struktur binary node yang dipancarkan oleh klien WhatsApp resmi, memastikan tombol dirender dengan benar baik di chat pribadi maupun grup.

## ❓ Pernyataan Masalah

Secara default, WhiskeySockets tidak dapat mengirim tombol interaktif, sementara itsukichan bisa. Penyebab utamanya adalah WhiskeySockets tidak memiliki pembungkus binary node yang diperlukan (`biz`, `interactive`, `native_flow`) yang diharapkan oleh WhatsApp untuk pesan interaktif.

## ✨ Solusi

Fungsi yang ditingkatkan yang disediakan oleh package `buttons-warpper` mengatasi masalah ini dengan:

1. **Mendeteksi pesan tombol** menggunakan logika yang sama dengan itsukichan
2. **Mengonversi** format `interactiveButtons` WhiskeySockets ke struktur protobuf yang tepat
3. **Menambahkan binary node yang hilang** (`biz`, `interactive`, `native_flow`, `bot`) melalui `additionalNodes`
4. **Menangani secara otomatis** persyaratan chat pribadi vs grup

## 🚀 Fitur Utama

- ✅ **Tidak ada modifikasi** pada folder WhiskeySockets atau itsukichan
- ✅ **Fungsionalitas template dihapus** sesuai permintaan
- ✅ **Injeksi binary node otomatis** untuk pesan tombol
- ✅ **Dukungan chat pribadi** (menambahkan node `bot` dengan `biz_bot: '1'`)
- ✅ **Dukungan chat grup** (hanya menambahkan node `biz`)
- ✅ **Kompatibilitas mundur** (pesan reguler diteruskan tanpa perubahan)
- ✅ **Dukungan TypeScript** (definisi tipe lengkap disertakan)

## 📦 Instalasi

```bash
npm install buttons-warpper
```

atau

```bash
yarn add buttons-warpper
```

## 🔧 Memulai Cepat

### Penggunaan Dasar (Kasus Paling Umum)

```javascript
const { sendButtons } = require('buttons-warpper');

await sendButtons(sock, jid, {
  title: 'Judul Header',              // header opsional
  text: 'Pilih salah satu opsi di bawah',    // body
  footer: 'Teks footer',              // footer opsional
  buttons: [
    { id: 'quick_1', text: 'Balasan Cepat' },       // bentuk sederhana legacy yang dikonversi otomatis
    {
      name: 'cta_url',
      buttonParamsJson: JSON.stringify({
        display_text: 'Buka Situs',
        url: 'https://example.com'
      })
    }
  ]
});
```

### Penggunaan Lanjutan (Beberapa Jenis Tombol)

Untuk kontrol penuh dengan beberapa jenis tombol lanjutan dalam satu pesan, gunakan `sendInteractiveMessage` dengan `interactiveButtons` secara langsung:

```javascript
const { sendInteractiveMessage } = require('buttons-warpper');

await sendInteractiveMessage(sock, jid, {
  text: 'Demo native flow lanjutan',
  footer: 'Semua fitur',
  interactiveButtons: [
    // Balasan cepat (bentuk eksplisit)
    {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Balas A', id: 'reply_a' })
    },
    // Pemilih select tunggal (list dalam tombol)
    {
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: 'Pilih Satu',
        sections: [{
          title: 'Pilihan',
          rows: [
            { header: 'H', title: 'Halo', description: 'Mengucapkan hai', id: 'opt_hello' },
            { header: 'B', title: 'Selamat Tinggal', description: 'Mengucapkan bye', id: 'opt_bye' }
          ]
        }]
      })
    }
  ]
});
```

## 📱 Jenis Tombol yang Didukung

Berikut adalah nilai `name` yang paling umum dan diamati untuk `nativeFlowMessage.buttons[]` beserta kunci JSON yang diperlukan. Anda dapat mencampur beberapa jenis dalam satu array `interactiveButtons`.

| Nama | Tujuan | Kunci yang Diperlukan |
|------|--------|----------------------|
| `quick_reply` | Balasan sederhana yang mengirim kembali `id` nya | `display_text`, `id` |
| `single_select` | List pemilih dalam tombol | `title`, `sections` |
| `cta_url` | Buka URL | `display_text`, `url` |
| `cta_copy` | Salin teks ke clipboard | `display_text`, `copy_code` |
| `cta_call` | Ketuk untuk panggilan | `display_text`, `phone_number` |
| `cta_catalog` | Buka katalog bisnis | `display_text` (opsional) |
| `send_location` | Minta lokasi pengguna | `display_text` (opsional) |
| `review_and_pay` | Ringkasan pesanan/pembayaran | Payload terstruktur pembayaran |
| `payment_info` | Alur info pembayaran | Payload terstruktur pembayaran |
| `mpm` | Pesan multi produk | Struktur internal vendor |
| `wa_payment_transaction_details` | Tampilkan transaksi | Kunci referensi transaksi |

> **Catatan:** Jenis tombol stabil inti untuk bot adalah: `quick_reply`, `single_select`, `cta_url`, `cta_copy`, dan `cta_call`.

### Contoh: URL, Copy & Call Bersamaan

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Aksi kontak',
  interactiveButtons: [
    { 
      name: 'cta_url', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Dokumentasi', 
        url: 'https://example.com' 
      }) 
    },
    { 
      name: 'cta_copy', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Salin Kode', 
        copy_code: 'ABC-123' 
      }) 
    },
    { 
      name: 'cta_call', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Hubungi Dukungan', 
        phone_number: '+1234567890' 
      }) 
    }
  ]
});
```

### Contoh: Balasan Cepat + Katalog

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Jelajahi produk atau balas',
  interactiveButtons: [
    { 
      name: 'quick_reply', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Halo', 
        id: 'hi' 
      }) 
    },
    { 
      name: 'quick_reply', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Harga', 
        id: 'pricing' 
      }) 
    },
    { 
      name: 'cta_catalog', 
      buttonParamsJson: JSON.stringify({}) 
    }
  ]
});
```

### Contoh: Permintaan Lokasi

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Silakan bagikan lokasi Anda',
  interactiveButtons: [
    { 
      name: 'send_location', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Bagikan Lokasi' 
      }) 
    }
  ]
});
```

### Contoh: Menu Select Tunggal

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Pilih satu item',
  interactiveButtons: [
    { 
      name: 'single_select', 
      buttonParamsJson: JSON.stringify({
        title: 'Menu',
        sections: [{
          title: 'Utama',
          rows: [
            { id: 'it_1', title: 'Pertama', description: 'Pilihan pertama' },
            { id: 'it_2', title: 'Kedua', description: 'Pilihan kedua' }
          ]
        }]
      }) 
    }
  ]
});
```

## 📚 Referensi API

### `sendInteractiveMessage(sock, jid, content, options)`

Helper tingkat rendah untuk mengirim pesan interaktif dengan kontrol penuh.

#### Parameter

- **`sock`** (Object): Socket WhiskeySockets/Baileys yang aktif
- **`jid`** (String): JID WhatsApp tujuan (pengguna atau grup)
- **`content`** (Object): Konten pesan dengan properti berikut:
  - `text` (String): Teks body
  - `footer` (String): Teks footer (opsional)
  - `title` (String): Judul header (opsional)
  - `subtitle` (String): Subjudul header (opsional)
  - `interactiveButtons` (Array): Array deskriptor tombol
- **`options`** (Object): Opsi tambahan (opsional):
  - `additionalNodes` (Array): Binary node khusus
  - `additionalAttributes` (Object): Atribut relay tambahan
  - `statusJidList` (Array): List status JID
  - `useCachedGroupMetadata` (Boolean): Gunakan metadata grup yang di-cache

#### Return

Promise yang menyelesaikan dengan objek `WAMessage` lengkap yang dibangun.

#### Contoh

```javascript
await sendInteractiveMessage(sock, jid, {
  text: 'Pilih atau jelajahi',
  footer: 'Demo lanjutan',
  interactiveButtons: [
    { 
      name: 'quick_reply', 
      buttonParamsJson: JSON.stringify({ display_text: 'Hai', id: 'hi' }) 
    },
    { 
      name: 'cta_url', 
      buttonParamsJson: JSON.stringify({ 
        display_text: 'Dokumentasi', 
        url: 'https://example.com' 
      }) 
    }
  ]
});
```

### `sendButtons(sock, jid, content, options)`

Helper yang disederhanakan untuk skenario tombol umum.

#### Parameter

Sama seperti `sendInteractiveMessage`, tetapi dengan dukungan sintaks tombol yang disederhanakan.

## 🔍 Detail Teknis

### Struktur Binary Node

Wrapper secara otomatis menyuntikkan struktur binary node yang diperlukan:

**Chat Pribadi:**
```
biz → interactive → native_flow → buttons + bot (biz_bot=1)
```

**Chat Grup:**
```
biz → interactive → native_flow → buttons
```

### Deteksi Jenis Tombol

Wrapper mendeteksi jenis tombol menggunakan logika yang sama dengan itsukichan:

- `listMessage` → 'list'
- `buttonsMessage` → 'buttons'
- `interactiveMessage.nativeFlowMessage` → 'native_flow'

### Alur Konversi Konten

**Authoring (input):**
```javascript
{ 
  text, 
  footer, 
  interactiveButtons: [{ name, buttonParamsJson }, ...] 
}
```

**Output wrapper (dikirim ke WhatsApp):**
```javascript
{ 
  interactiveMessage: { 
    nativeFlowMessage: { buttons: [...] }, 
    body: { text }, 
    footer: { text } 
  } 
}
```

## ✅ Kompatibilitas

| Komponen | Versi |
|----------|-------|
| WhiskeySockets | 7.0.0-rc.2+ |
| Node.js | 20+ |
| Jenis Tombol | Semua jenis yang didukung oleh itsukichan |
| Jenis Chat | Chat pribadi dan grup |

## 🤝 Kontribusi

Kontribusi sangat diterima! Jangan ragu untuk mengirimkan Pull Request.

1. Fork repositori
2. Buat branch fitur Anda (`git checkout -b feature/FiturMenakjubkan`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan FiturMenakjubkan'`)
4. Push ke branch (`git push origin feature/FiturMenakjubkan`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detailnya.

## 🙏 Penghargaan

- Tim WhiskeySockets untuk fork Baileys yang sangat baik
- itsukichan untuk wawasan implementasi tombol
- Semua kontributor yang membantu meningkatkan package ini

---

**Dibuat dengan ❤️ oleh komunitas**