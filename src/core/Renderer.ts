export interface DrawBatchItem {
  image: CanvasImageSource;
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
  alpha?: number;
  zIndex?: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public readonly width: number = 480;
  public readonly height: number = 270;
  private batchQueue: DrawBatchItem[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to obtain 2D rendering context');
    }
    this.ctx = context;
    this.applyPixelatedSettings();
  }

  private applyPixelatedSettings(): void {
    this.ctx.imageSmoothingEnabled = false;
    this.canvas.style.imageRendering = 'pixelated';
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public clear(fillColor: string = '#7fa28d'): void {
    this.ctx.save();
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  public queueDraw(item: DrawBatchItem): void {
    this.batchQueue.push(item);
  }

  public flushBatch(): void {
    if (this.batchQueue.length === 0) return;

    // Sort by zIndex if provided, preserving stable order
    this.batchQueue.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    for (const item of this.batchQueue) {
      this.ctx.save();
      if (item.alpha !== undefined && item.alpha < 1) {
        this.ctx.globalAlpha = item.alpha;
      }
      this.ctx.drawImage(
        item.image,
        Math.floor(item.sx),
        Math.floor(item.sy),
        Math.floor(item.sWidth),
        Math.floor(item.sHeight),
        Math.floor(item.dx),
        Math.floor(item.dy),
        Math.floor(item.dWidth),
        Math.floor(item.dHeight)
      );
      this.ctx.restore();
    }

    this.batchQueue = [];
  }

  public drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillStyle?: string,
    strokeStyle?: string,
    lineWidth: number = 1
  ): void {
    this.ctx.save();
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.strokeRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }
    this.ctx.restore();
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    color: string = '#ffffff',
    font: string = '8px "JetBrains Mono", monospace'
  ): void {
    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
    this.ctx.restore();
  }
}
