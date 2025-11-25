const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const POD_NAME = process.env.HOSTNAME || os.hostname();
const SERVICE_NAME = process.env.SERVICE_NAME || 'nodejs-web-service';
const NAMESPACE = process.env.NAMESPACE || 'default';

app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', pod: POD_NAME, uptime: process.uptime() });
});

// Página principal: solo info del pod
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pod Info</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 16px; font-size: 14px; color: #222; background: #fafafa; }
        .pod-info { background: #4CAF50; color: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
        h1 { font-size: 20px; margin-bottom: 8px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; font-size: 13px; }
        .stat { background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px; }
        .footer { text-align: center; margin-top: 12px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="pod-info">
        <h1>Pod: ${POD_NAME}</h1>
        <div class="stats">
          <div class="stat"><strong>Uptime:</strong> ${Math.floor(process.uptime())}s</div>
          <div class="stat"><strong>Memory:</strong> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</div>
          <div class="stat"><strong>Service:</strong> ${SERVICE_NAME}</div>
          <div class="stat"><strong>Namespace:</strong> ${NAMESPACE}</div>
        </div>
      </div>

      <p class="footer">✅ Página simplificada node JS.</p>
    </body>
    </html>
  `;
  res.send(html);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pod ${POD_NAME} escuchando en puerto ${PORT}`);
});
