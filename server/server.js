const express = require('express');
const aedes = require('aedes')();
const http = require('http');
const ws = require('ws');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check for Render
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Broker running',
    timestamp: new Date().toISOString(),
    clients: aedes.connectedClients
  });
});

// Additional health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    clients: Object.keys(aedes.clients).length
  });
});

// Port from Render
const PORT = process.env.PORT || 8080;

// HTTP server
const server = http.createServer(app);

// MQTT over WebSocket
const wss = new ws.Server({ 
  server, 
  path: '/mqtt',
  verifyClient: (info, cb) => {
    console.log('🔗 WebSocket connection attempt from:', info.origin);
    cb(true); // Accept all connections
  }
});

wss.on('connection', (wsClient, req) => {
  console.log('✅ WebSocket connection established:', req.url);
  
  const stream = ws.createWebSocketStream(wsClient);
  
  stream.on('error', (error) => {
    console.log('❌ WebSocket stream error:', error);
  });
  
  wsClient.on('close', (code, reason) => {
    console.log('🔌 WebSocket connection closed:', code, reason?.toString());
  });
  
  aedes.handle(stream);
});

// MQTT Broker Event Handlers
aedes.on('client', (client) => {
  console.log(`✅ Client connected: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`🔌 Client disconnected: ${client.id}`);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`📨 ${client.id} -> ${packet.topic}: ${packet.payload.toString()}`);
  }
});

aedes.on('subscribe', (subscriptions, client) => {
  console.log(`📝 ${client.id} subscribed to:`, subscriptions.map(s => s.topic).join(', '));
});

aedes.on('unsubscribe', (unsubscriptions, client) => {
  console.log(`📝 ${client.id} unsubscribed from:`, unsubscriptions.join(', '));
});

aedes.on('clientError', (client, error) => {
  console.log(`❌ Client error (${client.id}):`, error);
});

// Error handling
aedes.on('connectionError', (client, error) => {
  console.log('❌ MQTT Connection error:', error);
});

server.on('error', (error) => {
  console.log('❌ Server error:', error);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server & MQTT broker running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}/mqtt`);
  console.log(`🌐 Render URL: https://mqtt-server-0dxl.onrender.com`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});