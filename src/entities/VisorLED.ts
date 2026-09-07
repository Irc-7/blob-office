export type VisorPatternType =
  | 'dots-blink'
  | 'dashes-static'
  | 'capsules-glow'
  | 'scan-bars'
  | 'error-cross'
  | 'happy-arcs'
  | 'dimmed-dashes';

export class VisorLED {
  private pattern: VisorPatternType = 'dots-blink';
  private color: string = '#0ea5e9';
  private blinkTimer: number = 0;
  private scanOffset: number = 0;
  private jitterX: number = 0;
  private jitterY: number = 0;
  private pulseTimer: number = 0;

  public setPattern(pattern: VisorPatternType, color: string): void {
    this.pattern = pattern;
    this.color = color;
  }

  public update(dt: number): void {
    this.blinkTimer += dt;
    this.pulseTimer += dt;

    if (this.pattern === 'scan-bars') {
      this.scanOffset = (this.scanOffset + dt * 14) % 16;
    } else if (this.pattern === 'error-cross') {
      // 10Hz micro jitter (2px)
      this.jitterX = (Math.random() - 0.5) * 2;
      this.jitterY = (Math.random() - 0.5) * 2;
    } else {
      this.jitterX = 0;
      this.jitterY = 0;
    }
  }

  /**
   * Renders the dynamic LED overlay layer over the robot's visor area (20x10 px)
   */
  public render(ctx: CanvasRenderingContext2D, headCenterX: number, headTopY: number): void {
    const visorW = 20;
    const visorH = 10;
    const vx = Math.floor(headCenterX - visorW / 2 + this.jitterX);
    const vy = Math.floor(headTopY + 7 + this.jitterY);

    ctx.save();

    // Dark visor background glass
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(vx, vy, visorW, visorH);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;

    switch (this.pattern) {
      case 'dots-blink': {
        // 3.5s blink cycle: closed for 0.2s
        const isBlinking = this.blinkTimer % 3.5 > 3.3;
        if (isBlinking) {
          ctx.fillRect(vx + 4, vy + 4, 3, 1);
          ctx.fillRect(vx + 13, vy + 4, 3, 1);
        } else {
          ctx.fillRect(vx + 4, vy + 3, 3, 4);
          ctx.fillRect(vx + 13, vy + 3, 3, 4);
        }
        break;
      }

      case 'dashes-static': {
        ctx.fillRect(vx + 3, vy + 4, 4, 2);
        ctx.fillRect(vx + 13, vy + 4, 4, 2);
        break;
      }

      case 'capsules-glow': {
        // Bright glow capsules
        ctx.fillStyle = this.color;
        ctx.fillRect(vx + 3, vy + 2, 5, 6);
        ctx.fillRect(vx + 12, vy + 2, 5, 6);

        // Inner white shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(vx + 4, vy + 3, 2, 3);
        ctx.fillRect(vx + 13, vy + 3, 2, 3);
        break;
      }

      case 'scan-bars': {
        // Horizontal scanner bar
        const scanX = Math.floor(vx + 2 + (Math.sin(this.scanOffset) + 1) * 7);
        ctx.fillStyle = this.color;
        ctx.fillRect(scanX, vy + 2, 3, 6);
        break;
      }

      case 'error-cross': {
        // Red X X pattern
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        // Left X
        ctx.moveTo(vx + 3, vy + 2);
        ctx.lineTo(vx + 7, vy + 7);
        ctx.moveTo(vx + 7, vy + 2);
        ctx.lineTo(vx + 3, vy + 7);
        // Right X
        ctx.moveTo(vx + 13, vy + 2);
        ctx.lineTo(vx + 17, vy + 7);
        ctx.moveTo(vx + 17, vy + 2);
        ctx.lineTo(vx + 13, vy + 7);
        ctx.stroke();
        break;
      }

      case 'happy-arcs': {
        // Inverted arcs (^ ^)
        ctx.strokeStyle = '#34d399';
        ctx.beginPath();
        // Left ^
        ctx.moveTo(vx + 3, vy + 6);
        ctx.lineTo(vx + 6, vy + 2);
        ctx.lineTo(vx + 9, vy + 6);
        // Right ^
        ctx.moveTo(vx + 11, vy + 6);
        ctx.lineTo(vx + 14, vy + 2);
        ctx.lineTo(vx + 17, vy + 6);
        ctx.stroke();
        break;
      }

      case 'dimmed-dashes': {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.fillRect(vx + 4, vy + 4, 3, 1);
        ctx.fillRect(vx + 13, vy + 4, 3, 1);
        break;
      }
    }

    ctx.restore();
  }
}
