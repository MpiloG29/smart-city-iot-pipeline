// dashboard/src/App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import TrafficMap from './components/TrafficMap';
import TrafficStats from './components/TrafficStats';
import AirQualityGauge from './components/AirQualityGauge';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function App() {
  const [trafficData, setTrafficData] = useState([]);
  const [airQualityData, setAirQualityData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on('traffic_update', (data) => {
      setTrafficData(prev => [data, ...prev.slice(0, 49)]);
    });

    newSocket.on('air_quality_update', (data) => {
      setAirQualityData(prev => [data, ...prev.slice(0, 49)]);
    });

    // Fetch initial data
    fetchInitialData();

    // Cleanup
    return () => newSocket.close();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [trafficRes, airQualityRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/traffic?limit=50`),
        fetch(`${API_URL}/api/v1/air-quality?limit=50`),
        fetch(`${API_URL}/api/v1/analytics/traffic`)
      ]);

      if (!trafficRes.ok || !airQualityRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const traffic = await trafficRes.json();
      const airQuality = await airQualityRes.json();
      const analyticsData = await analyticsRes.json();

      setTrafficData(traffic.data || []);
      setAirQualityData(airQuality.data || []);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading Smart City Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading dashboard: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom>
            🏙️ Johannesburg Smart City Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time IoT Monitoring System
          </Typography>
        </Box>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="Traffic" />
          <Tab label="Air Quality" />
          <Tab label="Analytics" />
          <Tab label="Map" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Overview Stats */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Cameras
                </Typography>
                <Typography variant="h4">
                  {analytics?.total_cameras || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Speed
                </Typography>
                <Typography variant="h4">
                  {analytics?.overall_avg_speed?.toFixed(1) || '0'} km/h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Incidents
                </Typography>
                <Typography variant="h4" color="error">
                  {analytics?.total_incidents || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Air Quality Index
                </Typography>
                <Typography variant="h4">
                  {airQualityData[0]?.aqi?.toFixed(1) || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: 300 }}>
              <Typography variant="h6" gutterBottom>
                Traffic Volume Trend
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(str) => new Date(str).toLocaleTimeString()} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vehicle_count" stroke="#8884d8" name="Vehicles" />
                  <Line type="monotone" dataKey="avg_speed" stroke="#82ca9d" name="Speed (km/h)" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: 300 }}>
              <Typography variant="h6" gutterBottom>
                Congestion Distribution
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low', value: trafficData.filter(d => d.congestion_level === 'low').length },
                      { name: 'Moderate', value: trafficData.filter(d => d.congestion_level === 'moderate').length },
                      { name: 'High', value: trafficData.filter(d => d.congestion_level === 'high').length },
                      { name: 'Severe', value: trafficData.filter(d => d.congestion_level === 'severe').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#0088FE" />
                    <Cell fill="#00C49F" />
                    <Cell fill="#FFBB28" />
                    <Cell fill="#FF8042" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && <TrafficStats data={trafficData} />}
      {activeTab === 2 && <AirQualityGauge data={airQualityData} />}
      {activeTab === 3 && analytics && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Analytics Dashboard</Typography>
          {/* Add analytics charts */}
        </Paper>
      )}
      {activeTab === 4 && <TrafficMap data={trafficData} />}
    </Container>
  );
}

export default App;