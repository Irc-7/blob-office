export class Camera {
  public x: number = 0;
  public y: number = 0;
  public zoom: number = 1.0;
  private readonly viewportWidth: number;
  private readonly viewportHeight: number;

  constructor(viewportWidth: number = 480, viewportHeight: number = 270) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setZoom(zoom: number): void {
    this.zoom = Math.max(1.0, Math.min(3.0, zoom));
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(-this.x, -this.y);
    if (this.zoom !== 1.0) {
      ctx.scale(this.zoom, this.zoom);
    }
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public isVisible(x: number, y: number, w: number, h: number): boolean {
    return (
      x + w >= this.x &&
      x <= this.x + this.viewportWidth &&
      y + h >= this.y &&
      y <= this.y + this.viewportHeight
    );
  }
}
