# LG ThinQ Energy Monitor

A web dashboard built with **Quasar Framework (Vue 3)** for monitoring energy consumption of your LG ThinQ smart devices. Authenticate via Firebase, connect using your Personal Access Token (PAT), and get real-time device status, historical energy usage, electricity bill tracking, and AI-powered insights.

## Features

- **Firebase Authentication** — Sign in with email/password or Google OAuth; credentials are securely stored per user
- **Device Discovery** — Authenticate with your LG ThinQ PAT token to list all registered devices
- **Real-Time Device Status** — View current temperature, operation mode, fan speed, and power state
- **Energy Consumption Tracking** — Query daily or monthly energy usage with interactive list and line chart views; supports up to 32-day ranges to match billing periods
- **Electricity Bill Calculator** — Estimate your AC device's electricity cost based on your household bill; save records to your account and export as PNG
- **Bill History** — View, chart, and delete all saved electricity bill records with per-record details and a total cost summary
- **Multi-Country Support** — Configurable country code (ISO 3166-1 alpha-2) for regional API routing
- **AI-Powered Insights** — Chat-based energy analysis using Google Gemini AI with weather context, bill history integration, image uploads, and customizable prompts

## Prerequisites

- A Google account (for Firebase sign-in) or an email/password account
- A Personal Access Token (PAT) from [https://connect-pat.lgthinq.com](https://connect-pat.lgthinq.com)
- LG ThinQ devices registered in your LG account
- (Optional) A Google Gemini API key for AI recommendations — a default key is provided

## Setting Up on a New PC

Follow these steps in order when cloning and running this project on a fresh machine.

### 1. Install Node.js

This project requires **Node.js v20 or higher** (v20, v22, v24, v26, or v28).

Download and install from [https://nodejs.org](https://nodejs.org) (choose the LTS version).

Verify after install:
```bash
node -v   # should be v20.x or higher
npm -v    # should be 6.x or higher
```

### 2. Install Yarn (recommended package manager)

```bash
npm install -g yarn
```

Verify:
```bash
yarn -v   # should be 1.21.x or higher
```

> You can also use `npm` or `pnpm >= 10.0.0` if you prefer.

### 3. Install Quasar CLI globally

The `quasar` command (used for `quasar dev` and `quasar build`) comes from the Quasar CLI package. Install it globally:

```bash
npm install -g @quasar/cli
```

Verify:
```bash
quasar -v
```

### 4. Clone the repository

```bash
git clone <your-repo-url>
cd lg-energy-monitoring
```

### 5. Install project dependencies

```bash
yarn
# or
npm install
```

This installs everything listed in `package.json`:

| Package | Role |
|---|---|
| `quasar` + `@quasar/extras` | UI framework and icon sets |
| `@quasar/app-vite` | Vite-based build tooling for Quasar (dev server, bundler) |
| `vue` + `vue-router` | Vue 3 core and routing |
| `pinia` | State management |
| `firebase` | Firebase Auth, Firestore, Realtime Database |
| `firebaseui` | Pre-built Firebase sign-in UI |
| `eslint` + plugins | Linting |
| `prettier` | Code formatting |

> **Note:** `node_modules/`, `dist/`, and `.quasar/` are all in `.gitignore` — they are never committed. You must always run `yarn` / `npm install` after cloning on a new machine.

### 6. Start the dev server

```bash
quasar dev
```

The app will open at `http://localhost:9000` (or the next available port).

---

## Development Commands

### Start in development mode
```bash
quasar dev
```

### Build for production
```bash
quasar build
```

### Lint
```bash
yarn lint
# or
npm run lint
```

### Format
```bash
yarn format
# or
npm run format
```

## Usage

1. Open the app and **sign in** with your Google account or email/password
2. On first login, enter your **PAT Token** and **Country Code** (e.g. `PH`, `US`, `KR`) — these are saved to your account
3. Select a device from the list to open its dashboard
4. Use the date range picker to load **Daily** or **Monthly** energy data (up to 32 days)
5. Switch between **List** and **Chart** views to explore consumption trends
6. Click the **₱** icon in the header to open the **Bill Calculator** — enter your household's total kWh and amount due to estimate the cost attributable to your AC device; save and export the result
7. Click **Bill History** to view, chart, and manage all your saved bill records
8. Click **AI Insights** to open the AI chat — ask Google Gemini for energy-saving tips, usage analysis, and weather-aware suggestions

## Bill Calculator & History

- Enter your household's total electricity bill amount and total kWh consumption
- The calculator estimates your AC device's share of the bill based on its energy data
- Save bill records to your account (stored in Firestore, per user)
- Export the bill result as a **PNG image** for your records
- The **Bill History** page shows all saved records with three view modes:
  - **List** — Compact view with date range, amount, kWh, and delete option
  - **Card** — Detailed view with full metrics (rate per kWh, device usage, peak day, etc.)
  - **Chart** — Line chart of AC electricity cost over time

## AI Recommendations

The AI Recommendations page provides a conversational interface powered by **Google Gemini**:

- **Energy analysis** — Ask the AI to analyze your device's consumption patterns
- **Bill history context** — The AI automatically includes your recent 6 bill records for richer analysis
- **Weather context** — Set your city to include outdoor temperature and humidity in the AI's analysis
- **Custom prompts** — Tailor the AI's behavior with your own system prompt template
- **Model selection** — Choose from available Gemini models (fetched dynamically from the API)
- **Image uploads** — Attach screenshots or photos for visual analysis (paste or file picker)
- **Multi-turn chat** — Full conversation history maintained throughout the session

AI settings (API key, model, prompt, location) are saved to your account and persist across sessions.

A default Gemini API key is included. You can replace it with your own via the settings (gear icon) on the AI page.

## Project Structure
```
src/
├── boot/
│   ├── firebase.js               # Firebase initialization (Auth, Firestore, Realtime DB)
│   └── pinia.js                  # Pinia store setup
├── components/
│   ├── BillCalculatorModal.vue   # Bill calculation modal with save & PNG export
│   └── ProfileMenu.vue           # User account menu with logout
├── layouts/
│   └── MainLayout.vue            # Minimal layout wrapper
├── pages/
│   ├── SignInPage.vue            # Firebase auth + PAT token setup
│   ├── DeviceListPage.vue        # Device list (post-login home)
│   ├── DeviceDashboard.vue       # Device status + energy charts + bill calculator
│   ├── BillHistoryPage.vue       # Bill record management (list/card/chart views)
│   ├── AIRecommendationsPage.vue # AI-powered chat insights via Google Gemini
│   └── ErrorNotFound.vue         # 404 page
├── router/
│   ├── index.js                  # Router setup (hash/history/memory modes)
│   └── routes.js                 # Route definitions
└── stores/
    ├── authStore.js              # Firebase auth state + credentials + AI settings
    └── deviceStore.js            # Selected device + date range (session-persisted)
```

## External Integrations

| Service | Purpose |
|---|---|
| **Firebase Auth** | Email/password and Google OAuth sign-in |
| **Firebase Realtime Database** | Per-user storage of PAT credentials and AI settings |
| **Firestore** | Per-user storage of electricity bill records |
| **LG ThinQ API** | Device discovery, real-time status, energy usage data |
| **Google Gemini API** | AI chat, model listing, image analysis |
| **Open-Meteo** | Free weather API for location-based temperature and humidity context |

## Configuration

Quasar configuration is managed via `quasar.config.js`. See [Quasar docs](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js) for details.
