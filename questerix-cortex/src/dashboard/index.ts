import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

export class Dashboard {
  private io: Server;
  private port: number;

  constructor(port: number) {
    this.port = port;
    const app = express();
    const server = createServer(app);
    this.io = new Server(server);

    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Questerix Cortex Dashboard</title>
          <style>
            body { font-family: -apple-system, sans-serif; background: #0f172a; color: white; padding: 2rem; }
            .card { background: #1e293b; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #334155; }
            .status { font-weight: bold; padding: 0.25rem 0.5rem; border-radius: 4px; }
            .passed { color: #4ade80; background: #064e3b; }
            .failed { color: #f87171; background: #7f1d1d; }
            .running { color: #60a5fa; background: #1e3a8a; }
            .pending { color: #94a3b8; background: #334155; }
            h1 { color: #22d3ee; }
          </style>
        </head>
        <body>
          <h1>🩺 Questerix Cortex</h1>
          <div id="suites"></div>
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io();
            const suitesDiv = document.getElementById('suites');
            socket.on('update', (results) => {
              suitesDiv.innerHTML = '';
              Object.values(results).forEach(r => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = \`
                  <div>
                    <strong>\${r.name}</strong>
                    <span class="status \${r.status}">\${r.status.toUpperCase()}</span>
                    \${r.duration ? '<small>' + r.duration.toFixed(1) + 's</small>' : ''}
                  </div>
                \`;
                suitesDiv.appendChild(div);
              });
            });
          </script>
        </body>
        </html>
      `);
    });

    server.listen(port, () => {
      console.log(`\n📊 Dashboard live at http://localhost:${port}`);
    });
  }

  update(results: any) {
    this.io.emit('update', results);
  }
}
