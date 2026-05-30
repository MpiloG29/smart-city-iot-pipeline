const express = require('express');
const http    = require('http');
const socketIo = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, { cors: { origin: '*', methods: ['GET','POST'] } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let connectedClients = 0;
const citizenReports = [];

// ── City configuration ────────────────────────────────────────────────────────

const CITIES = ['Johannesburg', 'Durban', 'Cape Town', 'Pretoria', 'Gqeberha', 'Bloemfontein'];

const CITY_CFG = {
    Johannesburg: { road: 'M1 Highway',      bus: 'Rea Vaya BRT',       train: 'Gautrain',            aqiBase: 88, province: 'Gauteng',      hospital: 'Charlotte Maxeke Hospital',  police: 'Johannesburg Central Police' },
    Durban:       { road: 'N2 Highway',      bus: 'People Mover BRT',   train: 'Metrorail Durban',    aqiBase: 72, province: 'KwaZulu-Natal', hospital: 'King Edward VIII Hospital',  police: 'Durban Central Police'       },
    'Cape Town':  { road: 'N1 City Bowl',    bus: 'MyCiTi BRT',         train: 'Cape Town Metrorail', aqiBase: 58, province: 'Western Cape',  hospital: 'Groote Schuur Hospital',     police: 'Cape Town Central Police'    },
    Pretoria:     { road: 'N14 Highway',     bus: 'Tshwane BRT',        train: 'Gautrain Pretoria',   aqiBase: 76, province: 'Gauteng',      hospital: 'Steve Biko Academic Hospital',police:'Pretoria Central Police'     },
    Gqeberha:     { road: 'N2 Eastern Cape', bus: 'GoBay Bus',          train: 'Metrorail PE',        aqiBase: 68, province: 'Eastern Cape',  hospital: 'Dora Nginza Hospital',       police: 'Gqeberha Central Police'    },
    Bloemfontein: { road: 'N1 Free State',   bus: 'Mangaung Express',   train: 'Shosholoza Meyl',    aqiBase: 54, province: 'Free State',    hospital: 'Pelonomi Hospital',          police: 'Bloemfontein Central Police' }
};

const CITY_DISTRICTS = {
    Johannesburg: ['CBD','Sandton','Soweto','Rosebank','Germiston'],
    Durban:       ['CBD','Berea','Umlazi','Pinetown','Umhlanga'],
    'Cape Town':  ['CBD','Bellville','Khayelitsha','Mitchells Plain','Sea Point'],
    Pretoria:     ['CBD','Centurion','Soshanguve','Hatfield','Mamelodi'],
    Gqeberha:     ['CBD','Summerstrand','Motherwell','Uitenhage','New Brighton'],
    Bloemfontein: ['CBD','Mangaung','Botshabelo','Universitas','Bainsvlei']
};

// ── Socket handlers ───────────────────────────────────────────────────────────

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🟢 Client connected. Total: ${connectedClients}`);

    emitAll(socket);

    socket.on('request-initial-data', () => {
        emitAll(socket);
        getInitialAlerts().forEach(a => socket.emit('new-alert', a));
    });

    socket.on('device-command', (data) => {
        socket.emit('command-response', { status: 'success', message: `Command ${data.command} sent to ${data.location}` });
    });

    socket.on('citizen-report', (report) => {
        const rec = { ...report, id: Date.now(), time: getCurrentTime(), status: 'Received', ticketNumber: `RPT-${Math.floor(Math.random()*9000+1000)}` };
        citizenReports.unshift(rec);
        if (citizenReports.length > 50) citizenReports.pop();
        io.emit('report-received', rec);
        console.log(`📝 Report: ${rec.category} – ${rec.location}`);
    });

    socket.on('chat-query', (query) => {
        socket.emit('chat-response', processAIQuery(query));
    });

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`🔴 Client disconnected. Total: ${connectedClients}`);
    });
});

function emitAll(target) {
    target.emit('traffic-update',     getTrafficData());
    target.emit('kpi-update',         getKPIValues());
    target.emit('aqi-update',         getAQIData());
    target.emit('device-health',      getDeviceHealth());
    target.emit('predictions-update', getTrafficPredictions());
    target.emit('emergency-update',   getEmergencyData());
    target.emit('flood-update',       getFloodData());
    target.emit('electricity-update', getElectricityData());
    target.emit('crime-update',       getCrimeData());
    target.emit('parking-update',     getParkingData());
    target.emit('transport-update',   getTransportData());
}

// ── Core data generators ──────────────────────────────────────────────────────

function getTrafficData() {
    const hour = new Date().getHours();
    const rush = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    return {
        locations: CITIES.map((city) => {
            const cfg  = CITY_CFG[city];
            const spd  = clamp(+(65 - rand(20) - (rush ? 12 : 0)).toFixed(1), 18, 85);
            const cong = spd < 35 ? 'Heavy' : spd < 50 ? 'Moderate' : 'Light';
            const stat = spd < 35 ? 'critical' : spd < 50 ? 'warning' : 'normal';
            return {
                name:        city,
                province:    cfg.province,
                vehicles:    Math.floor(rand(40) + 20 + (rush ? 25 : 0)),
                speed:       spd,
                congestion:  cong,
                status:      stat,
                lastUpdate:  getCurrentTime(),
                aqi:         Math.floor(cfg.aqiBase + rand(35)),
                districts:   CITY_DISTRICTS[city]
            };
        })
    };
}

function getKPIValues() {
    const hour  = new Date().getHours();
    const rush  = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    const avgSpd = rush ? (35 + rand(10)).toFixed(1) : (52 + rand(12)).toFixed(1);
    return {
        avgSpeed:        `${avgSpd} km/h`,
        activeCameras:   `${CITIES.length * 5}`,
        activeIncidents: `${Math.floor(rand(6))}`,
        avgAQI:          `${Math.floor(CITIES.reduce((s,c) => s + CITY_CFG[c].aqiBase, 0) / CITIES.length + rand(15))}`,
        activeAlerts:    `${Math.floor(rand(12) + 3)}`
    };
}

function getAQIData() {
    return {
        values:    CITIES.map(c => Math.floor(CITY_CFG[c].aqiBase + rand(30))),
        locations: CITIES
    };
}

function getDeviceHealth() {
    return {
        devices: [
            { status: `${CITIES.length * 5}/${CITIES.length * 5} Online`, uptime: '99.8%'  },
            { status: `${CITIES.length * 5}/${CITIES.length * 5} Online`, uptime: '99.5%'  },
            { status: `${CITIES.length * 4 - 1}/${CITIES.length * 4} Online`, uptime: '97.9%' },
            { status: `${CITIES.length * 8}/${CITIES.length * 8} Online`, uptime: '100%'  }
        ]
    };
}

function getInitialAlerts() {
    return [
        { location: 'Johannesburg', time: getCurrentTime(), message: 'Accident on M1 North',          type: 'accident',    severity: 'critical', status: 'active' },
        { location: 'Durban',       time: getCurrentTime(), message: 'Flooding near Umgeni River',    type: 'flooding',    severity: 'high',     status: 'active' },
        { location: 'Cape Town',    time: getCurrentTime(), message: 'Strong wind warning – N1',      type: 'breakdown',   severity: 'medium',   status: 'active' },
        { location: 'Gqeberha',     time: getCurrentTime(), message: 'Poor air quality (AQI: 112)',   type: 'air-quality', severity: 'medium',   status: 'active' },
        { location: 'Pretoria',     time: getCurrentTime(), message: 'Traffic signal malfunction',    type: 'breakdown',   severity: 'low',      status: 'active' }
    ];
}

function generateRandomAlert() {
    const types     = ['accident', 'flooding', 'air-quality', 'breakdown'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const type     = pick(types);
    const city     = pick(CITIES);
    const severity = pick(severities);
    const msgs = {
        accident:    'Accident detected',
        flooding:    'Flood risk elevated',
        'air-quality': `Poor air quality (AQI: ${Math.floor(rand(80) + 100)})`,
        breakdown:   'Infrastructure issue detected'
    };
    return { type, location: city, message: msgs[type], severity, time: getCurrentTime(), status: 'active' };
}

// ── Feature 1 – AI Traffic Predictions ───────────────────────────────────────

function getTrafficPredictions() {
    const hour = new Date().getHours();
    const morning = hour >= 7 && hour <= 9;
    const evening = hour >= 16 && hour <= 18;
    const night   = hour >= 22 || hour <= 5;

    return CITIES.map(city => {
        const base  = morning ? 0.85 : evening ? 0.90 : night ? 0.15 : 0.42;
        const risk  = clamp(base + (Math.random() * 0.22 - 0.11), 0, 1);
        return {
            location:   city,
            road:       CITY_CFG[city].road,
            prediction: risk > 0.75 ? 'Heavy Congestion Expected' : risk > 0.45 ? 'Moderate Congestion Expected' : 'Free Flow Expected',
            riskScore:  Math.floor(risk * 100),
            eta:        Math.floor(rand(45) + 10),
            confidence: Math.floor(rand(14) + 79),
            trend:      risk > 0.6 ? 'worsening' : 'improving',
            level:      risk > 0.75 ? 'high' : risk > 0.45 ? 'medium' : 'low'
        };
    });
}

// ── Feature 2 – Emergency Response ───────────────────────────────────────────

function getEmergencyData() {
    const pool = CITIES.slice(0, 4).map((city, i) => ({
        type:            ['accident','medical','fire','crime'][i],
        location:        city,
        severity:        ['critical','high','high','medium'][i],
        nearestHospital: `${CITY_CFG[city].hospital} (${(rand(4)+0.5).toFixed(1)}km)`,
        nearestPolice:   `${CITY_CFG[city].police} (${(rand(2)+0.3).toFixed(1)}km)`,
        route:           CITY_CFG[city].road,
        responseTime:    `${Math.floor(rand(6)+3)} min`,
        unit:            ['Ambulance A3','EMS Unit 7','Fire Engine 12','Patrol Car 8'][i],
        time:            getCurrentTime()
    }));
    const count = Math.floor(rand(3));
    return {
        activeIncidents:   pool.slice(0, count),
        totalResponseUnits: CITIES.length * 8,
        avgResponseTime:   `${(rand(3)+4).toFixed(1)} min`,
        hospitals:         CITIES.slice(0, 3).map(city => ({
            name:      CITY_CFG[city].hospital,
            city,
            distance:  `${(rand(5)+1).toFixed(1)}km`,
            available: rand(1) > 0.25,
            beds:      Math.floor(rand(30) + 5)
        }))
    };
}

// ── Feature 3 – Flood Monitoring ─────────────────────────────────────────────

function getFloodData() {
    const areas = CITIES.map(city => {
        const rainfall   = +(rand(28)).toFixed(1);
        const riverLevel = +(rand(3.2) + 0.4).toFixed(2);
        const riskScore  = Math.floor((rainfall / 28) * 50 + (riverLevel / 3.6) * 50);
        return {
            location:         city,
            rainfall,
            riverLevel,
            riskScore,
            floodRisk:        riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low',
            stormDrainStatus: rand(1) > 0.85 ? 'Blocked' : 'Clear',
            humidity:         Math.floor(rand(40) + 45)
        };
    });
    return {
        areas,
        totalRainfall24h: +(rand(60) + 5).toFixed(1),
        alertLevel:       rand(1) > 0.82 ? 'Warning' : 'Normal',
        nextRainExpected: `${Math.floor(rand(14) + 1)} hours`
    };
}

// ── Feature 4 – Electricity Monitoring ───────────────────────────────────────

function getElectricityData() {
    const stage = rand(1) > 0.5 ? Math.floor(rand(3) + 1) : 0;
    return {
        loadSheddingStage:  stage,
        loadSheddingActive: stage > 0,
        totalConsumption:   (rand(800) + 1200).toFixed(0),
        solarGeneration:    (rand(220) + 60).toFixed(1),
        gridFrequency:      (rand(0.3) + 49.9).toFixed(2),
        renewableShare:     Math.floor(rand(12) + 18),
        areas: CITIES.map(city => ({
            location:    city,
            consumption: (rand(150) + 80).toFixed(1),
            status:      stage > 0 && rand(1) > 0.45 ? 'Load Shedding' : 'Normal',
            nextOutage:  stage > 0 ? `${String(Math.floor(rand(12)+8)).padStart(2,'0')}:00` : 'None scheduled'
        }))
    };
}

// ── Feature 5 – Crime Analytics ───────────────────────────────────────────────

function getCrimeData() {
    const crimeTypes = ['Theft','Robbery','Assault','Vehicle Crime','Fraud'];
    const peakTimes  = ['22:00–02:00','18:00–21:00','12:00–14:00','06:00–09:00'];
    return {
        areas: CITIES.map(city => {
            const riskScore = Math.floor(rand(100));
            return {
                location:     city,
                incidents24h: Math.floor(rand(20) + 2),
                riskScore,
                hotspotRisk:  riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low',
                peakTime:     pick(peakTimes),
                topCrime:     pick(crimeTypes),
                trend:        rand(1) > 0.5 ? '↑' : '↓'
            };
        }),
        totalToday: Math.floor(rand(100) + 50),
        totalWeek:  Math.floor(rand(400) + 200),
        trend:      rand(1) > 0.5 ? 'Increasing' : 'Decreasing'
    };
}

// ── Feature 9 – Parking ───────────────────────────────────────────────────────

function getParkingData() {
    const hubs = [
        { name: 'Johannesburg CBD Hub',     city: 'Johannesburg', total: 500 },
        { name: 'Durban Waterfront Garage', city: 'Durban',       total: 420 },
        { name: 'Cape Town V&A Parking',    city: 'Cape Town',    total: 750 },
        { name: 'Pretoria Hatfield Mall',   city: 'Pretoria',     total: 350 },
        { name: 'Gqeberha Baywest Mall',    city: 'Gqeberha',     total: 320 },
        { name: 'Mimosa Mall Bloemfontein', city: 'Bloemfontein', total: 280 }
    ];
    const locations = hubs.map(p => {
        const occupied  = Math.floor(rand(p.total * 0.45) + p.total * 0.40);
        const available = p.total - occupied;
        const rate      = Math.round((occupied / p.total) * 100);
        return { ...p, occupied, available, occupancyRate: rate, status: rate > 90 ? 'Full' : rate > 70 ? 'Limited' : 'Available', price: `R${Math.floor(rand(7)+8)}/hr` };
    });
    return { locations, totalAvailable: locations.reduce((s,l) => s + l.available, 0) };
}

// ── Feature 10 – Public Transport ────────────────────────────────────────────

function getTransportData() {
    const buses  = CITIES.map(city => {
        const cfg = CITY_CFG[city];
        return {
            route:      cfg.bus,
            city,
            passengers: Math.floor(rand(80) + 20),
            capacity:   120,
            status:     rand(1) > 0.85 ? 'Delayed' : 'On Time',
            eta:        `${Math.floor(rand(18)+2)} min`,
            progress:   Math.floor(rand(100))
        };
    });
    const trains = CITIES.map(city => {
        const cfg = CITY_CFG[city];
        return {
            line:        cfg.train,
            city,
            status:      rand(1) > 0.78 ? 'Delayed' : 'On Time',
            nextArrival: `${Math.floor(rand(18)+2)} min`,
            passengers:  Math.floor(rand(250) + 50),
            frequency:   ['Johannesburg','Pretoria'].includes(city) ? '15 min' : '30 min'
        };
    });
    return {
        buses,
        trains,
        taxis: {
            active:   Math.floor(rand(200) + 300),
            hotspots: ['Park Station (JHB)','Durban Workshop','Cape Town Station','Pretoria Station','Gqeberha Rank','Mangaung Rank'],
            avgWait:  `${Math.floor(rand(10)+2)} min`,
            routes:   Math.floor(rand(60) + 100)
        }
    };
}

// ── Feature 7 – AI Chat ───────────────────────────────────────────────────────

function processAIQuery(q) {
    const query = q.toLowerCase();

    if (/air quality|aqi|pollution|pm2/.test(query))
        return { response: `Air quality across South Africa: Cape Town has the cleanest air (AQI ~58 – Good), while Johannesburg and Gqeberha have elevated readings due to industrial activity. Gqeberha shows AQI ~112 today (Unhealthy for Sensitive Groups). Avoid outdoor exercise near heavy-industry zones.`, type: 'aqi' };

    if (/traffic|congestion|road|highway|m1|n2|n1/.test(query))
        return { response: 'Traffic status: Johannesburg M1 and Pretoria N14 showing moderate-to-heavy congestion. Durban N2 is experiencing elevated vehicle density near the harbour. Cape Town N1 City Bowl is flowing freely. AI models predict congestion will ease in ~20–30 minutes.', type: 'traffic' };

    if (/flood|rain|water|river|storm|umgeni/.test(query))
        return { response: 'Flood monitoring: Durban and Johannesburg show elevated flood risk due to recent rainfall. Umgeni River (Durban) levels are approaching medium threshold. Cape Town and Bloemfontein remain low risk. All provincial disaster management centres are on standby.', type: 'flood' };

    if (/load.?shed|electricity|eskom|power|outage/.test(query))
        return { response: 'Electricity: Eskom load shedding status updated in real-time. Solar generation currently contributing ~100–200 MW nationally. Grid frequency stable at ~50 Hz. Check the Electricity panel for city-specific outage schedules. Pretoria and Johannesburg are most affected by load shedding.', type: 'electricity' };

    if (/crime|safe|security|police|danger/.test(query))
        return { response: 'Safety across SA: Johannesburg CBD and Gqeberha have elevated risk scores for evening hours (22:00–02:00). Cape Town and Bloemfontein show lower crime indices. Durban harbour area has increased patrol presence. Emergency numbers: 10111 (Police) · 10177 (Ambulance) · 107 (Fire).', type: 'crime' };

    if (/park|parking/.test(query))
        return { response: 'Parking availability: Cape Town V&A Waterfront has the most spaces (~750 total). Bloemfontein Mimosa Mall and Gqeberha Baywest have the highest availability. Johannesburg CBD Hub is near capacity during business hours. Prices range from R8–R15/hr.', type: 'parking' };

    if (/bus|taxi|train|transport|commute|gautrain|metrorail|rea.?vaya|myciti|people.?mover/.test(query))
        return { response: 'Public transport: Gautrain (JHB/PTA) running on 15-min schedule. MyCiTi BRT in Cape Town operating normally. Rea Vaya BRT in Johannesburg has 6 active routes. Metrorail experiencing minor delays in Durban and Gqeberha. 300+ taxis active across 100+ routes nationally.', type: 'transport' };

    if (/emergency|accident|fire|ambulance|hospital/.test(query))
        return { response: 'Emergency services: 48 response units deployed across all 6 cities. Average response time: 5–7 minutes. Key hospitals: Charlotte Maxeke (JHB) · King Edward VIII (DBN) · Groote Schuur (CPT) · Steve Biko Academic (PTA). Emergency: 10111 Police · 10177 Ambulance · 107 Fire.', type: 'emergency' };

    if (/cape.?town|capetown/.test(query))
        return { response: 'Cape Town status: AQI is the best in SA at ~58 (Good). N1 traffic flowing well. Flood risk is Low. No active load shedding in central areas. MyCiTi BRT on schedule. V&A Waterfront parking has good availability.', type: 'info' };

    if (/durban|ethekwini/.test(query))
        return { response: 'Durban status: N2 Highway experiencing moderate congestion near harbour. Flood risk elevated – Umgeni River monitoring active. People Mover BRT operational. Durban has a coastal humidity index above 70%. Waterfront parking available.', type: 'info' };

    if (/pretoria|tshwane/.test(query))
        return { response: 'Pretoria (Tshwane) status: N14 Highway showing peak-hour congestion. Gautrain Pretoria line running on time. Load shedding may affect some suburbs – check Electricity panel. Steve Biko Academic Hospital is the primary trauma centre.', type: 'info' };

    if (/johannesburg|jhb|joburg/.test(query))
        return { response: 'Johannesburg status: M1 Highway has moderate-to-heavy congestion. AQI elevated at ~88 – avoid outdoor activities near CBD. Rea Vaya BRT running normally. Gautrain on schedule. CBD Parking Hub approaching capacity during peak hours.', type: 'info' };

    if (/gqeberha|port.?elizabeth|pe|buffalo/.test(query))
        return { response: 'Gqeberha (Port Elizabeth) status: AQI elevated (~112) due to industrial activity near harbour. N2 Eastern Cape flowing moderately. GoBay Bus running. Flood risk is Medium. Baywest Mall parking available.', type: 'info' };

    if (/bloemfontein|mangaung/.test(query))
        return { response: 'Bloemfontein (Mangaung) status: Lowest AQI in SA at ~54 (Good). N1 Free State flowing freely. Low crime index. Minimal load shedding impact. Shosholoza Meyl train service operational. Mimosa Mall parking available.', type: 'info' };

    if (/hello|hi|hey/.test(query))
        return { response: 'Hello! I am the South Africa Smart City AI. I monitor Johannesburg, Durban, Cape Town, Pretoria, Gqeberha, and Bloemfontein. Ask me about traffic, air quality, flooding, electricity/load shedding, crime, parking, or transport in any city.', type: 'help' };

    return { response: 'I can answer questions about any of the 6 cities: Johannesburg, Durban, Cape Town, Pretoria, Gqeberha, or Bloemfontein. Topics: air quality, traffic, flooding, electricity/load shedding, crime, parking, and public transport. Try: "How is Cape Town traffic?" or "Is there load shedding in Pretoria?"', type: 'help' };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(n)      { return Math.random() * (n || 1); }
function clamp(v,a,b) { return Math.min(b, Math.max(a, v)); }
function pick(arr)    { return arr[Math.floor(Math.random() * arr.length)]; }
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Broadcast loop (every 5 s) ────────────────────────────────────────────────

setInterval(() => {
    io.emit('traffic-update',     getTrafficData());
    io.emit('kpi-update',         getKPIValues());
    io.emit('aqi-update',         getAQIData());
    io.emit('device-health',      getDeviceHealth());
    io.emit('predictions-update', getTrafficPredictions());
    io.emit('emergency-update',   getEmergencyData());
    io.emit('flood-update',       getFloodData());
    io.emit('electricity-update', getElectricityData());
    io.emit('crime-update',       getCrimeData());
    io.emit('parking-update',     getParkingData());
    io.emit('transport-update',   getTransportData());

    if (Math.random() > 0.70) {
        const alert = generateRandomAlert();
        io.emit('new-alert', alert);
        console.log(`🚨 Alert: ${alert.location} – ${alert.message}`);
    }

    io.emit('ping', Date.now());
}, 5000);

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Smart City Intelligence Platform – http://localhost:${PORT}`);
    console.log(`🗺️  Cities: ${CITIES.join(' · ')}`);
    console.log(`🤖 Features: AI Predictions · Emergency · Flood · Electricity · Crime · Parking · Transport · Chat · Digital Twin`);
});
