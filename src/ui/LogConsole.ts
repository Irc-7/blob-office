import { AgentEvent } from '../network/EventBridge';

export class LogConsole {
  private container: HTMLElement;
  private logList: HTMLElement;
  private maxLogs: number = 10;
  private logs: AgentEvent[] = [];

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'hud-panel hud-logconsole';
    this.container.innerHTML = `
      <div class="log-console-header">
        <span class="log-title">EVENT PIPELINE STREAM</span>
        <span class="log-badge" id="log-count">0 EVENTS</span>
      </div>
      <div class="log-entries" id="log-entries"></div>
    `;

    this.logList = this.container.querySelector('#log-entries')!;
    parent.appendChild(this.container);
  }

  public pushLog(event: AgentEvent): void {
    this.logs.unshift(event);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.render();
  }

  private render(): void {
    const countEl = this.container.querySelector('#log-badge');
    if (countEl) countEl.textContent = `${this.logs.length} EVENTS`;

    let html = '';
    for (const ev of this.logs) {
      const timeStr = new Date(ev.timestamp).toTimeString().split(' ')[0];
      const stateColClass = `log-state-${ev.state}`;

      html += `
        <div class="log-entry">
          <span class="log-time">${timeStr}</span>
          <span class="log-agent">[${ev.role.toUpperCase()}]</span>
          <span class="log-state ${stateColClass}">${ev.state.toUpperCase()}</span>
          <span class="log-summary">${ev.task_summary || 'State changed'}</span>
        </div>
      `;
    }

    this.logList.innerHTML = html;
  }
}
