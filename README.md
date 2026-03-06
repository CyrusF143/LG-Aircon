# LG ThinQ Energy Monitor

A web dashboard built with **Quasar Framework (Vue 3)** for monitoring energy consumption of your LG ThinQ smart devices. Connect via your Personal Access Token (PAT) to view real-time device status and historical energy usage.

## Features

- **Device Discovery** — Authenticate with your LG ThinQ PAT token to list all registered devices
- **Real-Time Device Status** — View current temperature, operation mode, fan speed, and power state
- **Energy Consumption Tracking** — Query daily or monthly energy usage with interactive list and line chart views
- **Electricity Bill Calculator** — Estimate your AC device's electricity cost based on your household bill rate
- **Multi-Country Support** — Configurable country code (ISO 3166-1 alpha-2) for regional API routing

## Prerequisites

- A Personal Access Token (PAT) from [https://connect-pat.lgthinq.com](https://connect-pat.lgthinq.com)
- LG ThinQ devices registered in your LG account

## Getting Started

### Install dependencies
```bash
yarn
# or
npm install
```

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

1. Open the app and enter your **PAT Token** and **Country Code** (e.g. `PH`, `US`, `KR`)
2. Click **Connect & Get Devices** to load your registered LG ThinQ devices
3. Select a device to open its dashboard
4. Use the date range picker to load **Daily** or **Monthly** energy data
5. Switch between **List** and **Chart** views to explore consumption trends
6. Click the **₱** icon in the header to open the **Bill Calculator** — enter your household's total kWh and amount due to estimate the cost attributable to your AC device

## Project Structure
```
src/
├── layouts/
│   └── MainLayout.vue       # Minimal layout wrapper
├── pages/
│   ├── DeviceListPage.vue   # PAT login + device list
│   ├── DeviceDashboard.vue  # Device status + energy charts + bill calculator
│   └── ErrorNotFound.vue    # 404 page
└── router/
    ├── index.js             # Router setup (hash/history/memory modes)
    └── routes.js            # Route definitions
```

## Configuration

Quasar configuration is managed via `quasar.config.js`. See [Quasar docs](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js) for details.# LG ThinQ Energy Monitor

A web dashboard built with **Quasar Framework (Vue 3)** for monitoring energy consumption of your LG ThinQ smart devices. Connect via your Personal Access Token (PAT) to view real-time device status and historical energy usage.

## Features

- **Device Discovery** — Authenticate with your LG ThinQ PAT token to list all registered devices
- **Real-Time Device Status** — View current temperature, operation mode, fan speed, and power state
- **Energy Consumption Tracking** — Query daily or monthly energy usage with interactive list and line chart views
- **Electricity Bill Calculator** — Estimate your AC device's electricity cost based on your household bill rate
- **Multi-Country Support** — Configurable country code (ISO 3166-1 alpha-2) for regional API routing

## Prerequisites

- A Personal Access Token (PAT) from [https://connect-pat.lgthinq.com](https://connect-pat.lgthinq.com)
- LG ThinQ devices registered in your LG account

## Getting Started

### Install dependencies
```bash
yarn
# or
npm install
```

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

1. Open the app and enter your **PAT Token** and **Country Code** (e.g. `PH`, `US`, `KR`)
2. Click **Connect & Get Devices** to load your registered LG ThinQ devices
3. Select a device to open its dashboard
4. Use the date range picker to load **Daily** or **Monthly** energy data
5. Switch between **List** and **Chart** views to explore consumption trends
6. Click the **₱** icon in the header to open the **Bill Calculator** — enter your household's total kWh and amount due to estimate the cost attributable to your AC device

## Project Structure
```
src/
├── layouts/
│   └── MainLayout.vue       # Minimal layout wrapper
├── pages/
│   ├── DeviceListPage.vue   # PAT login + device list
│   ├── DeviceDashboard.vue  # Device status + energy charts + bill calculator
│   └── ErrorNotFound.vue    # 404 page
└── router/
    ├── index.js             # Router setup (hash/history/memory modes)
    └── routes.js            # Route definitions
```

## Configuration

Quasar configuration is managed via `quasar.config.js`. See [Quasar docs](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js) for details.