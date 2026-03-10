const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients
let connectedClients = 0;

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🟢 Client connected. Total: ${connectedClients}`);

    // Send initial data
    socket.emit('traffic-update', getTrafficData());
    socket.emit('kpi-update', getKPIValues());
    socket.emit('aqi-update', getAQIData());
    socket.emit('device-health', getDeviceHealth());

    // Handle request for initial data
    socket.on('request-initial-data', () => {
        console.log('📊 Sending initial data to client');
        socket.emit('traffic-update', getTrafficData());
        socket.emit('kpi-update', getKPIValues());
        socket.emit('aqi-update', getAQIData());
        socket.emit('device-health', getDeviceHealth());
        
        // Send some initial alerts
        const initialAlerts = getInitialAlerts();
        initialAlerts.forEach(alert => {
            socket.emit('new-alert', alert);
        });
    });

    // Handle device commands
    socket.on('device-command', (data) => {
        console.log('📱 Device command received:', data);
        socket.emit('command-response', { 
            status: 'success', 
            message: `Command ${data.command} sent to ${data.location}` 
        });
    });

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`🔴 Client disconnected. Total: ${connectedClients}`);
    });
});

// Real data generators
function getTrafficData() {
    return {
        locations: [
            { name: 'Germiston', vehicles: 21, speed: 45.7, congestion: 'Moderate', status: 'normal', lastUpdate: getCurrentTime(), aqi: 117 },
            { name: 'Rosebank', vehicles: 34, speed: 54.8, congestion: 'Moderate', status: 'normal', lastUpdate: getCurrentTime(), aqi: 79 },
            { name: 'Soweto', vehicles: 31, speed: 55.3, congestion: 'Moderate', status: 'normal', lastUpdate: getCurrentTime(), aqi: 61 },
            { name: 'Sandton', vehicles: 21, speed: 50.3, congestion: 'Moderate', status: 'normal', lastUpdate: getCurrentTime(), aqi: 84 },
            { name: 'CBD', vehicles: 17, speed: 43.4, congestion: 'Heavy', status: 'warning', lastUpdate: getCurrentTime(), aqi: 84 }
        ]
    };
}

function getKPIValues() {
    return {
        avgSpeed: '49.8 km/h',
        activeCameras: '5',
        activeIncidents: '0',
        avgAQI: '86',
        activeAlerts: '10'
    };
}

function getAQIData() {
    return {
        values: [117, 79, 61, 84, 84],
        locations: ['Germiston', 'Rosebank', 'Soweto', 'Sandton', 'CBD']
    };
}

function getDeviceHealth() {
    return {
        devices: [
            { status: '5/5 Online', uptime: '100%' },
            { status: '5/5 Online', uptime: '99.9%' },
            { status: '23/24 Online', uptime: '95.8%' },
            { status: '8/8 Online', uptime: '100%' }
        ]
    };
}

function getInitialAlerts() {
    return [
        { 
            location: 'CBD', 
            time: getCurrentTime(), 
            message: 'Accident detected on M1 North', 
            type: 'accident', 
            severity: 'critical', 
            status: 'active' 
        },
        { 
            location: 'Sandton', 
            time: getCurrentTime(), 
            message: 'Flooding detected in Sandton', 
            type: 'flooding', 
            severity: 'high', 
            status: 'active' 
        },
        { 
            location: 'Germiston', 
            time: getCurrentTime(), 
            message: 'Poor air quality (AQI: 117)', 
            type: 'air-quality', 
            severity: 'medium', 
            status: 'active' 
        },
        { 
            location: 'Rosebank', 
            time: getCurrentTime(), 
            message: 'Traffic signal malfunction', 
            type: 'breakdown', 
            severity: 'medium', 
            status: 'active' 
        },
        { 
            location: 'Soweto', 
            time: getCurrentTime(), 
            message: 'Vehicle breakdown on highway', 
            type: 'breakdown', 
            severity: 'low', 
            status: 'active' 
        }
    ];
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// Generate random alert for variety
function generateRandomAlert() {
    const types = ['accident', 'flooding', 'air-quality', 'breakdown'];
    const locations = ['CBD', 'Sandton', 'Soweto', 'Rosebank', 'Germiston'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    let message;
    switch(type) {
        case 'accident': message = 'Accident detected'; break;
        case 'flooding': message = 'Flooding detected'; break;
        case 'air-quality': message = `Poor air quality (AQI: ${Math.floor(Math.random() * 100 + 100)})`; break;
        case 'breakdown': message = 'Vehicle breakdown'; break;
    }
    
    return {
        type,
        location,
        message,
        severity,
        time: getCurrentTime(),
        status: 'active'
    };
}

// Broadcast updates every 5 seconds
setInterval(() => {
    io.emit('traffic-update', getTrafficData());
    io.emit('kpi-update', getKPIValues());
    io.emit('aqi-update', getAQIData());
    io.emit('device-health', getDeviceHealth());
    
    // Send random alerts occasionally (30% chance)
    if (Math.random() > 0.7) {
        const alert = generateRandomAlert();
        io.emit('new-alert', alert);
        console.log('🚨 New alert sent:', alert.location, alert.message);
    }
    
    // Send ping for latency measurement
    io.emit('ping', Date.now());
}, 5000);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
});