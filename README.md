# Napira 🚀 - Universal Social Media & Personal Video Vault

**Napira** is a sleek, modern, offline-capable Progressive Web Application (PWA) designed to save, organize, and stream videos from **Instagram, TikTok, YouTube, Facebook, and Web**, as well as upload video files directly from your **phone gallery or computer**.

---

## ✨ Features

- **🌐 Universal Social Media Importer**:
  - **Instagram**: Reels, stories, and posts with automatic metadata and cover art scraping.
  - **TikTok**: Reels and clips with automatic thumbnail fetching via oEmbed.
  - **YouTube**: Instant high-res thumbnails for Shorts and standard videos.
  - **Facebook**: Public watch videos and clips.
  - **Web**: Any direct video link or web page with OpenGraph video metadata.
- **📁 Phone & Computer Media Vault**:
  - Import local video files directly from your phone gallery or computer hard drive.
  - Automatic on-device canvas thumbnail generation.
  - Persistent offline storage via browser IndexedDB.
- **⚡ Advanced Video Player**:
  - **Slow-Motion Controls**: `0.25x`, `0.5x`, `0.75x`, and `1.0x` playback speeds.
  - **Continuous Loop Mode**: Tap `Loop Video: ON` to repeat any tutorial or clip endlessly.
  - **Pop-Out / TV Cast**: Native Picture-in-Picture (PiP) and AirPlay streaming to large screens.
- **🔍 Quick Search & Voice Search**:
  - Filter by title, creator, platform, or tags.
  - Voice search powered by Web Speech API.
  - Quick 1-tap category chips (`✨ All Videos`, `🔥 Trending`, `💡 Tutorials`, `🎵 Music & Reels`, `😂 Comedy`, `🏃 Fitness`, `📁 Personal`).
- **🛡️ 1-Click Vault Backup & Restore**:
  - Export all saved video references and metadata to a single JSON backup.
  - Direct sharing via WhatsApp, SMS, or AirDrop.
  - Instant 1-click restore on any device.
- **📱 Installable Progressive Web App (PWA)**:
  - Add to Home Screen on iOS (Safari) and Android (Chrome).
  - Standalone fullscreen experience with dark mode aesthetic.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, PostCSS
- **Storage**: IndexedDB (`idb`) with Persistent Storage API
- **Icons**: Lucide React
- **API**: Serverless Edge Function for metadata scraping (`/api/scrape`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/Mahyar915/Napira.git
cd Napira

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📄 License
MIT License. Created by [Mahyar915](https://github.com/Mahyar915).
