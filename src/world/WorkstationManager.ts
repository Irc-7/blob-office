import { WORKSTATIONS, AgentRole, WorkstationDef } from './WorkshopLayout';

export class WorkstationManager {
  private stations: Map<AgentRole, WorkstationDef> = new Map();
  private stationOccupants: Map<AgentRole, string | null> = new Map();

  constructor() {
    for (const [role, def] of Object.entries(WORKSTATIONS) as [AgentRole, WorkstationDef][]) {
      this.stations.set(role, def);
      this.stationOccupants.set(role, null);
    }
  }

  public getStation(role: AgentRole): WorkstationDef {
    const station = this.stations.get(role);
    if (!station) {
      throw new Error(`Workstation for role ${role} not found`);
    }
    return station;
  }

  public getAllStations(): [AgentRole, WorkstationDef][] {
    return Array.from(this.stations.entries());
  }

  public assignAgent(role: AgentRole, agentId: string): void {
    this.stationOccupants.set(role, agentId);
  }

  public releaseAgent(role: AgentRole): void {
    this.stationOccupants.set(role, null);
  }

  public getOccupant(role: AgentRole): string | null {
    return this.stationOccupants.get(role) ?? null;
  }
}
