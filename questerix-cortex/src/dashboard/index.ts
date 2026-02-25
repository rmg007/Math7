import { execSync } from 'child_process';
import express from 'express';
import * as fs from 'fs';
import { createServer } from 'http';
import * as path from 'path';
import { Server } from 'socket.io';
import { DriftResult } from '../drift/index';
import { HistoryRecord } from '../historian/index';
import { TaskResult } from '../orchestrator/index';
import { RlsAuditResult } from '../rls/index';
import { SurfaceMap } from '../scanner/index';
import { AnalystResults } from '../types';

export class Dashboard {
  private io: Server;
  private port: number;
  private onTriggerCallback?: (target: string) => void;
  private logs: Array<{ text: string; color?: string; bold?: boolean }> = [];

  constructor(port: number) {
    this.port = port;

    // ── Pre-flight: Port Sniper (Self-Healing) ──
    try {
      if (process.platform === 'win32') {
        const cmd = `$proc = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 }; if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }`;
        execSync(`powershell -NoProfile -Command "${cmd}"`);
      } else {
        execSync(`lsof -t -i:${port} | xargs kill -9 2>/dev/null || true`);
      }
    } catch (e) {
      // Ignore errors if port wasn't in use
    }
    const app = express();
    const server = createServer(app);
    this.io = new Server(server);

    const dashboardDistPath = path.resolve(__dirname, '..', '..', 'dashboard', 'dist');
    const dashboardIndexPath = path.join(dashboardDistPath, 'index.html');

    if (fs.existsSync(dashboardIndexPath)) {
      app.use(express.static(dashboardDistPath));
      app.get(/^\/(?!socket\.io).*/, (_req, res) => {
        res.sendFile(dashboardIndexPath);
      });
    } else {
      app.get('/', (_req, res) => {
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <title>Questerix Cortex</title>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #f1f5f9; padding: 2rem; }
            .container { max-width: 1200px; margin: 0 auto; }

            /* ── Header ── */
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #1e293b; gap: 2rem; flex-wrap: wrap; }
            h1 { color: #22d3ee; font-size: 1.6rem; white-space: nowrap; }
            .subtitle { color: #475569; font-size: 0.75rem; margin-top: 0.2rem; }

            /* ── Controls — single compact row ── */
            .controls { display: flex; align-items: center; gap: 0; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 0.35rem 0.5rem; flex-wrap: wrap; }
            .ctrl-divider { width: 1px; background: #1e293b; align-self: stretch; margin: 0 0.4rem; }
            .btn { border: none; padding: 0.32rem 0.7rem; border-radius: 6px; font-weight: 600; font-size: 0.72rem; cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em; }
            .btn:hover:not(:disabled) { filter: brightness(1.25); transform: translateY(-1px); }
            .btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
            .btn-smoke   { background: #334155; color: #e2e8f0; }
            .btn-deep    { background: #1e3a8a; color: #bfdbfe; }
            .btn-intel   { background: #4c1d95; color: #ddd6fe; }
            .btn-release { background: #134e4a; color: #99f6e4; }
            .btn-deploy  { background: #b45309; color: #fef3c7; }
            .btn-ship    { background: #0369a1; color: #e0f2fe; }
            .btn-mega    { background: linear-gradient(135deg,#7c3aed,#c026d3); color: #fff; padding: 0.38rem 1rem; margin-left: 0.25rem; }

            /* ── Sparkline ── */
            .spark-section { margin-bottom: 1rem; }
            .spark-label { font-size: 0.62rem; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.3rem; }
            .spark { display: flex; align-items: flex-end; gap: 3px; height: 32px; }
            .spark-bar { flex: 1; border-radius: 3px 3px 0 0; min-width: 8px; transition: height 0.3s; }

            /* ── Stats row ── */
            .stats { display: grid; grid-template-columns: repeat(6,1fr); gap: 0.65rem; margin-bottom: 1.25rem; }
            .stat-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 0.8rem 1rem; }
            .stat-val { font-size: 1.35rem; font-weight: 700; }
            .stat-lbl { font-size: 0.62rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.15rem; }

            /* ── Two-column layout ── */
            .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

            /* ── Section header ── */
            .sh { font-size: 0.62rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; margin-top: 1.1rem; display: flex; align-items: center; gap: 0.5rem; }
            .sh-badge { font-size: 0.58rem; padding: 0.1rem 0.45rem; border-radius: 9999px; font-weight: 700; }
            .badge-ok   { background:#052e16; color:#4ade80; border:1px solid #166534; }
            .badge-warn { background:#431407; color:#fb923c; border:1px solid #ea580c; }
            .badge-err  { background:#2a0b0b; color:#f87171; border:1px solid #7f1d1d; }
            .badge-info { background:#0c1a3a; color:#60a5fa; border:1px solid #1e3a8a; }

            /* ── Suite cards ── */
            .card { background: #0f172a; padding: 0.9rem 1.1rem; border-radius: 10px; margin-bottom: 0.45rem; border: 1px solid #1e293b; transition: border-color 0.2s; }
            .card:hover { border-color: #334155; }
            .card-row { display: flex; justify-content: space-between; align-items: center; }
            .suite-name { font-weight: 600; font-size: 0.87rem; color: #e2e8f0; }
            .suite-dur  { font-size: 0.68rem; color: #475569; margin-top: 0.15rem; }
            .status { font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 9999px; font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.04em; }
            .passed  { color: #4ade80; background: #052e16; border: 1px solid #166534; }
            .failed  { color: #f87171; background: #2a0b0b; border: 1px solid #7f1d1d; }
            .running { color: #60a5fa; background: #0c1a3a; border: 1px solid #1e3a8a; animation: pulse 1.4s infinite; }
            .pending { color: #64748b; background: #0f172a; border: 1px solid #1e293b; }
            .logs { background: #000; color: #94a3b8; padding: 0.65rem 0.9rem; border-radius: 6px; font-family: 'Menlo','Consolas',monospace; font-size: 0.68rem; margin-top: 0.5rem; max-height: 150px; overflow-y: auto; white-space: pre-wrap; border: 1px solid #1e293b; }

            /* ── Coverage gaps (collapsible) ── */
            .gap-toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
            .gap-toggle:hover .gap-arrow { color: #e2e8f0; }
            .gap-arrow { color: #475569; font-size: 0.7rem; transition: transform 0.2s; }
            .gap-arrow.open { transform: rotate(90deg); }
            .gap-list { margin-top: 0.4rem; display: none; }
            .gap-list.open { display: block; }
            .gap-card { background: #1a0a0a; border: 1px solid #7f1d1d; border-radius: 7px; padding: 0.5rem 0.9rem; margin-bottom: 0.3rem; color: #fca5a5; font-size: 0.75rem; }

            /* ── Audit panels ── */
            .audit-card { background: #0a0f1e; border-radius: 10px; padding: 0.9rem 1.1rem; margin-bottom: 0.45rem; border: 1px solid #1e293b; font-size: 0.78rem; color: #94a3b8; }
            .audit-row  { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; padding: 0.28rem 0; border-bottom: 1px solid #0f172a; color: #94a3b8; }
            .audit-row:last-child { border-bottom: none; }
            .audit-label { color: #cbd5e1; }
            .audit-val   { color: #e2e8f0; font-weight: 600; }
            .audit-sub   { color: #94a3b8; font-size: 0.72rem; padding-left: 0.75rem; padding-bottom: 0.15rem; }
            .audit-section-title { color: #f87171; font-size: 0.73rem; margin-bottom: 0.2rem; }
            .audit-section-title.warn { color: #fb923c; }
            .pill { padding: 0.1rem 0.5rem; border-radius: 9999px; font-size: 0.63rem; font-weight: 700; }
            .pill-critical { background:#2a0b0b; color:#f87171; border:1px solid #7f1d1d; }
            .pill-warn     { background:#431407; color:#fb923c; border:1px solid #ea580c; }
            .pill-info     { background:#0c1a3a; color:#60a5fa; border:1px solid #1e3a8a; }
            .pill-ok       { background:#052e16; color:#4ade80; border:1px solid #166534; }

            /* ── Terminal/Progress ── */
            .terminal { background: #000; color: #cbd5e1; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem; font-family: 'Menlo', 'Consolas', monospace; font-size: 0.72rem; height: 300px; overflow-y: auto; margin-bottom: 1.5rem; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
            .t-line { margin-bottom: 0.25rem; line-height: 1.4; white-space: pre-wrap; }
            .t-cyan { color: #22d3ee; font-weight: 700; }
            .t-green { color: #4ade80; }
            .t-red { color: #f87171; }
            .t-yellow { color: #fbbf24; }
            .t-gray { color: #64748b; }
            .t-bold { font-weight: 700; }

            @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
          </style>
        </head>
        <body>
          <div class="container">
 
            <!-- Header -->
            <div class="header">
              <div>
                <h1>🩺 Questerix Cortex <small style="font-size: 0.6em; vertical-align: middle; opacity: 0.5;">LIVE</small></h1>
                <div class="subtitle" id="lastRun">Waiting for first run…</div>
              </div>
              <!-- Single-row control bar -->
              <div class="controls">
                <!-- Smoke -->
                <button onclick="trigger('unit')"  class="btn btn-smoke" title="Unit Tests">UNIT</button>
                <button onclick="trigger('e2e')"   class="btn btn-smoke" title="E2E Smoke">E2E</button>
                <button onclick="trigger('lint')"  class="btn btn-smoke" title="Lint Check">LINT</button>
 
                <div class="ctrl-divider"></div>
 
                <!-- Deep -->
                <button onclick="trigger('tsc')"             class="btn btn-deep" title="TypeScript strict">TSC</button>
                <button onclick="trigger('audit')"           class="btn btn-deep" title="npm audit high">AUDIT</button>
                <button onclick="trigger('full-vitest')"     class="btn btn-deep" title="Vitest + Coverage">VITEST</button>
                <button onclick="trigger('full-playwright')" class="btn btn-deep" title="All Playwright">E2E ALL</button>
 
                <div class="ctrl-divider"></div>
 
                <!-- Intel -->
                <button onclick="trigger('drift')"    class="btn btn-intel" title="Schema Drift">DRIFT</button>
                <button onclick="trigger('rls')"      class="btn btn-intel" title="RLS Policy Audit" id="btn-rls">RLS</button>
                <button onclick="trigger('forensic')" class="btn btn-intel" title="Forensic Audit" id="btn-forensic">FORENSIC</button>
 
                <div class="ctrl-divider"></div>
 
                <!-- Release -->
                <button onclick="trigger('build')"   class="btn btn-release" title="Production Build" id="btn-build">BUILD</button>
                <button onclick="trigger('certify')" class="btn btn-release" title="Certify Phase 0" id="btn-certify">CERTIFY</button>
                <button onclick="trigger('hygiene')" class="btn btn-release" title="Code Hygiene" id="btn-hygiene">HYGIENE</button>
 
                <div class="ctrl-divider"></div>

                <!-- Deploy & Ship -->
                <button onclick="trigger('deploy')" class="btn btn-deploy" title="Deploy Admin + Fns" id="btn-deploy">🚀 DEPLOY</button>
                <button onclick="trigger('ship')"   class="btn btn-ship"   title="Git Push to Main"  id="btn-ship">📦 SHIP</button>

                <!-- Primary CTA -->
                <button onclick="trigger('full')" class="btn btn-mega" title="Run everything">⚡ ALL</button>
              </div>
            </div>
 
            <!-- Stats -->
            <div class="stats">
              <div class="stat-card"><div class="stat-val" id="st-score"  style="color:#22d3ee">—</div><div class="stat-lbl">Score</div></div>
              <div class="stat-card"><div class="stat-val" id="st-passed" style="color:#4ade80">—</div><div class="stat-lbl">Passed</div></div>
              <div class="stat-card"><div class="stat-val" id="st-failed" style="color:#f87171">—</div><div class="stat-lbl">Failed</div></div>
              <div class="stat-card"><div class="stat-val" id="st-bundle" style="color:#a78bfa">—</div><div class="stat-lbl">Bundle KB</div></div>
              <div class="stat-card"><div class="stat-val" id="st-drift"  style="font-size:0.9rem">—</div><div class="stat-lbl">Schema Drift</div></div>
              <div class="stat-card"><div class="stat-val" id="st-gate"   style="font-size:0.9rem">—</div><div class="stat-lbl">Smoke Gate</div></div>
            </div>

            <!-- Terminal Progress -->
            <div class="terminal" id="terminal">
              <div class="t-line t-gray">Initializing Questerix Cortex stream...</div>
            </div>
 
            <!-- Main 2-col grid -->
            <div class="main-grid">
              <div class="col" id="col-left"></div>
              <div class="col" id="col-right"></div>
            </div>
 
          </div>
 
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket   = io();
            const allBtns  = document.querySelectorAll('.btn');
            const colLeft  = document.getElementById('col-left');
            const colRight = document.getElementById('col-right');
            const term     = document.getElementById('terminal');
 
            function trigger(t) {
              term.innerHTML = '<div class="t-line t-gray">🔄 Run (' + t + ') starting...</div>';
              socket.emit('trigger', t);
              allBtns.forEach(b => b.disabled = true);
            }

            socket.on('logs', (logs) => {
              term.innerHTML = '';
              logs.forEach(l => {
                const div = document.createElement('div');
                div.className = 't-line' + (l.color ? ' t-' + l.color : '') + (l.bold ? ' t-bold' : '');
                div.textContent = l.text;
                term.appendChild(div);
              });
              term.scrollTop = term.scrollHeight;
            });

            socket.on('log', ({ text, color, bold }) => {
              const div = document.createElement('div');
              div.className = 't-line' + (color ? ' t-' + color : '') + (bold ? ' t-bold' : '');
              div.textContent = text;
              term.appendChild(div);
              term.scrollTop = term.scrollHeight;
            });
 
            function makePill(text, cls) {

            function makePill(text, cls) {
              return '<span class="pill ' + cls + '">' + text + '</span>';
            }

            function buildSh(label, badgeText, badgeCls) {
              const badge = badgeText ? '<span class="sh-badge ' + badgeCls + '">' + badgeText + '</span>' : '';
              return '<div class="sh">' + label + badge + '</div>';
            }

            function auditRow(label, val) {
              return '<div class="audit-row"><span class="audit-label">' + label + '</span><span class="audit-val">' + val + '</span></div>';
            }

            // Toggle gap list open/close
            document.addEventListener('click', function(e) {
              const tog = e.target.closest('.gap-toggle');
              if (!tog) return;
              const list  = tog.nextElementSibling;
              const arrow = tog.querySelector('.gap-arrow');
              if (list)  list.classList.toggle('open');
              if (arrow) arrow.classList.toggle('open');
            });

            socket.on('update', ({ results, surfaceMap, analystResults, history, smokePass, driftResult, rlsResult }) => {
              const allR     = Object.values(results);
              const isRunning = allR.some(r => r.status === 'running');

              // Re-enable buttons when nothing is running
              if (!isRunning) {
                allBtns.forEach(b => b.disabled = false);
                // Smoke gate gating for release buttons
                const gated = smokePass === false;
                ['btn-build','btn-certify','btn-hygiene','btn-deploy','btn-ship'].forEach(id => {
                  const b = document.getElementById(id);
                  if (b) b.disabled = gated;
                });
              }

              document.getElementById('lastRun').textContent = 'Last run: ' + new Date().toLocaleTimeString();

              // ── Sparkline ──
              const sparkEl = document.getElementById('sparkline');
              sparkEl.innerHTML = '';
              (history || []).slice(-10).forEach(h => {
                const bar = document.createElement('div');
                bar.className = 'spark-bar';
                bar.style.height = Math.max(4, h.score * 0.32) + 'px';
                bar.style.background = h.score === 100 ? '#166534' : h.score >= 70 ? '#7c2d12' : '#7f1d1d';
                bar.title = h.score + '/100 — ' + new Date(h.date).toLocaleDateString();
                sparkEl.appendChild(bar);
              });
              for (let i = (history||[]).length; i < 10; i++) {
                const bar = document.createElement('div');
                bar.className = 'spark-bar';
                bar.style.height = '4px';
                bar.style.background = '#1e293b';
                sparkEl.appendChild(bar);
              }

              // ── Stats ──
              const passed = allR.filter(r => r.status === 'passed').length;
              const failed = allR.filter(r => r.status === 'failed').length;
              const score  = allR.length ? Math.round(passed / allR.length * 100) : 0;
              document.getElementById('st-score').textContent  = allR.length ? score + '/100' : '—';
              document.getElementById('st-passed').textContent = allR.length ? passed : '—';
              document.getElementById('st-failed').textContent = allR.length ? failed : '—';
              document.getElementById('st-bundle').textContent = analystResults?.bundleSize ? analystResults.bundleSize + ' KB' : '—';

              // Drift stat
              const driftEl = document.getElementById('st-drift');
              if (driftResult) {
                const isClean = driftResult.verdict === 'CLEAN';
                const isWarn  = driftResult.verdict.startsWith('WARN');
                driftEl.textContent = isClean ? '✅ Clean' : isWarn ? '🟠 Warn' : '🔴 Drift';
                driftEl.style.color = isClean ? '#4ade80' : isWarn ? '#fb923c' : '#f87171';
              }

              // Smoke gate — compute client-side every update
              const smokeIds   = ['unit tests (lib)', 'e2e smoke (desktop)', 'lint check'];
              const smokeR     = allR.filter(r => smokeIds.includes(r.name.toLowerCase()));
              const gatePass   = smokeR.length > 0 && smokeR.every(r => r.status === 'passed');
              const gateEl     = document.getElementById('st-gate');
              if (smokeR.length === 0)   { gateEl.textContent = '—';          gateEl.style.color = '#64748b'; }
              else if (gatePass)         { gateEl.textContent = '✅ Open';    gateEl.style.color = '#4ade80'; }
              else                       { gateEl.textContent = '🔴 Locked';  gateEl.style.color = '#f87171'; }

              // ══════════════════ LEFT COLUMN ══════════════════
              colLeft.innerHTML = '';

              // Coverage gaps — collapsed by default
              const gaps = surfaceMap?.gaps || [];
              if (gaps.length > 0) {
                const preview = gaps.slice(0, 3).map(g => g.replace('Missing test for ','').replace('hooks/','').replace('.ts','')).join(', ');
                colLeft.innerHTML +=
                  '<div class="gap-toggle sh" style="margin-top:0">' +
                    '<span class="gap-arrow">▶</span>' +
                    '🚨 Coverage Gaps' +
                    '<span class="sh-badge badge-err">' + gaps.length + ' found</span>' +
                    '<span style="color:#475569;font-size:0.6rem;margin-left:0.25rem;font-weight:400">' + preview + '…</span>' +
                  '</div>' +
                  '<div class="gap-list" id="gap-list">' +
                    gaps.map(g => '<div class="gap-card">⚠️ ' + g + '</div>').join('') +
                  '</div>';
              }

              // Suite cards
              if (Object.keys(results).length > 0) {
                colLeft.innerHTML += buildSh('Test Suites', null, '');
                Object.entries(results).forEach(([, r]) => {
                  colLeft.innerHTML +=
                    '<div class="card">' +
                      '<div class="card-row">' +
                        '<div>' +
                          '<div class="suite-name">' + r.name + '</div>' +
                          (r.duration ? '<div class="suite-dur">⏱ ' + r.duration.toFixed(1) + 's</div>' : '') +
                        '</div>' +
                        '<span class="status ' + r.status + '">' + r.status + '</span>' +
                      '</div>' +
                      (r.status === 'failed' ? '<div class="logs">' + (r.output||'').slice(-600) + '</div>' : '') +
                    '</div>';
                });
              }

              // ══════════════════ RIGHT COLUMN ══════════════════
              colRight.innerHTML = '';

              // ── Schema Drift ──
              if (driftResult) {
                const driftBadge = driftResult.verdict === 'CLEAN' ? 'badge-ok'
                  : driftResult.verdict.startsWith('WARN') ? 'badge-warn' : 'badge-err';
                colRight.innerHTML += buildSh('🔍 Schema Drift', driftResult.verdict, driftBadge);
                colRight.innerHTML += '<div class="audit-card">';
                colRight.innerHTML += auditRow('Types file tables', driftResult.typesTableCount);
                colRight.innerHTML += auditRow('Types last updated', driftResult.staleDays != null ? driftResult.staleDays + 'd ago' : '—');

                if (driftResult.missingFromTypes.length > 0) {
                  colRight.innerHTML += '<div class="audit-row" style="flex-direction:column;align-items:flex-start">';
                  colRight.innerHTML += '<div class="audit-section-title">Missing from types (' + driftResult.missingFromTypes.length + '):</div>';
                  driftResult.missingFromTypes.forEach(t => {
                    colRight.innerHTML += '<div class="audit-sub">• ' + t + '</div>';
                  });
                  colRight.innerHTML += '</div>';
                }

                if (driftResult.extraInTypes.length > 0) {
                  colRight.innerHTML += '<div class="audit-row" style="flex-direction:column;align-items:flex-start">';
                  colRight.innerHTML += '<div class="audit-section-title warn">In types, no migration (' + driftResult.extraInTypes.length + '):</div>';
                  driftResult.extraInTypes.slice(0, 6).forEach(t => {
                    colRight.innerHTML += '<div class="audit-sub">• ' + t + '</div>';
                  });
                  if (driftResult.extraInTypes.length > 6) {
                    colRight.innerHTML += '<div class="audit-sub" style="color:#64748b">… and ' + (driftResult.extraInTypes.length - 6) + ' more</div>';
                  }
                  colRight.innerHTML += '</div>';
                }

                if (driftResult.verdict === 'CLEAN') {
                  colRight.innerHTML += auditRow('Status', '<span style="color:#4ade80">✅ No drift detected</span>');
                }
                colRight.innerHTML += '</div>';
              } else {
                colRight.innerHTML += buildSh('🔍 Schema Drift', 'Not run', 'badge-info');
                colRight.innerHTML += '<div class="audit-card">Click <strong style="color:#e2e8f0">DRIFT</strong> to run schema drift detection.</div>';
              }

              // ── RLS Audit ──
              if (rlsResult) {
                const rlsBadge = rlsResult.verdict === 'PASS' ? 'badge-ok'
                  : rlsResult.verdict === 'ERROR' ? 'badge-warn' : 'badge-err';
                colRight.innerHTML += buildSh('🔒 RLS Policy Audit', rlsResult.verdict, rlsBadge);
                colRight.innerHTML += '<div class="audit-card">';

                if (rlsResult.verdict === 'ERROR') {
                  colRight.innerHTML += '<div style="color:#fb923c;font-size:0.75rem;line-height:1.5">' + (rlsResult.raw || 'psql unavailable or DATABASE_URL not set. Showing static policy scan from migrations.') + '</div>';
                } else if (rlsResult.rows.length === 0) {
                  colRight.innerHTML += '<div style="color:#4ade80">✅ No RLS gaps found.</div>';
                } else {
                  rlsResult.rows.forEach(row => {
                    const pillCls = row.severity === 'critical' ? 'pill-critical'
                      : row.severity === 'warning' ? 'pill-warn' : 'pill-info';
                    colRight.innerHTML +=
                      '<div class="audit-row">' +
                        '<span style="color:#cbd5e1;font-size:0.75rem">' + row.tablename +
                          ' <span style="color:#475569">(' + row.missing_policies + ')</span></span>' +
                        makePill(row.verdict.split(' ').slice(0,2).join(' '), pillCls) +
                      '</div>';
                  });
                }
                colRight.innerHTML += '</div>';
              } else {
                colRight.innerHTML += buildSh('🔒 RLS Audit', 'Not run', 'badge-info');
                colRight.innerHTML += '<div class="audit-card">Click <strong style="color:#e2e8f0">RLS</strong> to run the policy audit.<br><span style="color:#64748b;font-size:0.72rem">Requires DATABASE_URL in admin-panel/.env.local</span></div>';
              }

              // ── Bundle ──
              if (analystResults?.bundleSize) {
                colRight.innerHTML += buildSh('📦 Bundle', null, '');
                colRight.innerHTML += '<div class="audit-card">' + auditRow('dist/ size', '<span style="color:#a78bfa;font-weight:700">' + analystResults.bundleSize + ' KB</span>') + '</div>';
              }

            });
          </script>
        </body>
        </html>
      `);
      });
    }

    this.io.on('connection', (socket) => {
      // Send current state and historical logs to new connection
      socket.emit('logs', this.logs);
      
      socket.on('trigger', (target: string) => {
        if (this.onTriggerCallback) this.onTriggerCallback(target);
      });
    });

    server.listen(port, () => {
      console.log(`\n📊 Dashboard live at http://localhost:${port}`);
    });
  }

  log(text: string, color?: 'cyan' | 'green' | 'red' | 'gray' | 'yellow', bold: boolean = false) {
    const logItem = { text, color, bold };
    this.logs.push(logItem);
    if (this.logs.length > 100) this.logs.shift(); // Keep last 100 lines
    this.io.emit('log', logItem);
  }

  onTrigger(callback: (target: string) => void) {
    this.onTriggerCallback = callback;
  }

  update(
    results: Record<string, TaskResult>,
    surfaceMap?: SurfaceMap,
    analystResults?: AnalystResults,
    history?: HistoryRecord[],
    smokePass?: boolean,
    driftResult?: DriftResult,
    rlsResult?: RlsAuditResult
  ) {
    this.io.emit('update', { 
      results, 
      surfaceMap, 
      analystResults, 
      history, 
      smokePass, 
      driftResult, 
      rlsResult,
      logs: this.logs
    });
  }
}
