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
A real-time IoT monitoring dashboard for the City of Johannesburg, providing live traffic data, air quality monitoring, incident detection, and predictive analytics. This system demonstrates how IoT sensors and real-time data processing can improve urban management and citizen safety.

**Live Demo:** [smart-city-iot-pipeline-1.onrender.com](https://smart-city-iot-pipeline-1.onrender.com)

##  Problem Statement

Modern cities face challenges in managing traffic congestion, monitoring environmental conditions, and responding to incidents quickly. This dashboard addresses these challenges by:

- **Real-time Traffic Monitoring** - Live vehicle counts and speed tracking
- **Environmental Sensing** - Air quality index monitoring across locations
- **Incident Detection** - Automatic alerts for accidents, flooding, and breakdowns
- **Predictive Insights** - Trend analysis and forecasting for better decision-making
---

## Features
- Real-time data ingestion from IoT devices
- Stream processing with Apache Spark
- Time-series data storage
- Interactive dashboards
- Edge computing capabilities
<img width="1586" height="758" alt="Screenshot (58)" src="https://github.com/user-attachments/assets/0d7669b3-4f71-484b-9e7e-1868406b2f35" />
<img width="1600" height="732" alt="Screenshot (59)" src="https://github.com/user-attachments/assets/1570962f-5aac-4137-93ec-19c90cf765a1" />
<img width="1591" height="134" alt="Screenshot (60)" src="https://github.com/user-attachments/assets/edfba5d9-8bc4-4f0e-9f31-a7c3d1160f2d" />





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

Live Link: https://smart-city-iot-pipeline-s9vn.onrender.com/
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
