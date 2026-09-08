import { BlobAgentData, BlobAgentStatus, PipelineHandoffEvent } from './BlobModel';

export interface OpenCodeSessionEvent {
  type: 'snapshot' | 'session_created' | 'session_deleted' | 'tool_start' | 'tool_end' | 'AGENT_STATE_CHANGE' | 'PIPELINE_HANDOFF' | 'LOG';
  agents?: BlobAgentData[];
  room?: string;
  data?: any;
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
  private room: string = 'default';
  private ws: WebSocket | null = null;
  private onSnapshot: (agents: BlobAgentData[]) => void;
  private onStatusChange: (status: 'connected' | 'reconnecting' | 'closed') => void;
  private onHandoff?: (handoff: PipelineHandoffEvent) => void;
  private onAgentStateChange?: (agentId: string, state: string, message?: string) => void;
  private reconnectTimer: number | null = null;

  constructor(
    url?: string,
    onSnapshot?: (agents: BlobAgentData[]) => void,
    onStatusChange?: (status: 'connected' | 'reconnecting' | 'closed') => void,
    options?: {
      room?: string;
      onHandoff?: (handoff: PipelineHandoffEvent) => void;
      onAgentStateChange?: (agentId: string, state: string, message?: string) => void;
    }
  ) {
    if (url) {
      this.url = url;
    } else {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:2727';
      this.url = `${isHttps ? 'wss:' : 'ws:'}//${host}/ws/telemetry`;
    }

    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      this.room = options?.room || p.get('room') || 'default';
    } else {
      this.room = options?.room || 'default';
    }

    this.onSnapshot = onSnapshot || (() => {});
    this.onStatusChange = onStatusChange || (() => {});
    this.onHandoff = options?.onHandoff;
    this.onAgentStateChange = options?.onAgentStateChange;
  }

  public connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.onStatusChange('connected');
        if (this.room) {
          try {
            this.ws?.send(JSON.stringify({ action: 'subscribe', room: this.room }));
          } catch {}
        }
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
          } else if (data.type === 'PIPELINE_HANDOFF' && data.data && this.onHandoff) {
            this.onHandoff(data.data as PipelineHandoffEvent);
          } else if (data.type === 'AGENT_STATE_CHANGE' && data.data && this.onAgentStateChange) {
            const { agent_id, state, message } = data.data;
            this.onAgentStateChange(agent_id, state, message);
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
