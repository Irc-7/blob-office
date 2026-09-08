export type BlobAgentStatus =
  | 'idle'
  | 'thinking'
  | 'editing'
  | 'reading'
  | 'running'
  | 'waiting'
  | 'error';

export interface BlobAgentData {
  id: string;
  parentID?: string;
  folder: string;
  title?: string;
  status: BlobAgentStatus;
  message?: string;
  color: number; // Hue 0-360
  activityScale?: number;
  _fadeOutStart?: number;
  _sprite?: BlobSprite;
}

export interface StatusConfig {
  pulse: number;
  radius: number;
  opacity: number;
  label: string;
  ring: boolean;
}

export interface HandoffPacket {
  fromId: string;
  toId: string;
  label: string;
  startTime: number;
  duration: number;
  senderMessage?: string;
  receiverMessage?: string;
}

export interface PipelineHandoffEvent {
  from_agent: string;
  to_agent: string;
  payload_label: string;
  sender_message?: string;
  receiver_message?: string;
}

export const STATUS_CFG: Record<BlobAgentStatus, StatusConfig> = {
  idle:     { pulse: 0.4, radius: 22, opacity: 160, label: "💤", ring: false },
  thinking: { pulse: 1.8, radius: 26, opacity: 230, label: "🧠", ring: true  },
  editing:  { pulse: 1.2, radius: 24, opacity: 255, label: "✏️", ring: true  },
  reading:  { pulse: 1.2, radius: 25, opacity: 210, label: "📖", ring: true  },
  running:  { pulse: 3.0, radius: 27, opacity: 245, label: "💻", ring: true  },
  waiting:  { pulse: 0.8, radius: 24, opacity: 200, label: "⚠️", ring: true  },
  error:    { pulse: 1.5, radius: 24, opacity: 255, label: "❌", ring: true  },
};

export const ONE_DARK = {
  bg: [40, 44, 52] as [number, number, number],
  comment: [92, 99, 112] as [number, number, number],
  string: [152, 195, 121] as [number, number, number],
  number: [209, 154, 102] as [number, number, number],
  keyword: [198, 120, 221] as [number, number, number],
  function: [97, 175, 239] as [number, number, number],
  variable: [224, 108, 117] as [number, number, number],
  operator: [212, 218, 226] as [number, number, number],
};

export const CODE_SNIPPETS = [
  { text: 'src/index.ts' },
  { text: 'utils/helpers.ts' },
  { text: 'components/App.tsx' },
  { text: 'api/routes.ts' },
  { text: 'config.ts' },
  { text: 'engine/BlobRenderer.ts' },
  { text: 'hooks/useSubagent.ts' },
];

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class BlobSprite {
  public x: number;
  public y: number;
  public tx: number;
  public ty: number;
  public vx: number = 0;
  public vy: number = 0;
  public hue: number;
  public isSubagent: boolean;
  public phase: number;
  public walkPhase: number = 0;
  public bobAmount: number = 0;

  public currentStatus: BlobAgentStatus = 'idle';
  public targetStatus: BlobAgentStatus = 'idle';

  public currentPulse: number = 0.4;
  public currentRadius: number = 22;
  public currentAlpha: number = 160;
  public currentBobSpeed: number = 0.8;

  public targetPulse: number = 0.4;
  public targetRadius: number = 22;
  public targetAlpha: number = 160;
  public targetBobSpeed: number = 0.8;

  public wanderOffset = { x: 0, y: 0 };
  public wanderTarget = { x: 0, y: 0 };
  public wanderTimer: number = 0;

  public orbitAngle: number;
  public orbitRadius: number;
  public orbitSpeed: number;

  public fiddlePhase: number;
  public blinkTimer: number;
  public isBlinking: boolean = false;

  public editPanelClosing: boolean = false;
  public editPanelCloseStart: number = 0;
  public editPanelShowTime: number | null = null;
  public previousStatus: BlobAgentStatus = 'idle';

  constructor(x: number, y: number, hue: number, isSubagent: boolean = false) {
    this.x = x;
    this.y = y;
    this.tx = x;
    this.ty = y;
    this.hue = hue;
    this.isSubagent = isSubagent;
    this.phase = Math.random() * Math.PI * 2;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitRadius = 45 + Math.random() * 25;
    this.orbitSpeed = 0.3 + Math.random() * 0.3;
    this.fiddlePhase = Math.random() * Math.PI * 2;
    this.blinkTimer = Math.random() * 3;
  }
}
