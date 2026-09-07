import { AgentRole } from '../world/WorkshopLayout';
import { AgentState } from '../entities/RobotAgent';

export interface AgentMetrics {
  tokens_used?: number;
  latency_ms?: number;
  cpu_usage?: number;
}

export interface AgentEvent {
  timestamp: number;
  agent_id: string;
  role: AgentRole;
  state: AgentState;
  task_summary?: string;
  target_workstation?: string;
  error_message?: string;
  metrics?: AgentMetrics;
}

export type EventCallback = (event: AgentEvent) => void;

export class EventBridge {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<EventCallback> = new Set();
  private wsUrl: string;
  private sseUrl: string;
  private isConnected: boolean = false;
  private onFallback?: () => void;

  constructor(
    wsUrl: string = 'ws://localhost:5173/ws',
    sseUrl: string = 'http://localhost:5173/events',
    onFallback?: () => void
  ) {
    this.wsUrl = wsUrl;
    this.sseUrl = sseUrl;
    this.onFallback = onFallback;
  }

  public subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public dispatch(event: AgentEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public connect(): void {
    // 1. Attempt WebSocket
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[EventBridge] Connected via WebSocket');
      };

      this.ws.onmessage = (msgEvent) => {
        try {
          const parsed = JSON.parse(msgEvent.data) as AgentEvent;
          this.dispatch(parsed);
        } catch {
          // ignore malformed frame
        }
      };

      this.ws.onerror = () => {
        this.fallbackToSSE();
      };

      this.ws.onclose = () => {
        if (!this.isConnected) {
          this.fallbackToSSE();
        }
      };
    } catch {
      this.fallbackToSSE();
    }
  }

  private fallbackToSSE(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      this.eventSource = new EventSource(this.sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.log('[EventBridge] Connected via SSE');
      };

      this.eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data) as AgentEvent;
          this.dispatch(parsed);
        } catch {
          // ignore
        }
      };

      this.eventSource.onerror = () => {
        this.triggerLocalFallback();
      };
    } catch {
      this.triggerLocalFallback();
    }
  }

  private triggerLocalFallback(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (!this.isConnected && this.onFallback) {
      console.log('[EventBridge] Remote protocols unavailable. Triggering MockTelemetry fallback.');
      this.onFallback();
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}
