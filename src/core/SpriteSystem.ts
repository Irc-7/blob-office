export interface PaletteDef {
  primary: string;
  accent: string;
  visor: string;
}

export const PALETTE_MAPS: Record<string, PaletteDef> = {
  server: { primary: '#2563eb', accent: '#60a5fa', visor: '#0ea5e9' },
  frontend: { primary: '#f97316', accent: '#fb923c', visor: '#f59e0b' },
  ocmodule: { primary: '#8b5cf6', accent: '#a78bfa', visor: '#c084fc' },
  design: { primary: '#ec4899', accent: '#f472b6', visor: '#fb7185' },
  orchestrator: { primary: '#10b981', accent: '#34d399', visor: '#6ee7b7' },
};

export class SpriteSystem {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private paletteCache: Map<string, HTMLCanvasElement> = new Map();

  public async loadImage(key: string, url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(key)) {
      return this.imageCache.get(key)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.imageCache.set(key, img);
        resolve(img);
      };
      img.onerror = (err) => {
        reject(new Error(`Failed to load sprite: ${url} (${err})`));
      };
    });
  }

  public getImage(key: string): HTMLImageElement | undefined {
    return this.imageCache.get(key);
  }

  public hasImage(key: string): boolean {
    return this.imageCache.has(key);
  }

  /**
   * Preload standard spritesheets and assets
   */
  public async preloadAll(): Promise<void> {
    const assets = [
      { key: 'background', url: '/assets/background.png' },
      { key: 'bot-server', url: '/assets/sprites/robots/server-bot.png' },
      { key: 'bot-frontend', url: '/assets/sprites/robots/frontend-bot.png' },
      { key: 'bot-ocmodule', url: '/assets/sprites/robots/ocmodule-bot.png' },
      { key: 'bot-design', url: '/assets/sprites/robots/design-bot.png' },
      { key: 'bot-orchestrator', url: '/assets/sprites/robots/orchestrator-bot.png' },
      { key: 'prop-conveyor', url: '/assets/sprites/props/conveyor-frame.png' },
      { key: 'prop-dock', url: '/assets/sprites/props/charging-dock.png' },
      { key: 'prop-leds', url: '/assets/sprites/props/led-indicators.png' },
    ];

    await Promise.all(assets.map((a) => this.loadImage(a.key, a.url)));
  }

  /**
   * Generates a palette-swapped version of a spritesheet in memory
   */
  public getPaletteSwappedImage(
    sourceKey: string,
    role: string,
    palette: PaletteDef
  ): HTMLCanvasElement | HTMLImageElement {
    const cacheKey = `${sourceKey}_${role}_${palette.primary}_${palette.accent}_${palette.visor}`;
    if (this.paletteCache.has(cacheKey)) {
      return this.paletteCache.get(cacheKey)!;
    }

    const sourceImg = this.getImage(sourceKey);
    if (!sourceImg) {
      throw new Error(`Source image '${sourceKey}' not loaded yet.`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = sourceImg.width;
    canvas.height = sourceImg.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceImg;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceImg, 0, 0);

    // Apply color overlay tinting for runtime customization
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = palette.primary;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.paletteCache.set(cacheKey, canvas);
    return canvas;
  }
}
