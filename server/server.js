const mqtt = require('mqtt');

const MQTT_BROKER = 'ws://broker.hivemq.com:8000/mqtt'; // HiveMQ public broker
const MQTT_TOPIC = 'busmate/location';

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ MQTT Server Script Started and Connected to Broker!');
  
  client.subscribe(MQTT_TOPIC, (err) => {
    if (!err) console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
  });
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log('📍 Received location:', data);
  } catch (err) {
    console.error('❌ Invalid message format', err);
  }
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err);
});
