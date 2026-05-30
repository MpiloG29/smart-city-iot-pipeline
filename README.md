# Smart City Intelligence Platform

A real-time South African smart city monitoring and analytics platform covering **6 major cities** — Johannesburg, Durban, Cape Town, Pretoria, Gqeberha, and Bloemfontein. It streams live IoT telemetry over WebSockets and renders a full-featured intelligence dashboard powered by Node.js, Socket.IO, and Three.js.

**Live Demo:** [smart-city-iot-pipeline-s9vn.onrender.com](https://smart-city-iot-pipeline-s9vn.onrender.com/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start (Local)](#quick-start-local)
- [Quick Start (Docker)](#quick-start-docker)
- [Render Deployment](#render-deployment)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The Smart City Intelligence Platform is a comprehensive urban-management dashboard that ingests simulated IoT sensor data from six South African cities and presents it through a unified, real-time interface. The platform is designed to support municipal decision-makers, urban planners, emergency services, and citizens with live situational awareness across traffic, environment, safety, infrastructure, and public services.

---

## Features

### 1 — AI Traffic Prediction
Machine-learning-style congestion forecasting per city road.
- Risk score (0–100%) and confidence level per city
- 15–60 minute prediction horizon
- Worsening / improving trend indicator
- Roads covered: M1 Highway (JHB), N2 Highway (DBN), N1 City Bowl (CPT), N14 (PTA), N2 Eastern Cape (GQE), N1 Free State (BFN)

### 2 — Smart Emergency Response
Real-time incident detection with automated resource routing.
- Active incident cards (accident, medical, fire, crime) per city
- Nearest hospital and police station with estimated distance
- Recommended fastest route
- Response time and unit assignment
- Hospital bed availability across 3 key facilities

### 3 — Smart Flood Monitoring
Hydrological risk scoring — critical for South African flood seasons.
- Rainfall rate (mm/h) per city
- River level monitoring (metres)
- Storm drain status (Clear / Blocked)
- Flood risk badge (Low / Medium / High)
- 24-hour cumulative rainfall and next-rain forecast

### 4 — Smart Electricity Monitoring
Live Eskom load shedding intelligence.
- Current load shedding stage (0–4) shown in KPI bar and header badge
- National grid frequency and total MW consumption
- Solar generation contribution
- Renewable energy share percentage
- Per-city next outage schedule

### 5 — Crime Hotspot Analytics
Integrated public safety layer across all 6 cities.
- Daily and weekly incident counts per city
- Risk score and hotspot classification (Low / Medium / High)
- Peak crime time window per city
- Top crime type and trend direction
- National trend indicator

### 6 — Citizen Reporting
Resident issue-reporting portal with ticket tracking.
- Categories: Pothole, Broken Traffic Light, Water Leak, Illegal Dumping, Street Light Out, Flooding, Crime Activity, Load Shedding Issue
- City-level location tagging
- Auto-generated ticket number (RPT-XXXX)
- Live feed of submitted reports

### 7 — AI Chat Assistant
Natural-language city intelligence interface.
- Answers questions about any of the 6 cities
- Topics: traffic, AQI, flooding, load shedding, crime, parking, transport
- Quick-chip shortcuts for common queries
- Example: *"How is Cape Town traffic?"* / *"Is there load shedding in Pretoria?"*

### 8 — Digital Twin — 3D City Visualization
Three.js-powered 3D city grid.
- All 6 cities laid out in a 2-row 3D grid
- Buildings pulse between green / orange / red based on live traffic congestion
- Draggable rotation and scroll-to-zoom
- City labels rendered via canvas textures
- Road network connecting city clusters

### 9 — Smart Parking System
Real-time parking occupancy for 6 city hubs.
- Occupancy rate and available spaces per facility
- Status badge: Available / Limited / Full
- Animated occupancy progress bar
- Price per hour
- Total national spaces available in header

### 10 — Smart Public Transport Monitoring
National public transport network dashboard.
- **Buses & BRT:** Rea Vaya (JHB), MyCiTi (CPT), People Mover (DBN), Tshwane BRT (PTA), GoBay (GQE), Mangaung Express (BFN)
- **Rail:** Gautrain (JHB/PTA), Cape Town Metrorail, Metrorail Durban/PE, Shosholoza Meyl (BFN)
- **Taxis:** Active count, hotspot ranks, average wait time, route count
- Real-time status (On Time / Delayed) and passenger load

---

### Core Dashboard Capabilities

| Capability | Detail |
|---|---|
| Live city map | South Africa national view, colour-coded city markers |
| City selector strip | One-click filter to any of the 6 cities |
| National Alert Centre | Real-time accident, flood, AQI, and breakdown alerts |
| Traffic intelligence table | Speed, congestion, province, districts, AQI per city |
| KPI bar | Sensors online, avg speed, incidents, AQI, alerts, load shedding stage |
| Historical speed chart | 24-hour national average speed trend |
| AQI bar chart | Air Quality Index for all 6 cities |
| Device health | Uptime stats for cameras, AQI sensors, traffic lights, flood sensors |
| South African flag | Rendered in CSS/SVG as a subtle watermark behind the entire dashboard |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Backend | Express 4 |
| Real-time | Socket.IO 4 |
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| 3D Visualization | Three.js r128 |
| Maps | Leaflet.js 1.9 + OpenStreetMap |
| Charts | Chart.js |
| Containerization | Docker, Docker Compose |
| Deployment | Render (Docker runtime) |

---

## Architecture

```
IoT Sensor Simulators (in-memory)
  ├─ Traffic data       (speed, vehicles, congestion)
  ├─ Air quality        (AQI, PM2.5)
  ├─ Flood sensors      (rainfall, river levels)
  ├─ Electricity meters (consumption, load shedding stage)
  ├─ Crime data         (incident counts, risk scores)
  ├─ Parking sensors    (occupancy per bay)
  └─ Transport trackers (buses, trains, taxis)
           │
           ▼
  Node.js Backend — Express + Socket.IO
           │
   ┌───────┴───────┐
   ▼               ▼
REST API      WebSocket Events (5-second broadcast)
                   │
          ┌────────┴────────────────┐
          ▼                         ▼
  Browser Dashboard           AI Chat Handler
  (Leaflet · Chart.js         (keyword-based NLU,
   Three.js · CSS)             city-aware responses)
```

---

## Project Structure

```
.
├── Dockerfile                        # Root production image (Render)
├── docker-compose.yml                # Compose entry point
├── compose.yaml                      # Alternate Compose filename
├── render.yaml                       # Render service blueprint
├── package.json                      # Root wrapper scripts
├── README.md
└── smart-city-iot-js/
    ├── server.js                     # Main backend — all data generators + socket events
    ├── package.json
    ├── public/
    │   └── index.html                # Full dashboard UI + client JS
    ├── sensors/
    │   ├── traffic-simulator.js      # Traffic camera simulator
    │   ├── air-quality-simulator.js  # AQI sensor simulator
    │   └── index.js                  # Sensor orchestrator
    └── api/
        └── routes/                   # REST route modules (partial)
```

---

## Quick Start (Local)

```bash
git clone https://github.com/MpiloG29/smart-city-iot-pipeline.git
cd smart-city-iot-pipeline
npm run install:app
npm run dev
```

Open the dashboard: **http://localhost:3000**

> `npm run dev` uses nodemon for auto-reload on file changes.

---

## Quick Start (Docker)

```bash
docker compose up --build
```

Open the dashboard: **http://localhost:3000**

Stop:

```bash
docker compose down
```

---

## Render Deployment

The repository is configured for one-click Docker deployment on Render.

### Recommended settings

| Setting | Value |
|---|---|
| Runtime | Docker |
| Dockerfile Path | `./Dockerfile` |
| Start Command | *(leave empty — Docker CMD is used)* |
| Port | `3000` |

The root `Dockerfile` installs all dependencies from `smart-city-iot-js/package.json` and starts:

```bash
node smart-city-iot-js/server.js
```

If Render requires a start command, set it to:

```bash
npm start
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | — | Set to `production` for deploys |

---

## Available Scripts

### Root

| Command | Action |
|---|---|
| `npm run install:app` | Install dependencies in `smart-city-iot-js/` |
| `npm start` | Install prod deps and start server |
| `npm run dev` | Start with nodemon (auto-reload) |

### App (`smart-city-iot-js/`)

| Command | Action |
|---|---|
| `npm start` | `node server.js` |
| `npm run dev` | `nodemon server.js` |

---

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

Real-time data is delivered via **Socket.IO events**:

| Event | Payload |
|---|---|
| `traffic-update` | Speed, vehicles, congestion, AQI per city |
| `kpi-update` | National KPI values |
| `aqi-update` | AQI values for all 6 cities |
| `predictions-update` | AI congestion predictions |
| `emergency-update` | Active incidents and hospital availability |
| `flood-update` | Rainfall, river levels, risk scores |
| `electricity-update` | Load shedding stage, consumption, solar |
| `crime-update` | Incident counts and risk scores |
| `parking-update` | Occupancy per parking hub |
| `transport-update` | Bus, train, and taxi status |
| `new-alert` | Real-time alert notifications |
| `device-health` | Sensor uptime statistics |

Client → Server:

| Event | Purpose |
|---|---|
| `request-initial-data` | Fetch full state on connect |
| `citizen-report` | Submit a citizen report |
| `chat-query` | Send a question to the AI assistant |
| `device-command` | Send a command to a city device |

---

## Troubleshooting

### `no configuration file provided: not found`

Run commands from the repository root where `docker-compose.yml` exists:

```bash
docker compose -f docker-compose.yml up --build
```

### `Cannot find module 'express'` on Render

Use the Docker runtime with `./Dockerfile`. Do not use the Node runtime directly.

### Port already in use locally

```bash
PORT=8080 npm --prefix smart-city-iot-js start
```

---

## Cities Covered

| City | Province | Key Road | BRT / Bus | Rail |
|---|---|---|---|---|
| Johannesburg | Gauteng | M1 Highway | Rea Vaya BRT | Gautrain |
| Durban | KwaZulu-Natal | N2 Highway | People Mover | Metrorail Durban |
| Cape Town | Western Cape | N1 City Bowl | MyCiTi BRT | Cape Town Metrorail |
| Pretoria | Gauteng | N14 Highway | Tshwane BRT | Gautrain Pretoria |
| Gqeberha | Eastern Cape | N2 Eastern Cape | GoBay Bus | Metrorail PE |
| Bloemfontein | Free State | N1 Free State | Mangaung Express | Shosholoza Meyl |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make focused, well-scoped changes.
3. Test locally: `npm run install:app && npm run dev`.
4. Open a pull request with a clear description.

---

## License

MIT — see `LICENSE`.
