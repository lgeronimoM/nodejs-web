const express = require('express');
const axios = require('axios');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const POD_NAME = process.env.HOSTNAME || os.hostname();
const SERVICE_NAME = process.env.SERVICE_NAME || 'nodejs-web-service';
const NAMESPACE = process.env.NAMESPACE || 'default';

// Almacena mensajes recibidos de otros pods
let messages = [];
let lastCheck = new Date();

app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', pod: POD_NAME, uptime: process.uptime() });
});

// Endpoint principal - muestra información del pod y mensajes
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pod Communication Test</title>
      <meta http-equiv="refresh" content="5">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 10px; font-size: 14px; }
        .pod-info { background: #4CAF50; color: white; padding: 12px; border-radius: 5px; margin-bottom: 10px; }
        .messages { background: #f5f5f5; padding: 12px; border-radius: 5px; }
        .message { background: white; padding: 8px; margin: 8px 0; border-left: 3px solid #2196F3; font-size: 13px; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-bottom: 8px; }
        .timestamp { color: #666; font-size: 12px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 13px; }
        .stat { background: rgba(255,255,255,0.2); padding: 8px; border-radius: 3px; }
        .footer { text-align: center; margin-top: 10px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="pod-info">
        <h1>🚀 Pod: ${POD_NAME}</h1>
        <div class="stats">
          <div class="stat"><strong>Uptime:</strong> ${Math.floor(process.uptime())}s</div>
          <div class="stat"><strong>Memory:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</div>
          <div class="stat"><strong>Service:</strong> ${SERVICE_NAME}</div>
          <div class="stat"><strong>Namespace:</strong> ${NAMESPACE}</div>
        </div>
      </div>
      
      <div class="messages">
        <h2>📨 Mensajes de otros Pods (${messages.length})</h2>
        <p class="timestamp">Última actualización: ${lastCheck.toLocaleTimeString()}</p>
        ${messages.length === 0 
          ? '<p>No hay mensajes aún...</p>' 
          : messages.map(m => `
              <div class="message">
                <strong>De:</strong> ${m.from} | 
                <strong>Mensaje:</strong> ${m.text} | 
                <span class="timestamp">${new Date(m.timestamp).toLocaleTimeString()}</span>
              </div>
            `).join('')
        }
      </div>
      
      <p class="footer">🔄 Auto-refresh cada 5 segundos</p>
    </body>
    </html>
  `;
  res.send(html);
});

// Endpoint para recibir mensajes de otros pods
app.post('/message', (req, res) => {
  const { from, text } = req.body;
  messages.unshift({
    from,
    text,
    timestamp: new Date().toISOString()
  });
  
  // Mantener solo los últimos 10 mensajes
  if (messages.length > 10) {
    messages = messages.slice(0, 10);
  }
  
  console.log(`📨 Mensaje recibido de ${from}: ${text}`);
  res.json({ status: 'received', pod: POD_NAME });
});

// Función para enviar mensajes a otros pods
async function broadcastMessage() {
  try {
    const message = `Hola desde ${POD_NAME} 👋`;
    const serviceUrl = `http://${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local:80/message`;
    
    console.log(`📤 Enviando mensaje a: ${serviceUrl}`);
    
    await axios.post(serviceUrl, {
      from: POD_NAME,
      text: message
    }, {
      timeout: 2000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    lastCheck = new Date();
  } catch (error) {
    console.log(`⚠️  Error enviando mensaje: ${error.message}`);
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pod ${POD_NAME} escuchando en puerto ${PORT}`);
  
  // Enviar mensajes cada 10 segundos
  setInterval(broadcastMessage, 10000);
  
  // Primer mensaje después de 5 segundos
  setTimeout(broadcastMessage, 5000);
});
