import { AgentEvent, EventBridge } from './EventBridge';
import { AgentRole } from '../world/WorkshopLayout';
import { AgentState } from '../entities/RobotAgent';

interface AgentScenario {
  id: string;
  role: AgentRole;
  tasks: string[];
}

export class MockTelemetry {
  private bridge: EventBridge;
  private timer: number | null = null;
  private intervalMs: number;
  private step: number = 0;

  private scenarios: AgentScenario[] = [
    {
      id: 'agent_server_01',
      role: 'server',
      tasks: [
        'Syncing PostgreSQL connection pool',
        'Streaming telemetry to Redis shard',
        'Handling WebSocket ping buffer',
        'Verifying SSL certificate bundle',
      ],
    },
    {
      id: 'agent_frontend_02',
      role: 'frontend',
      tasks: [
        'Drafting responsive wireframe grid',
        'Rendering glassmorphism HUD panel',
        'Optimizing canvas draw calls',
        'Binding reactivity state selectors',
      ],
    },
    {
      id: 'agent_ocmodule_03',
      role: 'ocmodule',
      tasks: [
        'Assembling syntax parsing tree',
        'Calibrating tool invocation hooks',
        'Resolving plugin dependency chain',
        'Testing mock payload schema',
      ],
    },
    {
      id: 'agent_design_04',
      role: 'design',
      tasks: [
        'Tweaking 16-color retro palette',
        'Drawing chibi robot sprite frames',
        'Balancing mint-green room lighting',
        'Exporting crisp pixel-art assets',
      ],
    },
    {
      id: 'agent_orchestrator_05',
      role: 'orchestrator',
      tasks: [
        'Routing task batch to pipeline',
        'Balancing workload across stations',
        'Inspecting unit test verification',
        'Broadcasting milestone event',
      ],
    },
  ];

  constructor(bridge: EventBridge, intervalMs: number = 4000) {
    this.bridge = bridge;
    this.intervalMs = intervalMs;
  }

  public start(): void {
    if (this.timer !== null) return;

    // Emit initial spawn events for all 5 agents
    for (const sc of this.scenarios) {
      this.bridge.dispatch({
        timestamp: Date.now(),
        agent_id: sc.id,
        role: sc.role,
        state: AgentState.WORKING,
        task_summary: sc.tasks[0],
        metrics: {
          tokens_used: Math.floor(250 + Math.random() * 400),
          latency_ms: Math.floor(80 + Math.random() * 120),
          cpu_usage: Math.floor(12 + Math.random() * 8),
        },
      });
    }

    this.timer = window.setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    this.step++;
    const targetIdx = this.step % this.scenarios.length;
    const sc = this.scenarios[targetIdx];

    const possibleStates = [
      AgentState.WORKING,
      AgentState.RESEARCHING,
      AgentState.SUCCESS,
      AgentState.IDLE,
    ];

    const randomState = possibleStates[Math.floor(Math.random() * possibleStates.length)];
    const task = sc.tasks[Math.floor(Math.random() * sc.tasks.length)];

    const event: AgentEvent = {
      timestamp: Date.now(),
      agent_id: sc.id,
      role: sc.role,
      state: randomState,
      task_summary: task,
      metrics: {
        tokens_used: Math.floor(180 + Math.random() * 650),
        latency_ms: Math.floor(65 + Math.random() * 140),
        cpu_usage: Math.floor(15 + Math.random() * 15),
      },
    };

    this.bridge.dispatch(event);
  }
}
