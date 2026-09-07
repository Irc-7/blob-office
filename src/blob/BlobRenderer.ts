import p5 from 'p5';
import {
  BlobAgentData,
  BlobSprite,
  STATUS_CFG,
  ONE_DARK,
  CODE_SNIPPETS,
  easeInOutCubic,
} from './BlobModel';

export class BlobRenderer {
  private p: p5;
  private agentPositions: Record<string, number> = {};
  private positionAssignments: string[] = [];
  private positionSlotTTL: Map<string, number> = new Map();

  constructor(p: p5) {
    this.p = p;
  }

  public drawFloor(): void {
    const p = this.p;
    p.background(15, 15, 25);
    p.stroke(22, 22, 38);
    p.strokeWeight(1);
    const gridSize = 48;
    for (let x = 0; x < p.width; x += gridSize) {
      p.line(x, 0, x, p.height);
    }
    for (let y = 0; y < p.height - 30; y += gridSize) {
      p.line(0, y, p.width, y);
    }
  }

  public calculateRadialPos(agentIndex: number, totalAgents: number, W: number, H: number): [number, number] {
    const centerX = W / 2;
    const centerY = (H - 30) / 2;
    const minRadius = 80;
    const radiusPerAgent = 45;
    const maxRadius = Math.min(W, H - 30) / 2 - 60;
    const radius = Math.min(minRadius + totalAgents * radiusPerAgent, maxRadius);
    const angleStep = (Math.PI * 2) / Math.max(totalAgents, 1);
    const angle = agentIndex * angleStep;

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius * 0.7; // elliptical perspective
    return [x, y];
  }

  public getAgentPosition(id: string, W: number, H: number): [number, number] {
    const now = Date.now();
    for (const [agentId, expiry] of this.positionSlotTTL) {
      if (expiry < now && !this.positionAssignments.includes(agentId)) {
        this.positionSlotTTL.delete(agentId);
      }
    }

    if (!(id in this.agentPositions)) {
      if (this.positionSlotTTL.has(id)) {
        const originalIndex = this.positionAssignments.indexOf(id);
        if (originalIndex !== -1) {
          this.agentPositions[id] = originalIndex;
        } else {
          this.agentPositions[id] = this.positionAssignments.length;
          this.positionAssignments.push(id);
        }
      } else {
        this.agentPositions[id] = this.positionAssignments.length;
        this.positionAssignments.push(id);
      }
    }

    const index = this.agentPositions[id];
    const totalAgents = this.positionAssignments.length;
    return this.calculateRadialPos(index, totalAgents, W, H);
  }

  public removeAgentPosition(id: string): void {
    if (id in this.agentPositions) {
      this.positionSlotTTL.set(id, Date.now() + 3000);
      delete this.agentPositions[id];
    }
  }

  public updateStatusTransition(sp: BlobSprite, newStatus: BlobAgentData['status'], dt: number = 1 / 60): void {
    const cfg = STATUS_CFG[newStatus] || STATUS_CFG.idle;
    if (sp.targetStatus !== newStatus) {
      sp.currentStatus = sp.targetStatus;
      sp.targetStatus = newStatus;
      sp.targetPulse = cfg.pulse;
      sp.targetRadius = sp.isSubagent ? cfg.radius * 0.6 : cfg.radius;
      sp.targetAlpha = cfg.opacity;
      if (newStatus === 'idle') sp.targetBobSpeed = 0.8;
      else if (newStatus === 'editing') sp.targetBobSpeed = 1.5;
      else if (newStatus === 'running') sp.targetBobSpeed = 5;
      else sp.targetBobSpeed = 2;
    }

    const lerpFactor = easeInOutCubic(dt * 3);
    sp.currentPulse += (sp.targetPulse - sp.currentPulse) * lerpFactor;
    sp.currentRadius += (sp.targetRadius - sp.currentRadius) * lerpFactor;
    sp.currentAlpha += (sp.targetAlpha - sp.currentAlpha) * lerpFactor;
    sp.currentBobSpeed += (sp.targetBobSpeed - sp.currentBobSpeed) * lerpFactor;
  }

