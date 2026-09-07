export interface PropInstance {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spriteKey?: string;
  type: string;
  interactive?: boolean;
}

export class PropsRegistry {
  private props: Map<string, PropInstance> = new Map();

  constructor() {
    this.registerDefaultProps();
  }

  private registerDefaultProps(): void {
    // Charging dock prop instance
    this.register({
      id: 'prop-dock-main',
      name: 'Charging Station',
      x: 415,
      y: 205,
      width: 64,
      height: 64,
      spriteKey: 'prop-dock',
      type: 'dock',
      interactive: true,
    });

    // Conveyor system center badge
    this.register({
      id: 'prop-conveyor-main',
      name: 'Central Pipeline Unit',
      x: 200,
      y: 160,
      width: 80,
      height: 40,
      type: 'pipeline',
      interactive: true,
    });
  }

  public register(prop: PropInstance): void {
    this.props.set(prop.id, prop);
  }

  public getAll(): PropInstance[] {
    return Array.from(this.props.values());
  }

  public get(id: string): PropInstance | undefined {
    return this.props.get(id);
  }
}
