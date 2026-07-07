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
- **AI-Powered Insights** — Chat-based energy analysis powered by **CopilotKit** + **Google Gemini**, grounded in your live device status, energy stats, Firestore bill history, weather, and past saved chat sessions — with generative UI widgets (bar/line/pie charts and tables) rendered directly in the conversation

## Prerequisites

- A Google account (for Firebase sign-in) or an email/password account
- A Personal Access Token (PAT) from [https://connect-pat.lgthinq.com](https://connect-pat.lgthinq.com)
- LG ThinQ devices registered in your LG account
- A Google Gemini API key for AI recommendations (free tier) — set it in the AI page's settings
- The CopilotKit backend running (see [Running the CopilotKit Backend](#running-the-copilotkit-backend) below) — required for the AI Insights page to work

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
| `react` + `react-dom` | Required to render the CopilotKit chat widget (mounted inside the Vue AI Insights page) |
| `@copilotkit/react-core` + `@copilotkit/react-ui` | CopilotKit chat UI and hooks (context, generative-UI actions) |
| `recharts` | Bar/line/pie chart widgets rendered by the AI in chat |
| `@vitejs/plugin-react` | Vite plugin so the React-based chat widget compiles alongside Vue |
| `eslint` + plugins | Linting |
| `prettier` | Code formatting |

> **Note:** `node_modules/`, `dist/`, and `.quasar/` are all in `.gitignore` — they are never committed. You must always run `yarn` / `npm install` after cloning on a new machine.

### 6. Install and run the CopilotKit backend

The AI Insights page needs a small separate Node/Express server that runs the CopilotKit runtime — the frontend alone cannot talk to Gemini directly. See [Running the CopilotKit Backend](#running-the-copilotkit-backend) below. In short:

```bash
cd server
npm install
node index.js
```

Leave this running in its own terminal — it listens on `http://localhost:4000` by default.

### 7. Start the dev server

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

## Running the CopilotKit Backend

The AI Insights page's chat UI runs on **CopilotKit** (React, mounted inside the Vue page). CopilotKit needs a small backend that actually talks to Gemini — it cannot run in the browser. This lives in the separate `server/` folder (its own `package.json`, not part of the Quasar build).

**Local development:**
```bash
cd server
npm install
node index.js
```

This starts an Express server on port `4000` (override with `PORT=<port> node index.js`) exposing:
- `GET /health` — basic health check
- `POST /api/copilotkit` — the CopilotKit runtime endpoint

The frontend reads `COPILOTKIT_RUNTIME_URL` from `quasar.config.js` (`build.env`), which defaults to `http://localhost:4000/api/copilotkit` in dev mode — no extra config needed locally as long as `server/` is running.

Each request carries the user's Gemini API key and chosen model as `x-gemini-api-key` / `x-gemini-model` headers (set in the AI page's Settings dialog) — the server never stores a key itself, it just forwards it per-request.

**Deploying:** deploy the `server/` folder to any Node host (e.g. Render's free web service tier — build command `npm install`, start command `node index.js`). Then update the production branch of `COPILOTKIT_RUNTIME_URL` in `quasar.config.js` to point at the deployed URL before running `quasar build`.

## Usage

1. Open the app and **sign in** with your Google account or email/password
2. On first login, enter your **PAT Token** and **Country Code** (e.g. `PH`, `US`, `KR`) — these are saved to your account
3. Select a device from the list to open its dashboard
4. Use the date range picker to load **Daily** or **Monthly** energy data (up to 32 days)
5. Switch between **List** and **Chart** views to explore consumption trends
6. Click the **₱** icon in the header to open the **Bill Calculator** — enter your household's total kWh and amount due to estimate the cost attributable to your AC device; save and export the result
7. Click **Bill History** to view, chart, and manage all your saved bill records
8. Click **AI Insights** to open the AI chat (requires the [CopilotKit backend](#running-the-copilotkit-backend) to be running) — ask for energy-saving tips, usage analysis, bill comparisons, and weather-aware suggestions; ask for a chart or table and the AI will render one inline

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

The AI Recommendations page is a **CopilotKit** chat UI (React, mounted inside the Vue page) backed by a small Express server (`server/`) that runs the CopilotKit runtime against **Google Gemini**. See [Running the CopilotKit Backend](#running-the-copilotkit-backend) for setup.

The AI is grounded in several live data sources, fed in as context automatically on every message:
- **Live device status** — current mode, fan speed, target/room temperature, swing, from the LG ThinQ API
- **Energy usage stats** — total/average/peak kWh for the selected period, from the LG ThinQ API
- **Bill history** — your saved electricity bill records, from Firestore
- **Weather** — current outdoor temperature/humidity for your configured city, from Open-Meteo
- **Past chat sessions** — notes and messages from your 5 most recently *saved* conversations (via the History drawer), so the AI can recall things you mentioned in an earlier session

Other capabilities:
- **Generative UI widgets** — the AI can render a bar chart, line chart, pie chart, or styled table directly in the conversation (`src/copilot/GenerativeWidgets.jsx`) instead of only describing data in text
- **Model selection** — choose from available Gemini models (fetched dynamically from the API)
- **Chat history** — save/resume full conversations via the History drawer (stored in Firestore, per user)
- **Multi-turn chat** — full conversation history maintained throughout the session

AI settings (API key, model, location) are saved to your account and persist across sessions. You must configure your own Gemini API key via the settings (gear icon) on the AI page — there is no default key.

## Project Structure
```
src/
├── boot/
│   ├── firebase.js               # Firebase initialization (Auth, Firestore, Realtime DB)
│   └── pinia.js                  # Pinia store setup
├── components/
│   ├── BillCalculatorModal.vue   # Bill calculation modal with save & PNG export
│   ├── CopilotChatMount.vue      # Vue wrapper that mounts the React CopilotKit widget
│   └── ProfileMenu.vue           # User account menu with logout
├── copilot/
│   ├── CopilotWidgetMount.jsx    # The React CopilotKit chat tree (context, history bridge)
│   └── GenerativeWidgets.jsx     # AI-renderable chart/table components + tool registration
├── layouts/
│   └── MainLayout.vue            # Minimal layout wrapper
├── pages/
│   ├── SignInPage.vue            # Firebase auth + PAT token setup
│   ├── DeviceListPage.vue        # Device list (post-login home)
│   ├── DeviceDashboard.vue       # Device status + energy charts + bill calculator
│   ├── BillHistoryPage.vue       # Bill record management (list/card/chart views)
│   ├── AIRecommendationsPage.vue # AI Insights page (data fetching, settings, history drawer)
│   └── ErrorNotFound.vue         # 404 page
├── router/
│   ├── index.js                  # Router setup (hash/history/memory modes)
│   └── routes.js                 # Route definitions
└── stores/
    ├── authStore.js              # Firebase auth state + credentials + AI settings
    └── deviceStore.js            # Selected device + date range (session-persisted)

server/                           # Separate Node project — the CopilotKit runtime backend
└── index.js                      # Express server: /health, /api/copilotkit (see below)
```

## External Integrations

| Service | Purpose |
|---|---|
| **Firebase Auth** | Email/password and Google OAuth sign-in |
| **Firebase Realtime Database** | Per-user storage of PAT credentials and AI settings |
| **Firestore** | Per-user storage of electricity bill records and saved AI chat sessions |
| **LG ThinQ API** | Device discovery, real-time status, energy usage data |
| **CopilotKit** | Chat runtime/UI framework for the AI Insights page (see `server/`) |
| **Google Gemini API** | The LLM behind the AI chat (via CopilotKit's runtime) |
| **Open-Meteo** | Free weather API for location-based temperature and humidity context |

## Configuration

Quasar configuration is managed via `quasar.config.js`. See [Quasar docs](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js) for details.