  public updateWander(sp: BlobSprite): void {
    sp.wanderTimer -= 1 / 60;
    if (sp.wanderTimer <= 0) {
      sp.wanderTimer = 3 + Math.random() * 5;
      sp.wanderTarget.x = (Math.random() - 0.5) * 60;
      sp.wanderTarget.y = (Math.random() - 0.5) * 30;
    }
    sp.wanderOffset.x += (sp.wanderTarget.x - sp.wanderOffset.x) * 0.02;
    sp.wanderOffset.y += (sp.wanderTarget.y - sp.wanderOffset.y) * 0.02;
  }

  public updateBlinking(sp: BlobSprite): void {
    sp.blinkTimer -= 1 / 60;
    if (sp.blinkTimer <= 0) {
      sp.isBlinking = true;
      sp.blinkTimer = 0.1;
    }
    if (sp.isBlinking && sp.blinkTimer <= 0) {
      sp.isBlinking = false;
      sp.blinkTimer = 2 + Math.random() * 4;
    }
  }

  public drawCodePanel(sp: BlobSprite, r: number, now: number, alpha: number): void {
    const p = this.p;
    if (sp.editPanelShowTime === null) {
      sp.editPanelShowTime = now;
    }

    const panelShowDuration = now - sp.editPanelShowTime;
    const minShowTime = 1.0;
    const panelAnimDuration = 2.5;
    const cycleTime = now % panelAnimDuration;

    let panelAlpha = alpha;
    let drawPanel = true;
    let phase = 'showCode';
    let phaseProgress = 0.5;

    if (sp.editPanelClosing) {
      const closeElapsed = now - sp.editPanelCloseStart;
      const closeDuration = 0.5;
      if (closeElapsed >= closeDuration) {
        sp.editPanelClosing = false;
        sp.editPanelShowTime = null;
        drawPanel = false;
      } else {
        phase = 'pixelate';
        phaseProgress = Math.min(closeElapsed / closeDuration, 1);
        panelAlpha = alpha * (1 - phaseProgress);
      }
    } else {
      if (panelShowDuration < minShowTime) {
        if (cycleTime < 0.4) {
          phase = 'slideOut';
          phaseProgress = Math.min(cycleTime / 0.4, 1);
          panelAlpha = alpha * phaseProgress;
        } else if (cycleTime < 0.6) {
          phase = 'expand';
          phaseProgress = Math.min((cycleTime - 0.4) / 0.2, 1);
          panelAlpha = alpha;
        } else {
          phase = 'showCode';
          phaseProgress = 1;
          panelAlpha = alpha;
        }
      } else {
        if (cycleTime < 0.4) {
          phase = 'slideOut';
          phaseProgress = Math.min(cycleTime / 0.4, 1);
          panelAlpha = alpha * phaseProgress;
        } else if (cycleTime < 0.6) {
          phase = 'expand';
          phaseProgress = Math.min((cycleTime - 0.4) / 0.2, 1);
          panelAlpha = alpha;
        } else {
          phase = 'showCode';
          phaseProgress = 1;
          panelAlpha = alpha;
        }
      }
    }

    if (!drawPanel) return;

    const baseX = sp.x - r * 4.2;
    const baseY = sp.y - r * 0.3;
    const easeOut = 1 - Math.pow(1 - phaseProgress, 3);
    let slideOffset = 0;
    if (phase === 'slideOut') {
      slideOffset = (1 - easeOut) * 40;
    } else if (phase === 'expand' || phase === 'showCode') {
      slideOffset = 0;
    } else {
      slideOffset = easeOut * 10;
    }

    const panelX = baseX + slideOffset;
    const panelY = baseY - 10;

    let panelW = 120;
    let panelH = 70;
    if (phase === 'expand') {
      panelW = 80 + (120 - 80) * easeOut;
      panelH = 45 + (70 - 45) * easeOut;
    } else if (phase === 'pixelate') {
      const shrink = 1 - phaseProgress * 0.3;
      panelW = 120 * shrink;
      panelH = 70 * shrink;
    }

    const panelLeft = panelX - panelW / 2;
    const panelTop = panelY - panelH / 2;

    p.push();
    p.fill(ONE_DARK.bg[0], ONE_DARK.bg[1], ONE_DARK.bg[2], panelAlpha * 0.95);
    p.stroke(60, 66, 78, panelAlpha);
    p.strokeWeight(1);
    p.rect(panelLeft, panelTop, panelW, panelH, 6);

    // Title bar dots
    p.noStroke();
    p.fill(224, 108, 117, panelAlpha);
    p.circle(panelLeft + 8, panelTop + 7, 5);
    p.fill(209, 154, 102, panelAlpha);
    p.circle(panelLeft + 16, panelTop + 7, 5);
    p.fill(152, 195, 121, panelAlpha);
    p.circle(panelLeft + 24, panelTop + 7, 5);

    if (phase === 'showCode') {
      const snippetIndex = Math.floor((now / panelAnimDuration) * CODE_SNIPPETS.length) % CODE_SNIPPETS.length;
      const snippet = CODE_SNIPPETS[snippetIndex];
      p.textSize(9);
      p.textAlign(p.LEFT, p.CENTER);
      const textX = panelLeft + 10;
      const textY = panelTop + panelH / 2 + 3;

      const charProgress = Math.min(phaseProgress * 2, 1);
      const visibleChars = Math.floor(snippet.text.length * charProgress);
      const visibleText = snippet.text.substring(0, visibleChars);

      p.fill(ONE_DARK.function[0], ONE_DARK.function[1], ONE_DARK.function[2], Math.floor(panelAlpha * 0.95));
      p.text(visibleText, textX, textY);

      if (Math.sin(now * 6) > 0) {
        p.fill(ONE_DARK.function[0], ONE_DARK.function[1], ONE_DARK.function[2], Math.floor(panelAlpha * 0.8));
        p.rect(textX + p.textWidth(visibleText) + 2, textY - 4, 2, 8);
      }
    }

    p.pop();
  }

