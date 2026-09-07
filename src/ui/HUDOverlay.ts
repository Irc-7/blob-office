import { RobotAgent, AgentState } from '../entities/RobotAgent';

export class HUDOverlay {
  private container: HTMLElement;
  private topBar: HTMLElement;
  private leftPanel: HTMLElement;
  private rightPanel: HTMLElement;
  private activeAgentsCount: HTMLElement;
  private statusOrb: HTMLElement;

  private totalTokens: number = 2480;
  private avgLatency: number = 88;
  private errorCount: number = 0;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'hud-container';

    // 1. Top Bar
    this.topBar = document.createElement('div');
    this.topBar.className = 'hud-panel hud-topbar';
    this.topBar.innerHTML = `
      <div class="hud-brand">
        <span class="hud-logo-icon">⚙</span>
        <span class="hud-title">ROBO-OFFICE</span>
        <span class="hud-version">v1.0.0</span>
      </div>
      <div class="hud-top-metrics">
        <span class="hud-tag">SPATIAL VISUALISER</span>
        <div class="hud-status-badge">
          <span class="status-orb green" id="global-status-orb"></span>
          <span id="active-agents-text">5 Active Bots</span>
        </div>
      </div>
    `;

    // 2. Left Panel: Agent Roster
    this.leftPanel = document.createElement('div');
    this.leftPanel.className = 'hud-panel hud-leftpanel';
    this.leftPanel.innerHTML = `
      <div class="hud-panel-title">AGENT ROSTER</div>
      <div class="hud-agent-list" id="hud-agent-list"></div>
    `;

    // 3. Right Panel: Live Performance Telemetry
    this.rightPanel = document.createElement('div');
    this.rightPanel.className = 'hud-panel hud-rightpanel';
    this.rightPanel.innerHTML = `
      <div class="hud-panel-title">LIVE TELEMETRY</div>
      <div class="metric-row">
        <span class="metric-lbl">TOTAL TOKENS:</span>
        <span class="metric-val" id="metric-tokens">2,480</span>
      </div>
      <div class="metric-row">
        <span class="metric-lbl">AVG LATENCY:</span>
        <span class="metric-val" id="metric-latency">88 ms</span>
      </div>
      <div class="metric-row">
        <span class="metric-lbl">HEALTH:</span>
        <span class="metric-val text-green" id="metric-health">OPTIMAL</span>
      </div>
      <div class="sparkline-box">
        <canvas id="sparkline-canvas" width="120" height="30"></canvas>
      </div>
    `;

    this.container.appendChild(this.topBar);
    this.container.appendChild(this.leftPanel);
    this.container.appendChild(this.rightPanel);
    parent.appendChild(this.container);

    this.activeAgentsCount = this.container.querySelector('#active-agents-text')!;
    this.statusOrb = this.container.querySelector('#global-status-orb')!;
  }

  public updateAgents(agents: RobotAgent[]): void {
    const listEl = this.leftPanel.querySelector('#hud-agent-list');
    if (!listEl) return;

    let html = '';
    let activeCount = 0;
    let hasError = false;

    for (const ag of agents) {
      if (ag.state !== AgentState.OFFLINE) activeCount++;
      if (ag.state === AgentState.ERROR) hasError = true;

      const stateBadgeClass = this.getStateClass(ag.state);

      html += `
        <div class="agent-card">
          <div class="agent-card-header">
            <span class="agent-role role-${ag.role}">[${ag.role.toUpperCase()}]</span>
            <span class="agent-state-badge ${stateBadgeClass}">${ag.state}</span>
          </div>
          <div class="agent-task">${ag.currentTask}</div>
        </div>
      `;
    }

    listEl.innerHTML = html;
    this.activeAgentsCount.textContent = `${activeCount} Active Bots`;

    if (hasError) {
      this.statusOrb.className = 'status-orb red';
    } else {
      this.statusOrb.className = 'status-orb green';
    }
  }

  public recordMetrics(tokens: number = 0, latency: number = 0, isError: boolean = false): void {
    this.totalTokens += tokens;
    if (latency > 0) {
      this.avgLatency = Math.floor((this.avgLatency * 4 + latency) / 5);
    }
    if (isError) {
      this.errorCount++;
    }

    const tokEl = this.rightPanel.querySelector('#metric-tokens');
    const latEl = this.rightPanel.querySelector('#metric-latency');
    const healthEl = this.rightPanel.querySelector('#metric-health');

    if (tokEl) tokEl.textContent = this.totalTokens.toLocaleString();
    if (latEl) latEl.textContent = `${this.avgLatency} ms`;
    if (healthEl) {
      if (this.errorCount > 0) {
        healthEl.textContent = 'DEGRADED';
        healthEl.className = 'metric-val text-red';
      } else {
        healthEl.textContent = 'OPTIMAL';
        healthEl.className = 'metric-val text-green';
      }
    }

    this.drawSparkline();
  }

  private drawSparkline(): void {
    const canvas = this.rightPanel.querySelector('#sparkline-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const points = [15, 18, 12, 22, 16, 25, 20, 14, 23, 19, 24];
    const step = canvas.width / (points.length - 1);

    for (let i = 0; i < points.length; i++) {
      const x = i * step;
      const y = canvas.height - points[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  private getStateClass(state: AgentState): string {
    switch (state) {
      case AgentState.WORKING:
        return 'state-working';
      case AgentState.RESEARCHING:
        return 'state-researching';
      case AgentState.SUCCESS:
        return 'state-success';
      case AgentState.ERROR:
        return 'state-error';
      case AgentState.IDLE:
        return 'state-idle';
      case AgentState.WALKING:
        return 'state-walking';
      default:
        return 'state-offline';
    }
  }
}
