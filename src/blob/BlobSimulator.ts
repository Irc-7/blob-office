import { BlobAgentData, BlobAgentStatus } from './BlobModel';

export class BlobSimulator {
  private timer: number | null = null;
  private agents: Map<string, BlobAgentData> = new Map();
  private onUpdate: (agents: BlobAgentData[]) => void;
  private step: number = 0;

  constructor(onUpdate: (agents: BlobAgentData[]) => void) {
    this.onUpdate = onUpdate;
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    const defaults: BlobAgentData[] = [
      {
        id: 'agent-core-session',
        folder: 'frontend-core',
        title: 'Vite / UI Layout',
        status: 'editing',
        message: 'Writing BlobRenderer.ts',
        color: 210, // Cyan-blue
        activityScale: 1.1,
      },
      {
        id: 'agent-sub-01',
        parentID: 'agent-core-session',
        folder: 'css-compiler',
        title: 'Tailwind Engine',
        status: 'running',
        message: 'Compiling theme tokens',
        color: 240,
        activityScale: 0.9,
      },
      {
        id: 'agent-backend-session',
        folder: 'api-gateway',
        title: 'WebSocket Bus',
        status: 'thinking',
        message: 'Synthesizing pipeline schema',
        color: 280, // Purple
        activityScale: 1.0,
      },
      {
        id: 'agent-db-session',
        folder: 'vector-store',
        title: 'ChromaDB Indexer',
        status: 'reading',
        message: 'Scanning chunk embeddings',
        color: 145, // Emerald green
        activityScale: 1.0,
      },
      {
        id: 'agent-qa-session',
        folder: 'e2e-runner',
        title: 'Playwright Worker',
        status: 'waiting',
        message: 'Waiting for approval',
        color: 35, // Amber
        activityScale: 1.05,
      },
    ];

    for (const a of defaults) {
      this.agents.set(a.id, a);
    }
  }

  public start(): void {
    if (this.timer !== null) return;
    this.broadcast();

    this.timer = window.setInterval(() => {
      this.tick();
    }, 3200);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getAgents(): BlobAgentData[] {
    return Array.from(this.agents.values());
  }

  public setAgents(agentsList: BlobAgentData[]): void {
    this.agents.clear();
    for (const a of agentsList) {
      this.agents.set(a.id, a);
    }
    this.broadcast();
  }

  public triggerAction(agentId: string, status: BlobAgentStatus, message?: string): void {
    const ag = this.agents.get(agentId);
    if (ag) {
      ag.status = status;
      if (message) ag.message = message;
      this.broadcast();
    }
  }

  public toggleSubagent(parentId: string): void {
    const subId = `${parentId}-sub-${Date.now().toString().slice(-4)}`;
    const existingSub = Array.from(this.agents.values()).find((a) => a.parentID === parentId);

    if (existingSub) {
      this.agents.delete(existingSub.id);
    } else {
      const parent = this.agents.get(parentId);
      if (parent) {
        this.agents.set(subId, {
          id: subId,
          parentID: parentId,
          folder: `${parent.folder}/worker`,
          title: 'Sub-agent task',
          status: 'running',
          message: 'Executing sub-routine',
          color: (parent.color + 30) % 360,
          activityScale: 0.85,
        });
      }
    }
    this.broadcast();
  }

  private tick(): void {
    this.step++;
    const agentList = Array.from(this.agents.values());
    const targetAgent = agentList[this.step % agentList.length];

    const cycleStatuses: { status: BlobAgentStatus; messages: string[] }[] = [
      { status: 'thinking', messages: ['Planning AST refactor', 'Evaluating token budget', 'Searching vector index'] },
      { status: 'editing', messages: ['Updating src/index.ts', 'Refactoring helpers.ts', 'Writing types/agent.ts'] },
      { status: 'running', messages: ['Running vitest suite', 'Executing bash command', 'Building bundle'] },
      { status: 'reading', messages: ['Reading config.yaml', 'Inspecting package.json', 'Parsing logs'] },
      { status: 'waiting', messages: ['Waiting for user confirmation', 'Awaiting permission hook', 'Paused for input'] },
      { status: 'idle', messages: ['Task done. Idle.', 'Standing by for next session', 'Recharging session'] },
    ];

    const chosen = cycleStatuses[Math.floor(Math.random() * cycleStatuses.length)];
    targetAgent.status = chosen.status;
    targetAgent.message = chosen.messages[Math.floor(Math.random() * chosen.messages.length)];

    this.broadcast();
  }

  private broadcast(): void {
    this.onUpdate(Array.from(this.agents.values()));
  }
}
