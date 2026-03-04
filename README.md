# Smart City IoT Pipeline

A real-time Smart City simulation and dashboard focused on Johannesburg. The app simulates traffic and air-quality telemetry, exposes REST APIs, and streams live updates over WebSockets.

## What was fixed in project structure

This repository had deployment blockers (for example, the app start script pointed to `api/server.js`, which does not exist). The project is now organized so deployment is straightforward:

- Root project acts as a thin wrapper with convenience scripts.
- Runnable app lives in `smart-city-iot-js/`.
- Docker deployment is defined in root `docker-compose.yml` / `compose.yaml`.
- App container build is defined in root `Dockerfile` (Render-friendly).

## Repository layout

```text
.
├── docker-compose.yml          # Container deployment entrypoint
├── compose.yaml                # Alternative Compose filename
├── Dockerfile                  # Production container image (root)
├── package.json                # Root convenience scripts
├── smart-city-iot-js/
│   ├── Dockerfile              # Legacy app-only image (optional)
│   ├── package.json            # App scripts + dependencies
│   ├── server.js               # Main API + dashboard + websocket server
│   ├── public/                 # Frontend dashboard assets
│   ├── sensors/                # IoT data simulators
│   └── api/                    # Additional API route modules (in-progress)
└── README.md