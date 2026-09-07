import { describe, it, expect } from 'vitest';
import { BlobSimulator } from '../src/blob/BlobSimulator';

describe('BlobSimulator and State Transitions', () => {
  it('should initialize default agents with proper parent-child subagent relations', () => {
    const sim = new BlobSimulator((agents) => {
      expect(agents.length).toBeGreaterThan(0);
    });

    const agents = sim.getAgents();
    expect(agents.length).toBeGreaterThanOrEqual(4);

    const sub = agents.find((a) => Boolean(a.parentID));
    expect(sub).toBeDefined();
    expect(sub?.parentID).toBe('agent-core-session');
  });

  it('should toggle subagents dynamically', () => {
    const sim = new BlobSimulator(() => {});
    const initialCount = sim.getAgents().length;

    // Toggle subagent on core session
    sim.toggleSubagent('agent-core-session');
    const newCount = sim.getAgents().length;
    // Toggling removes existing or adds new
    expect(Math.abs(newCount - initialCount)).toBe(1);
  });
});
