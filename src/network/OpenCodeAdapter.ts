import { AgentEvent } from './EventBridge';
import { AgentRole } from '../world/WorkshopLayout';
import { AgentState } from '../entities/RobotAgent';

export interface OpenCodePluginEvent {
  type: 'agent_spawn' | 'task_start' | 'task_progress' | 'task_complete' | 'task_error';
  agentId: string;
  agentRole: string;
  description?: string;
  station?: string;
  error?: string;
  stats?: {
    tokens?: number;
    durationMs?: number;
    memoryMb?: number;
  };
}

export class OpenCodeAdapter {
  private eventBridge: { dispatch: (ev: AgentEvent) => void };

  constructor(eventBridge: { dispatch: (ev: AgentEvent) => void }) {
    this.eventBridge = eventBridge;
  }

  public handlePluginEvent(raw: OpenCodePluginEvent): void {
    const role = this.normalizeRole(raw.agentRole);
    let state = AgentState.WORKING;

    switch (raw.type) {
      case 'agent_spawn':
        state = AgentState.IDLE;
        break;
      case 'task_start':
      case 'task_progress':
        state = AgentState.WORKING;
        break;
      case 'task_complete':
        state = AgentState.SUCCESS;
        break;
      case 'task_error':
        state = AgentState.ERROR;
        break;
    }

    const event: AgentEvent = {
      timestamp: Date.now(),
      agent_id: raw.agentId,
      role: role,
      state: state,
      task_summary: raw.description,
      target_workstation: raw.station,
      error_message: raw.error,
      metrics: {
        tokens_used: raw.stats?.tokens,
        latency_ms: raw.stats?.durationMs,
        cpu_usage: raw.stats?.memoryMb,
      },
    };

    this.eventBridge.dispatch(event);
  }

  private normalizeRole(roleString: string): AgentRole {
    const lower = roleString.toLowerCase();
    if (lower.includes('server') || lower.includes('backend')) return 'server';
    if (lower.includes('front') || lower.includes('ui')) return 'frontend';
    if (lower.includes('ocmodule') || lower.includes('module') || lower.includes('logic')) return 'ocmodule';
    if (lower.includes('design') || lower.includes('asset') || lower.includes('art')) return 'design';
    return 'orchestrator';
  }
}
