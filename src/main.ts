import p5 from 'p5';
import { BlobAgentData, BlobSprite, STATUS_CFG, HandoffPacket } from './blob/BlobModel';
import { BlobRenderer } from './blob/BlobRenderer';
import { BlobSimulator } from './blob/BlobSimulator';
import { BlobWebSocketClient } from './blob/BlobWebSocketClient';

class BlobOfficeApp {
  private p5Instance!: p5;
  private renderer!: BlobRenderer;
  private agents: Record<string, BlobAgentData> = {};
  private simulator!: BlobSimulator;
  private wsClient!: BlobWebSocketClient;

  private wsDot!: HTMLElement;
  private wsLabel!: HTMLElement;
  private agentCountEl!: HTMLElement;
  private noAgentsEl!: HTMLElement;
  private controlPanelEl?: HTMLElement;

  private activeHandoffs: HandoffPacket[] = [];
  private agentPositionsMap: Record<string, { x: number; y: number; color: number }> = {};

  public getP5(): p5 {
    return this.p5Instance;
  }

  public triggerHandoff(
    fromId: string,
    toId: string,
    label: string,
    senderMsg?: string,
    receiverMsg?: string
  ): void {
    this.activeHandoffs.push({
      fromId,
      toId,
      label,
      startTime: Date.now(),
      duration: 3500,
      senderMessage: senderMsg,
      receiverMessage: receiverMsg,
    });

    if (senderMsg && this.simulator) {
      this.simulator.triggerAction(fromId, 'editing', senderMsg);
    }
    setTimeout(() => {
      if (receiverMsg && this.simulator) {
        this.simulator.triggerAction(toId, 'running', receiverMsg);
      }
    }, 1200);
  }

