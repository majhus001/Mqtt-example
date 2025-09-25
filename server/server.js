// server.js
const express = require('express');
const aedes = require('aedes')();
const http = require('http');
const ws = require('ws');

const app = express();

// Health check for Render
app.get('/', (req, res) => res.send('✅ Broker running'));

// Port from Render
const PORT = process.env.PORT || 8080;

// HTTP server
const server = http.createServer(app);

// MQTT over WebSocket
const wss = new ws.Server({ server });
wss.on('connection', (wsClient) => {
  const stream = ws.createWebSocketStream(wsClient);
  aedes.handle(stream);
});

// Start server
server.listen(PORT, () => console.log(`Server & MQTT broker on port ${PORT}`));

// Logging
aedes.on('client', (client) => console.log(`Client connected: ${client.id}`));
aedes.on('publish', (packet, client) => {
  if (client) console.log(`${client.id} -> ${packet.topic}: ${packet.payload.toString()}`);
});
aedes.on('clientDisconnect', (client) => console.log(`Client disconnected: ${client.id}`));