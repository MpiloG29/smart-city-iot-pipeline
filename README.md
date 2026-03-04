# Smart City IoT Data Pipeline

A real-time Smart City simulation platform focused on Johannesburg.
It generates live traffic and air-quality telemetry, streams updates over WebSockets, and serves a dashboard/API from a Node.js backend.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Local)](#quick-start-local)
- [Quick Start (Docker)](#quick-start-docker)
- [Render Deployment](#render-deployment)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
Real-time data processing pipeline for smart city IoT analytics. Processes data from traffic cameras, air quality sensors, and smart meters using MQTT, Kafka, Spark Streaming, and TimescaleDB.

This project simulates a city-scale IoT scenario:

- **Traffic cameras** publish congestion, speed, and incident data.
- **Air-quality sensors** publish AQI and pollutant readings.
- A backend service exposes:
  - a browser dashboard,
  - HTTP API routes,
  - WebSocket events for live updates.

The current stable runtime path is through `smart-city-iot-js/server.js`.

---

## Features
- Real-time data ingestion from IoT devices
- Stream processing with Apache Spark
- Time-series data storage
- Interactive dashboards
- Edge computing capabilities

<img width="1366" height="626" alt="Screenshot (47)" src="https://github.com/user-attachments/assets/0e2eccde-6f31-40e2-a0b6-4fe1f177a5b0" />
<img width="1347" height="637" alt="Screenshot (48)" src="https://github.com/user-attachments/assets/970064ea-2be9-446a-8e7d-c88cdda33dd7" />
<img width="1356" height="618" alt="Screenshot (49)" src="https://github.com/user-attachments/assets/17748b75-aa65-492f-bb5f-0c4c9a1e7f1f" />




##  Tech Stack
- **Data Ingestion:** MQTT (Mosquitto)
- **Stream Processing:** Apache Kafka, Spark Streaming
- **Storage:** TimescaleDB, PostgreSQL
- **Visualization:** Grafana, Streamlit
- **Orchestration:** Docker, Docker Compose

## Installation
```bash
git clone https://github.com/MpiloG29/smart-city-iot-pipeline.git
cd smart-city-iot-pipeline
docker-compose up -d

- Real-time traffic and air-quality simulation.
- Live streaming via WebSockets.
- REST API for health and data access.
- Browser dashboard served by the same backend.
- Docker + Compose support for reproducible deployments.
- Render-compatible Docker deployment (`render.yaml` + root `Dockerfile`).

---

## Architecture

```text
Sensors (simulated)
   ├─ Traffic Camera Simulator
   └─ Air Quality Simulator
            │
            ▼
   Node.js Backend (Express + Socket.IO)
            │
   ┌────────┴────────┐
   ▼                 ▼
REST API         WebSocket Events
   ▼                 ▼
Dashboard UI (public/) and external consumers
```

---

## Tech Stack

- **Runtime:** Node.js 20
- **Backend:** Express
- **Realtime:** Socket.IO
- **Containerization:** Docker, Docker Compose
- **Deployment:** Render (Docker runtime)

---

## Project Structure

```text
.
├── Dockerfile                      # Root production image (Render-friendly)
├── .dockerignore                   # Root docker ignore rules
├── docker-compose.yml              # Compose entrypoint
├── compose.yaml                    # Alternate Compose filename
├── render.yaml                     # Render service blueprint
├── package.json                    # Root wrapper scripts
├── package-lock.json
├── README.md
├── MANUAL_DEPLOYMENT_GUIDE.md
└── smart-city-iot-js/
    ├── package.json                # App dependencies + scripts
    ├── package-lock.json
    ├── server.js                   # Main backend entrypoint
    ├── public/                     # Dashboard assets
    ├── sensors/                    # Sensor simulators
    ├── api/                        # Additional API modules (partial/in-progress)
    ├── Dockerfile                  # App-local Dockerfile (legacy/optional)
    └── .dockerignore
```

---

## Prerequisites

### For Local Run

- Node.js **18+** (recommended: 20)
- npm

### For Docker Run

- Docker Desktop / Docker Engine
- Docker Compose v2 (`docker compose`)

---

## Quick Start (Local)

From repository root:

```bash
npm run install:app
npm start
```

Then open:

- Dashboard: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

---

## Quick Start (Docker)

From repository root:

```bash
docker compose up --build
```

Then open:

- Dashboard: `http://localhost:3000`

Stop services:

```bash
docker compose down
```

---

## Render Deployment

This repo is configured for Render using Docker.

### Recommended Render Settings

- **Runtime:** Docker
- **Dockerfile Path:** `./Dockerfile`
- **Start Command:** leave empty (use Docker `CMD`)
- **Port:** `3000`

### Why this setup

The root `Dockerfile` installs dependencies from `smart-city-iot-js/package.json` and starts the app directly with:

```bash
node smart-city-iot-js/server.js
```

This avoids the common runtime error:

`Error: Cannot find module 'express'`

If your existing Render service forces a Start Command, set it to:

```bash
npm start
```

---

## Environment Variables

| Variable   | Required | Default | Description |
|------------|----------|---------|-------------|
| `PORT`     | No       | `3000`  | HTTP server port |
| `NODE_ENV` | No       | depends | Runtime mode (`production` for deploys) |

---

## Available Scripts

### Root (`package.json`)

- `npm run install:app` → install dependencies in `smart-city-iot-js`
- `npm start` → install app prod deps, then start server
- `npm run dev` → run app in dev mode (nodemon)

### App (`smart-city-iot-js/package.json`)

- `npm start` → `node server.js`
- `npm run dev` → `nodemon server.js`

---

## API Endpoints

> Base URL: `http://localhost:3000`

- `GET /api/health` — health/status endpoint.

(Additional routes exist under `smart-city-iot-js/api/routes`, but not all are wired into the default runtime path yet.)

---

## Troubleshooting

### 1) `no configuration file provided: not found`

You are not in the folder containing Compose files.

```bash
pwd
ls
```

Ensure you see `docker-compose.yml` or `compose.yaml`, then run:

```bash
docker compose -f docker-compose.yml up --build
# or
docker compose -f compose.yaml up --build
```

### 2) `Cannot find module 'express'` on Render

- Use Docker runtime.
- Use `./Dockerfile`.
- Keep Start Command empty (or set `npm start` if required).

### 3) Port already in use

```bash
PORT=8080 npm --prefix smart-city-iot-js start
```

---

## Known Limitations

Some modules under `smart-city-iot-js/api/` and `smart-city-iot-js/scripts/` reference components that are not fully integrated in the current default runtime path.

The supported production entrypoint is:

- `smart-city-iot-js/server.js`

---

## Contributing

1. Create a feature branch.
2. Make focused, reviewable changes.
3. Run local checks (`npm run install:app`, `npm start`).
4. Open a PR with a clear summary and testing notes.

---

## License

MIT (see `LICENSE`).
