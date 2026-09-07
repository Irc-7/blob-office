import { SpriteSystem } from '../core/SpriteSystem';

export interface ConveyorPackage {
  progress: number; // 0.0 to 1.0 along the path
  speed: number;
  frameIndex: number;
}

export class ConveyorBelt {
  // Input line: [65, 238] -> [185, 190]
  // Output line: [290, 190] -> [410, 238]
  private items: ConveyorPackage[] = [];
  private spawnTimer: number = 0;
  private animTimer: number = 0;

  constructor() {
    this.spawnInitialItems();
  }

  private spawnInitialItems(): void {
    this.items.push(
      { progress: 0.2, speed: 0.08, frameIndex: 0 },
      { progress: 0.65, speed: 0.08, frameIndex: 1 },
      { progress: 0.85, speed: 0.08, frameIndex: 2 }
    );
  }

  public update(dt: number): void {
    this.animTimer += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer > 4.0) {
      this.spawnTimer = 0;
      this.items.push({
        progress: 0.0,
        speed: 0.07 + Math.random() * 0.02,
        frameIndex: Math.floor(Math.random() * 4),
      });
    }

    for (const item of this.items) {
      item.progress += item.speed * dt;
    }

    // Keep items until they reach end
    this.items = this.items.filter((item) => item.progress < 1.0);
  }

  public render(ctx: CanvasRenderingContext2D, sprites: SpriteSystem): void {
    const img = sprites.getImage('prop-conveyor');
    if (!img) return;

    for (const item of this.items) {
      // Calculate coordinates along conveyor line
      let px: number;
      let py: number;

      if (item.progress < 0.5) {
        // Input phase
        const t = item.progress / 0.5;
        px = 65 + (185 - 65) * t;
        py = 238 + (190 - 238) * t;
      } else {
        // Output phase
        const t = (item.progress - 0.5) / 0.5;
        px = 290 + (410 - 290) * t;
        py = 190 + (238 - 190) * t;
      }

      const frame = (item.frameIndex + Math.floor(this.animTimer * 4)) % 4;
      const sx = frame * 32;

      ctx.save();
      ctx.drawImage(img, sx, 0, 32, 32, Math.floor(px - 16), Math.floor(py - 24), 32, 32);
      ctx.restore();
    }
  }
}
