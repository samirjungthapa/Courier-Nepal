# Courier Nepal - Enterprise Logistics & AI Dispatch Platform

A premium, state-of-the-art logistics and courier management platform designed for local and national package deliveries across Nepal.

## 🚀 Key Features

### 1. 🤖 AI Logistics Assistant (Gemini Copilot)
- **Advanced Assistant**: Dynamic chat copilot supporting full natural language customer queries, automated rate estimation, and status descriptions.
- **Gemini API Integration**: Leverages Google Gemini models natively with a robust local keyword NLP fallback engine.
- **Quick Prompts**: Floating helper query chips pre-loaded with common questions for frictionless customer onboarding.

### 2. 🛰️ Live GPS Nepal Route Simulator
- **Visual Transit Map**: Canvas-powered geographical layout of Nepal's city network (Kathmandu, Pokhara, Nepalgunj, Biratnagar, Hetauda, etc.).
- **Dynamic Routing**: Dynamically traces paths between origin and recipient cities, showing simulated delivery vehicles traveling live between sorting hubs.
- **Courier Agent Profile Cards**: Detailed cards showing active agent names, vehicle info, and ratings, with simulated chat capabilities.

### 3. 💎 Wholesaler & Merchant Dashboard
- **Bulk Manifest Uploader**: Drag-and-drop simulated uploader allowing wholesale merchants to upload CSV files and register bulk consignments instantly.
- **Loyalty Rewards Program**: Interactive rewards mechanism letting users accrue points and redeem them for shipping discount vouchers.
- **Green CO₂ Offset Calculator**: Real-time carbon-saving metrics reporting environmental footprint metrics.

---

## 🛠️ Architecture & Setup

### 1. Backend Service
- Built using **Node.js**, **Express**, and **Sequelize**.
- Local storage uses SQLite (`backend/dev.sqlite`).

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Client
- Built using **React**, **TypeScript**, **Redux Toolkit**, and **Vite**.
- Styled with CSS and animated with GSAP and smooth-scrolling.

```bash
cd frontend
npm install
npm run dev
```
