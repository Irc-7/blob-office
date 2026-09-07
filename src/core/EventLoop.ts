export class EventLoop {
  private targetFps: number;
  private frameInterval: number;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private updateCallback: (dt: number) => void;
  private renderCallback: () => void;

  constructor(
    targetFps: number = 30,
    update: (dt: number) => void,
    render: () => void
  ) {
    this.targetFps = targetFps;
    this.frameInterval = 1000 / targetFps;
    this.updateCallback = update;
    this.renderCallback = render;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) return;

    const elapsed = currentTime - this.lastTime;
    if (elapsed >= this.frameInterval) {
      // Cap delta time to prevent spiraling after tab refocus
      const dt = Math.min(elapsed / 1000, 0.1);
      this.lastTime = currentTime - (elapsed % this.frameInterval);

      this.updateCallback(dt);
      this.renderCallback();
    }
  }

  public getTargetFps(): number {
    return this.targetFps;
  }
}
