import { BlobAgentData, BlobAgentStatus } from './BlobModel';

export interface OpenCodeSessionEvent {
  type: 'snapshot' | 'session_created' | 'session_deleted' | 'tool_start' | 'tool_end';
  agents?: BlobAgentData[];
  session?: {
    id: string;
    parentID?: string;
    folder?: string;
    title?: string;
    status?: BlobAgentStatus;
    tool?: string;
  };
}

export class BlobWebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private onSnapshot: (agents: BlobAgentData[]) => void;
  private onStatusChange: (status: 'connected' | 'reconnecting' | 'closed') => void;
  private reconnectTimer: number | null = null;

  constructor(
    url: string = 'ws://localhost:2727/ws',
    onSnapshot: (agents: BlobAgentData[]) => void,
    onStatusChange: (status: 'connected' | 'reconnecting' | 'closed') => void
  ) {
    this.url = url;
    this.onSnapshot = onSnapshot;
    this.onStatusChange = onStatusChange;
  }

  public connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.onStatusChange('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onclose = () => {
        this.onStatusChange('reconnecting');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.onStatusChange('reconnecting');
      };

      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as OpenCodeSessionEvent;
          if (data.type === 'snapshot' && data.agents) {
            this.onSnapshot(data.agents);
          }
        } catch {
          // ignore malformed frame
        }
      };
    } catch {
      this.onStatusChange('reconnecting');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatusChange('closed');
  }
}
