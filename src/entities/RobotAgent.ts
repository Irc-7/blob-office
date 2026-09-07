import { AgentRole, WorkstationDef } from '../world/WorkshopLayout';
import { SpriteSystem, PALETTE_MAPS } from '../core/SpriteSystem';
import { VisorLED, VisorPatternType } from './VisorLED';

export enum AgentState {
  IDLE = 'idle',
  WALKING = 'walking',
  WORKING = 'working',
  RESEARCHING = 'researching',
  ERROR = 'error',
  SUCCESS = 'success',
  OFFLINE = 'offline',
}

export class RobotAgent {
  public readonly id: string;
  public readonly role: AgentRole;
  public state: AgentState = AgentState.IDLE;
  public x: number;
  public y: number;
  public targetX: number;
  public targetY: number;
  public currentTask: string = 'Standing by';

  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private visor: VisorLED;
  private moveSpeed: number = 48; // px/sec
  private workstation: WorkstationDef;

  constructor(id: string, role: AgentRole, workstation: WorkstationDef) {
    this.id = id;
    this.role = role;
    this.workstation = workstation;
    this.x = workstation.pixelPos.x;
    this.y = workstation.pixelPos.y;
    this.targetX = this.x;
    this.targetY = this.y;

    this.visor = new VisorLED();
    this.updateVisorPattern();
  }

  public setState(newState: AgentState, taskSummary?: string): void {
    if (this.state === newState && !taskSummary) return;

    this.state = newState;
    if (taskSummary) {
      this.currentTask = taskSummary;
    }
    this.currentFrame = 0;
    this.frameTimer = 0;

    // Behavior mapping
    switch (newState) {
      case AgentState.WORKING:
        this.targetX = this.workstation.pixelPos.x;
        this.targetY = this.workstation.pixelPos.y;
        break;
      case AgentState.IDLE:
        // Idle walks to station or charging dock
        break;
      case AgentState.WALKING:
        break;
      default:
        break;
    }

    this.updateVisorPattern();
  }

  public moveTo(tx: number, ty: number): void {
    this.targetX = tx;
    this.targetY = ty;
    this.state = AgentState.WALKING;
    this.updateVisorPattern();
  }

  private updateVisorPattern(): void {
    const palette = PALETTE_MAPS[this.role] || PALETTE_MAPS.server;
    let pattern: VisorPatternType = 'dots-blink';
    let col = palette.visor;

    switch (this.state) {
      case AgentState.IDLE:
        pattern = 'dots-blink';
        break;
      case AgentState.WALKING:
        pattern = 'dashes-static';
        break;
      case AgentState.WORKING:
        pattern = 'capsules-glow';
        break;
      case AgentState.RESEARCHING:
        pattern = 'scan-bars';
        break;
      case AgentState.ERROR:
        pattern = 'error-cross';
        col = '#ef4444';
        break;
      case AgentState.SUCCESS:
        pattern = 'happy-arcs';
        col = '#34d399';
        break;
      case AgentState.OFFLINE:
        pattern = 'dimmed-dashes';
        break;
    }

    this.visor.setPattern(pattern, col);
  }

  public update(dt: number): void {
    // 1. Movement interpolation
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1.5) {
      const step = Math.min(this.moveSpeed * dt, dist);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      if (this.state !== AgentState.WALKING) {
        this.state = AgentState.WALKING;
        this.updateVisorPattern();
      }
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      if (this.state === AgentState.WALKING) {
        this.setState(AgentState.WORKING);
      }
    }

    // 2. Sprite frame animation timing
    let fps = 8;
    if (this.state === AgentState.WALKING) fps = 12;
    else if (this.state === AgentState.WORKING || this.state === AgentState.RESEARCHING) fps = 15;
    else if (this.state === AgentState.SUCCESS) fps = 20;

    this.frameTimer += dt;
    if (this.frameTimer >= 1 / fps) {
      this.frameTimer -= 1 / fps;
      this.currentFrame = (this.currentFrame + 1) % 4;
    }

    this.visor.update(dt);
  }

  public render(ctx: CanvasRenderingContext2D, sprites: SpriteSystem): void {
    const spriteKey = `bot-${this.role}`;
    const img = sprites.getImage(spriteKey);
    if (!img) return;

    // Sprite layout: [idle 0..3, walk 4..7, work 8..11, celebrate 12..15]
    let stateBaseFrame = 0;
    if (this.state === AgentState.WALKING) stateBaseFrame = 4;
    else if (this.state === AgentState.WORKING || this.state === AgentState.RESEARCHING || this.state === AgentState.ERROR)
      stateBaseFrame = 8;
    else if (this.state === AgentState.SUCCESS) stateBaseFrame = 12;

    const frameIndex = stateBaseFrame + this.currentFrame;
    const sx = frameIndex * 64;
    const sy = 0;
    const dx = Math.floor(this.x - 32);
    const dy = Math.floor(this.y - 48);

    ctx.save();
    if (this.state === AgentState.OFFLINE) {
      ctx.globalAlpha = 0.35;
    }

    ctx.drawImage(img, sx, sy, 64, 64, dx, dy, 64, 64);

    // Visor LED layer overlay
    let headDy = 0;
    if (this.state === AgentState.IDLE) {
      headDy = [0, -1, -1, 0][this.currentFrame] || 0;
    } else if (this.state === AgentState.WALKING) {
      headDy = [-1, 0, -1, 0][this.currentFrame] || 0;
    } else if (this.state === AgentState.WORKING) {
      headDy = [0, 1, 0, -1][this.currentFrame] || 0;
    } else if (this.state === AgentState.SUCCESS) {
      headDy = [-2, -5, -4, -1][this.currentFrame] || 0;
    }

    this.visor.render(ctx, this.x, dy + 12 + headDy);

    // Role Indicator mini pill above head
    if (this.state !== AgentState.OFFLINE) {
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      const text = this.role.toUpperCase();
      const tw = ctx.measureText(text).width;
      ctx.fillRect(Math.floor(this.x - tw / 2 - 2), dy + 4, tw + 4, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(text, Math.floor(this.x - tw / 2), dy + 10);
    }

    ctx.restore();
  }
}
