export type AgentRole = 'server' | 'frontend' | 'ocmodule' | 'design' | 'orchestrator';

export interface GridCoord {
  x: number;
  y: number;
}

export interface WorkstationDef {
  gridPos: GridCoord;
  pixelPos: { x: number; y: number };
  props: string[];
  ledColor: string;
  activityIndicator: 'terminal-scroll' | 'ui-preview' | 'assembly-progress' | 'sketch-preview' | 'kanban-flow';
}

export interface SharedElementDef {
  type: 'conveyor-belt' | 'charging-dock' | 'break-area';
  gridPos?: GridCoord;
  pixelPos?: { x: number; y: number };
  path?: [number, number][];
  props?: string[];
}

export const WORKSTATIONS: Record<AgentRole, WorkstationDef> = {
  server: {
    gridPos: { x: 1, y: 1 },
    pixelPos: { x: 44, y: 88 },
    props: ['server-rack', 'cooling-fan', 'ethernet-cables', 'log-monitor'],
    ledColor: '#0ea5e9',
    activityIndicator: 'terminal-scroll',
  },
  frontend: {
    gridPos: { x: 3, y: 1 },
    pixelPos: { x: 128, y: 88 },
    props: ['wide-monitor', 'color-swatches', 'wireframe-canvas', 'stylus-pad'],
    ledColor: '#f59e0b',
    activityIndicator: 'ui-preview',
  },
  ocmodule: {
    gridPos: { x: 5, y: 1 },
    pixelPos: { x: 240, y: 88 },
    props: ['workbench', 'gear-assembly', 'module-blocks', 'cable-harness'],
    ledColor: '#c084fc',
    activityIndicator: 'assembly-progress',
  },
  design: {
    gridPos: { x: 7, y: 1 },
    pixelPos: { x: 376, y: 88 },
    props: ['drawing-tablet', 'easel', 'color-wheel-poster', 'beret-hook'],
    ledColor: '#fb7185',
    activityIndicator: 'sketch-preview',
  },
  orchestrator: {
    gridPos: { x: 4, y: 4 },
    pixelPos: { x: 240, y: 180 },
    props: ['kanban-hologram', 'task-cards', 'status-orb'],
    ledColor: '#6ee7b7',
    activityIndicator: 'kanban-flow',
  },
};

export const SHARED_ELEMENTS: SharedElementDef[] = [
  {
    type: 'conveyor-belt',
    path: [
      [80, 230],
      [190, 185],
      [285, 185],
      [400, 230],
    ],
  },
  {
    type: 'charging-dock',
    gridPos: { x: 7, y: 5 },
    pixelPos: { x: 435, y: 215 },
  },
  {
    type: 'break-area',
    gridPos: { x: 0, y: 4 },
    pixelPos: { x: 20, y: 210 },
    props: ['plant', 'terracotta-pot'],
  },
];
