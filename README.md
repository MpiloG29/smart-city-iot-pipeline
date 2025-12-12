# Smart City IoT Data Pipeline

## Overview
Real-time data processing pipeline for smart city IoT analytics. Processes data from traffic cameras, air quality sensors, and smart meters using MQTT, Kafka, Spark Streaming, and TimescaleDB.

## Features
- Real-time data ingestion from IoT devices
- Stream processing with Apache Spark
- Time-series data storage
- Interactive dashboards
- Edge computing capabilities

##  Architecture
![Architecture Diagram](docs/architecture.png)

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