  public drawFiddlingObject(sp: BlobSprite, status: BlobAgentData['status'], r: number, now: number, alpha: number): void {
    const p = this.p;
    const fudge = Math.sin(now * 2 + sp.fiddlePhase);
    const fudge2 = Math.cos(now * 1.5 + sp.fiddlePhase * 1.3);
    const objX = sp.x + r * 1.4 + fudge * 5;
    const objY = sp.y + r * 0.3 + fudge2 * 3;

    p.push();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);

    switch (status) {
      case 'editing':
        this.drawCodePanel(sp, r, now, alpha);
        break;
      case 'reading': {
        const bookOpen = 0.5 + 0.5 * Math.sin(now * 1.2);
        p.push();
        p.translate(objX, objY);
        p.scale(1, bookOpen > 0.5 ? 1 : -0.8);
        p.text('📖', 0, 0);
        p.pop();
        p.push();
        p.translate(sp.x, sp.y - r * 0.6);
        const glassesWobble = Math.sin(now * 0.8) * 2;
        p.textSize(10);
        p.text('👓', glassesWobble, 0);
        p.pop();
        break;
      }
      case 'running': {
        p.noStroke();
        p.fill(255, 255, 255, alpha * 0.3);
        for (let i = 0; i < 3; i++) {
          const streakX = sp.x - r * 1.5 - i * 15 - Math.abs(fudge) * 5;
          const streakY = sp.y + fudge2 * 4;
          p.ellipse(streakX, streakY, 8 - i * 2, 3);
        }
        break;
      }
      case 'thinking': {
        for (let i = 0; i < 3; i++) {
          const particlePhase = (now * 0.8 + i * 0.7 + sp.fiddlePhase) % 3;
          const px = sp.x + Math.sin(now * 2 + i) * 20;
          const py = sp.y - r * (1 + particlePhase);
          const pAlpha = alpha * (1 - particlePhase / 3) * 0.5;
          p.textSize(8 + i * 2);
          p.fill(200, 180, 255, pAlpha);
          p.text('✨', px, py);
        }
        break;
      }
      case 'waiting': {
        p.textSize(14);
        p.fill(255, 220, 100, alpha * (0.6 + 0.4 * Math.sin(now * 3)));
        const qmBounce = Math.abs(Math.sin(now * 3)) * 8;
        p.text('❓', objX, objY - qmBounce);
        break;
      }
      case 'error': {
        p.textSize(12);
        p.fill(255, 100, 100, alpha * (0.5 + 0.3 * Math.sin(now * 5)));
        p.text('⚡', objX + fudge * 6, objY);
        break;
      }
      case 'idle': {
        if (Math.sin(now * 0.5 + sp.fiddlePhase) > 0.85) {
          p.textSize(10);
          p.fill(255, 255, 200, alpha * 0.6);
          p.text('✨', objX + Math.sin(now * 3) * 8, objY - 10);
        }
        break;
      }
    }
    p.pop();
  }

  public drawSpeechBubble(x: number, y: number, text: string | undefined, hue: number, alpha: number, isSub: boolean = false): void {
    if (!text || !text.trim()) return;
    const p = this.p;
    p.push();
    const textSize = isSub ? 9 : 11;
    p.textSize(textSize);
    const tw = p.textWidth(text);
    const bw = tw + (isSub ? 12 : 18);
    const bh = isSub ? 16 : 22;
    const bx = x - bw / 2;
    const by = y - (isSub ? 45 : 72);

    p.noStroke();
    p.fill(10, 10, 20, alpha * 0.92);
    p.rect(bx, by, bw, bh, isSub ? 4 : 6);

    p.stroke(p.color(`hsla(${hue}, 70%, 60%, ${alpha / 255})`));
    p.strokeWeight(1);
    p.noFill();
    p.rect(bx, by, bw, bh, isSub ? 4 : 6);

    p.noStroke();
    p.fill(10, 10, 20, alpha * 0.92);
    p.triangle(x - (isSub ? 3 : 5), by + bh, x + (isSub ? 3 : 5), by + bh, x, by + bh + (isSub ? 5 : 8));

    p.fill(220, 220, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text, x, by + bh / 2 + 1);
    p.pop();
  }

  public drawNameTag(x: number, y: number, folder: string, title: string | undefined, hue: number, status: BlobAgentData['status']): void {
    const p = this.p;
    p.push();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);

    const hasTitle = Boolean(title && title.trim());
    const folderTw = p.textWidth(folder);
    const titleTw = hasTitle ? p.textWidth(title!) : 0;
    const tw = Math.max(folderTw, titleTw);

    const bw = tw + 14;
    const baseBh = 16;
    const titleBh = hasTitle ? 14 : 0;
    const bh = baseBh + titleBh;
    const bx = x - bw / 2;
    const by = y + 32;

    p.noStroke();
    p.fill(10, 10, 20, 200);
    p.rect(bx, by, bw, bh, 3);

    p.fill(p.color(`hsla(${hue}, 70%, 65%, 0.9)`));
    p.text(folder, x, by + baseBh / 2 + 1);

    if (hasTitle) {
      p.fill(p.color(`hsla(${hue}, 50%, 55%, 0.8)`));
      p.textSize(8);
      p.text(title!, x, by + baseBh + titleBh / 2);
    }

    const dotColors: Record<string, [number, number, number]> = {
      idle: [80, 80, 80],
      thinking: [180, 160, 255],
      editing: [100, 255, 150],
      reading: [100, 200, 255],
      running: [255, 180, 80],
      waiting: [255, 220, 60],
      error: [255, 80, 80],
    };
    const dc = dotColors[status] || [120, 120, 120];
    p.fill(dc[0], dc[1], dc[2], 230);
    p.ellipse(bx - 6, by + baseBh / 2, 5, 5);
    p.pop();
  }
}