  public init(): void {
    this.wsDot = document.getElementById('ws-dot')!;
    this.wsLabel = document.getElementById('ws-label')!;
    this.agentCountEl = document.getElementById('agent-count')!;
    this.noAgentsEl = document.getElementById('no-agents')!;

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const isEmbedded = typeof window !== 'undefined' && (window.self !== window.top || urlParams.get('hideControl') === 'true');

    if (!isEmbedded) {
      this.renderControlPanel();
    }

    // 1. Setup Simulator
    this.simulator = new BlobSimulator((agentsList) => {
      this.updateAgentSnapshot(agentsList);
    });

    // 2. Setup WebSocket Client with auto-discovery and handoff support
    const customWs = urlParams.get('ws') || undefined;
    this.wsClient = new BlobWebSocketClient(
      customWs,
      (agentsList) => {
        this.updateAgentSnapshot(agentsList);
      },
      (status) => {
        if (status === 'connected') {
          this.wsDot.className = 'dot connected';
          this.wsLabel.textContent = 'live sync (connected)';
        } else if (status === 'reconnecting') {
          this.wsDot.className = 'dot';
          this.wsLabel.textContent = 'simulator mode (standby)';
        }
      },
      {
        onHandoff: (h) => {
          this.triggerHandoff(h.from_agent, h.to_agent, h.payload_label, h.sender_message, h.receiver_message);
        },
        onAgentStateChange: (agentId, state, msg) => {
          const mapState: Record<string, any> = {
            EXECUTING: 'running',
            TOOL_CALL: 'editing',
            THINKING: 'thinking',
            READING: 'reading',
            ERROR: 'error',
            WAITING: 'waiting',
            PENDING: 'waiting',
            IDLE: 'idle',
            READY: 'idle',
          };
          const mapped = mapState[state] || 'idle';
          this.simulator.triggerAction(agentId, mapped, msg);
        },
      }
    );

    this.wsClient.connect();
    this.simulator.start();

    // Expose for embedding & test access
    if (typeof window !== 'undefined') {
      (window as any).__blobOffice = this;
    }

    // 3. Initialize p5.js Sketch
    this.p5Instance = new p5((p: p5) => {
      p.setup = () => {
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight - 28);
        cnv.position(0, 0);
        cnv.style('z-index', '1');
        p.pixelDensity(window.devicePixelRatio || 1);
        p.textFont('monospace');
        this.renderer = new BlobRenderer(p);
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight - 28);
      };

      p.draw = () => {
        this.renderScene(p);
      };
    });
  }

  private updateAgentSnapshot(agentsList: BlobAgentData[]): void {
    const next: Record<string, BlobAgentData> = {};
    for (const a of agentsList) {
      next[a.id] = { ...a };
    }

    for (const id in this.agents) {
      if (next[id] && this.agents[id]._sprite) {
        next[id]._sprite = this.agents[id]._sprite;
        next[id]._sprite!.hue = next[id].color;
      }
    }

    this.agents = next;

    const all = Object.values(this.agents);
    const mainCount = all.filter((a) => !a.parentID).length;
    const subCount = all.filter((a) => a.parentID).length;

    let countText = mainCount === 0 ? '' : `${mainCount} agent${mainCount !== 1 ? 's' : ''}`;
    if (subCount > 0) {
      countText += ` + ${subCount} subagent${subCount !== 1 ? 's' : ''}`;
    }
    this.agentCountEl.textContent = countText;
    this.noAgentsEl.classList.toggle('hidden', all.length > 0);
  }

  private renderScene(p: p5): void {
    this.renderer.drawFloor();
    const now = p.millis() / 1000;
    const all = Object.values(this.agents);
    const mainAgents = all.filter((a) => !a.parentID);
    const subAgents = all.filter((a) => a.parentID);

    // Render Main Blobs
    for (const agent of mainAgents) {
      const [targetX, targetY] = this.renderer.getAgentPosition(agent.id, p.width, p.height);
      const scale = agent.activityScale || 1.0;
      const widthBias = 1.2;

      if (!agent._sprite) {
        agent._sprite = new BlobSprite(targetX, targetY - 20, agent.color);
        const cfg = STATUS_CFG[agent.status] || STATUS_CFG.idle;
        agent._sprite.currentStatus = agent.status;
        agent._sprite.targetStatus = agent.status;
        agent._sprite.currentPulse = cfg.pulse;
        agent._sprite.currentRadius = cfg.radius;
        agent._sprite.currentAlpha = cfg.opacity;
        agent._sprite.targetPulse = cfg.pulse;
        agent._sprite.targetRadius = cfg.radius;
        agent._sprite.targetAlpha = cfg.opacity;
      }
      const sprite = agent._sprite;

      this.renderer.updateStatusTransition(sprite, agent.status);
      this.renderer.updateWander(sprite);
      this.renderer.updateBlinking(sprite);

      sprite.tx = targetX + sprite.wanderOffset.x;
      sprite.ty = targetY - 20 + sprite.wanderOffset.y;

      const stiffness = 0.03;
      const damping = 0.85;
      const dxPos = sprite.tx - sprite.x;
      const dyPos = sprite.ty - sprite.y;
      sprite.vx = sprite.vx * damping + dxPos * stiffness;
      sprite.vy = sprite.vy * damping + dyPos * stiffness;
      sprite.x += sprite.vx;
      sprite.y += sprite.vy;

      const pulse = Math.sin(now * sprite.currentPulse * Math.PI * 2 + sprite.phase);
      const radius = sprite.currentRadius + pulse * 3;
      const alpha = sprite.currentAlpha;

      const isError = agent.status === 'error';
      const isWaiting = agent.status === 'waiting';
      const shakeX = isWaiting ? Math.sin(now * 6) * 1.5 : 0;
      const shakeY = isWaiting ? Math.cos(now * 5) * 1.0 : 0;
      const vibrateX = isError ? Math.sin(now * 12) * 1.0 : 0;

      const drawX = sprite.x + shakeX + vibrateX;
      const drawY = sprite.y + shakeY;

      // Glow rings
      const cfg = STATUS_CFG[agent.status] || STATUS_CFG.idle;
      if (cfg.ring) {
        p.noFill();
        p.strokeWeight(2);
        let ringPulse = now * 2.5;
        if (agent.status === 'thinking') ringPulse = now * 1.0;
        if (agent.status === 'editing') ringPulse = now * 2.0;
        if (agent.status === 'waiting') ringPulse = now * 2.0;

        const glowAlpha = (0.3 + 0.2 * Math.sin(ringPulse + sprite.phase)) * alpha;
        p.stroke(p.color(`hsla(${agent.color}, 80%, 65%, ${glowAlpha / 255})`));
        p.ellipse(drawX, drawY, (radius + 10) * 2, (radius + 10) * 2);
        p.strokeWeight(1);
        p.stroke(p.color(`hsla(${agent.color}, 60%, 80%, ${(glowAlpha * 0.5) / 255})`));
        p.ellipse(drawX, drawY, (radius + 18) * 2, (radius + 18) * 2);
      }

      // Bobbing
      let bobAmp = 2;
      if (agent.status === 'editing') bobAmp = 1;
      else if (agent.status === 'running') bobAmp = 4;
      const bobY = Math.sin(now * sprite.currentBobSpeed + sprite.phase) * bobAmp;

      // Drop shadow
      p.noStroke();
      p.fill(0, 0, 0, 60);
      p.ellipse(drawX + 2 + sprite.wanderOffset.x * 0.3, drawY + radius * 0.8 + 4, radius * 1.6 * scale * widthBias, radius * 0.5 * scale);

      // Gradient body simulation
      const bodyHue = isError ? (agent.color + 20) % 360 : agent.color;
      p.fill(p.color(`hsla(${bodyHue}, 70%, 35%, ${(alpha * 0.6) / 255})`));
      p.ellipse(drawX, drawY + bobY, radius * 2 * scale * widthBias, radius * 2 * scale);
      p.fill(p.color(`hsla(${bodyHue}, 80%, 60%, ${alpha / 255})`));
      p.ellipse(drawX - radius * 0.1, drawY + bobY - radius * 0.05, radius * 1.7 * scale * widthBias, radius * 1.7 * scale);

      if (isError) {
        p.fill(255, 80, 80, alpha * 0.15 * (0.5 + 0.5 * Math.sin(now * 5)));
        p.ellipse(drawX, drawY + bobY, radius * 2.2 * scale * widthBias, radius * 2.2 * scale);
      }

      // Highlight
      p.fill(p.color(`hsla(${bodyHue}, 60%, 90%, ${(alpha * 0.35) / 255})`));
      p.ellipse(drawX - radius * 0.25 * scale * widthBias, drawY + bobY - radius * 0.3, radius * 0.8 * scale * widthBias, radius * 0.6 * scale);

      // Eyes & Visor
      const eyeY = drawY + bobY - radius * 0.1;
      const eyeScaleX = scale * widthBias;
      const eyeScaleY = scale;

      if (sprite.isBlinking) {
        p.stroke(10, 10, 30, alpha);
        p.strokeWeight(2);
        const eyeSpacing = radius * 0.35 * eyeScaleX;
        p.line(drawX - eyeSpacing, eyeY, drawX - eyeSpacing * 0.3, eyeY);
        p.line(drawX + eyeSpacing * 0.3, eyeY, drawX + eyeSpacing, eyeY);
        p.noStroke();
      } else {
        p.fill(255, 255, 255, alpha * 0.9);
        const eyeW = 5 * eyeScaleX;
        const eyeH = 6 * eyeScaleY;
        const eyeOff = radius * 0.22 * eyeScaleX;
        p.ellipse(drawX - eyeOff, eyeY, eyeW, eyeH);
        p.ellipse(drawX + eyeOff, eyeY, eyeW, eyeH);

        let pupilShift = 0;
        let pupilV = 1;
        if (agent.status === 'thinking') pupilShift = Math.sin(now * 3) * 1.5 * eyeScaleX;
        else if (agent.status === 'reading') pupilShift = Math.sin(now * 0.5) * 0.5 * eyeScaleX;
        else if (agent.status === 'running') pupilShift = Math.sin(now * 10) * 1 * eyeScaleX;
        else if (agent.status === 'waiting') pupilShift = Math.sin(now * 2) * 1 * eyeScaleX;

        p.fill(10, 10, 30, alpha);
        p.ellipse(drawX - eyeOff + pupilShift, eyeY + pupilV, 2.5 * eyeScaleX, 3 * eyeScaleY);
        p.ellipse(drawX + eyeOff + pupilShift, eyeY + pupilV, 2.5 * eyeScaleX, 3 * eyeScaleY);

        if (isError) {
          p.stroke(10, 10, 30, alpha);
          p.strokeWeight(1.5);
          const ex1 = drawX - eyeOff;
          const ex2 = drawX + eyeOff;
          const es = 2.5 * eyeScaleX;
          p.line(ex1 - es, eyeY - 1 - es, ex1 + es, eyeY - 1 + es);
          p.line(ex1 - es, eyeY - 1 + es, ex1 + es, eyeY - 1 - es);
          p.line(ex2 - es, eyeY - 1 - es, ex2 + es, eyeY - 1 + es);
          p.line(ex2 - es, eyeY - 1 + es, ex2 + es, eyeY - 1 - es);
          p.noStroke();
        }
      }

      // Fiddling tools / Code typewriter panel / Books
      if (sprite.previousStatus === 'editing' && agent.status !== 'editing' && !sprite.editPanelClosing) {
        sprite.editPanelClosing = true;
        sprite.editPanelCloseStart = now;
      }
      sprite.previousStatus = agent.status;
      this.renderer.drawFiddlingObject(sprite, agent.status, sprite.currentRadius, now, alpha);

      // Speech bubble
      this.renderer.drawSpeechBubble(drawX, drawY + bobY, agent.message, agent.color, alpha, false);

      // Name tag with folder & title
      this.renderer.drawNameTag(drawX, drawY, agent.folder, agent.title, agent.color, agent.status);
      this.agentPositionsMap[agent.id] = { x: drawX, y: drawY + bobY, color: agent.color };
    }

    // Render Subagents Orbiting
    for (const sub of subAgents) {
      const parent = this.agents[sub.parentID!];
      if (!parent || !parent._sprite) continue;

      const parentSprite = parent._sprite;
      const orbitCenterX = parentSprite.x + parentSprite.wanderOffset.x;
      const orbitCenterY = parentSprite.y + parentSprite.wanderOffset.y;
      const subHue = (parent.color + 30) % 360;

      if (!sub._sprite) {
        sub._sprite = new BlobSprite(parentSprite.x, parentSprite.y, subHue, true);
        const cfg = STATUS_CFG[sub.status] || STATUS_CFG.idle;
        sub._sprite.currentStatus = sub.status;
        sub._sprite.targetStatus = sub.status;
        sub._sprite.currentPulse = cfg.pulse;
        sub._sprite.currentRadius = cfg.radius * 0.6;
        sub._sprite.currentAlpha = cfg.opacity;
        sub._sprite.targetPulse = cfg.pulse;
        sub._sprite.targetRadius = cfg.radius * 0.6;
        sub._sprite.targetAlpha = cfg.opacity;
      }
      const sprite = sub._sprite;
      sprite.isSubagent = true;

      this.renderer.updateStatusTransition(sprite, sub.status);
      this.renderer.updateBlinking(sprite);

      sprite.orbitAngle += sprite.orbitSpeed * 0.5 * (1 / 60);
      const orbitOffsetX = Math.cos(sprite.orbitAngle) * sprite.orbitRadius;
      const orbitOffsetY = Math.sin(sprite.orbitAngle * 0.7) * sprite.orbitRadius * 0.4 + 15;

      const pulse = Math.sin(now * sprite.currentPulse + sprite.phase);
      const radius = sprite.currentRadius + pulse * 2;
      const alpha = sprite.currentAlpha;

      sprite.x = orbitCenterX + orbitOffsetX;
      sprite.y = orbitCenterY + orbitOffsetY;

      // Orbit connector trail line
      p.stroke(p.color(`hsla(${subHue}, 50%, 50%, ${alpha * 0.15 / 255})`));
      p.strokeWeight(1);
      p.line(orbitCenterX, orbitCenterY, sprite.x, sprite.y);

      // Subagent body
      p.noStroke();
      p.fill(0, 0, 0, 40);
      p.ellipse(sprite.x, sprite.y + radius * 0.8 + 2, radius * 1.5, radius * 0.4);

      p.fill(p.color(`hsla(${subHue}, 70%, 35%, ${alpha * 0.6 / 255})`));
      p.ellipse(sprite.x, sprite.y, radius * 2, radius * 2);
      p.fill(p.color(`hsla(${subHue}, 80%, 60%, ${alpha / 255})`));
      p.ellipse(sprite.x - radius * 0.1, sprite.y - radius * 0.05, radius * 1.7, radius * 1.7);

      // Subagent eyes
      p.fill(255, 255, 255, alpha * 0.9);
      p.ellipse(sprite.x - radius * 0.3, sprite.y - 1, 3, 4);
      p.ellipse(sprite.x + radius * 0.3, sprite.y - 1, 3, 4);
      p.fill(10, 10, 30, alpha);
      p.ellipse(sprite.x - radius * 0.3, sprite.y, 1.5, 2);
      p.ellipse(sprite.x + radius * 0.3, sprite.y, 1.5, 2);

      // Speech bubble subagent
      this.renderer.drawSpeechBubble(sprite.x, sprite.y, sub.message, subHue, alpha, true);
    }

    // Render Curved Pipeline Handoff Laser Beams & Travelling Packets
    this.activeHandoffs = this.renderer.drawHandoffBeams(p, this.activeHandoffs, this.agentPositionsMap);
  }

  private renderControlPanel(): void {
    this.controlPanelEl = document.createElement('div');
    this.controlPanelEl.className = 'blob-control-panel';
    this.controlPanelEl.innerHTML = `
      <div class="panel-header">BLOB CONTROLLER</div>
      <div class="panel-row">
        <label>TARGET:</label>
        <select id="select-agent">
          <option value="agent-core-session">frontend-core</option>
          <option value="agent-backend-session">api-gateway</option>
          <option value="agent-db-session">vector-store</option>
          <option value="agent-qa-session">e2e-runner</option>
        </select>
      </div>
      <div class="panel-buttons">
        <button data-act="thinking">🧠 THINK</button>
        <button data-act="editing">✏️ EDIT</button>
        <button data-act="running">💻 RUN</button>
        <button data-act="reading">📖 READ</button>
        <button data-act="waiting">⚠️ WAIT</button>
        <button data-act="error">❌ ERROR</button>
        <button data-act="idle">💤 IDLE</button>
      </div>
      <div class="panel-subagent">
        <button id="btn-toggle-sub">⚡ TOGGLE ORBIT SUBAGENT</button>
      </div>
    `;

    document.body.appendChild(this.controlPanelEl);

    const sel = this.controlPanelEl.querySelector('#select-agent') as HTMLSelectElement;

    this.controlPanelEl.querySelectorAll('.panel-buttons button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const act = (e.currentTarget as HTMLElement).dataset.act as any;
        this.simulator.triggerAction(sel.value, act, `Manual state: ${act}`);
      });
    });

    this.controlPanelEl.querySelector('#btn-toggle-sub')?.addEventListener('click', () => {
      this.simulator.toggleSubagent(sel.value);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new BlobOfficeApp();
  app.init();
});
