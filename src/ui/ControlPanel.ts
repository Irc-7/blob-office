export interface ControlPanelCallbacks {
  onTriggerTask: (role: string) => void;
  onTriggerError: (role: string) => void;
  onTriggerSuccess: (role: string) => void;
  onToggleZoom: () => void;
}

export class ControlPanel {
  private container: HTMLElement;
  private callbacks: ControlPanelCallbacks;

  constructor(parent: HTMLElement, callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.className = 'hud-panel hud-controlpanel';
    this.render();
    parent.appendChild(this.container);
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-panel-title">CONTROL DECK</div>
      <div class="control-grid">
        <div class="control-row">
          <label class="control-label">SIMULATE:</label>
          <select id="select-bot-role" class="control-select">
            <option value="server">Server</option>
            <option value="frontend">Frontend</option>
            <option value="ocmodule">OCModule</option>
            <option value="design">Design</option>
            <option value="orchestrator">Orchestrator</option>
          </select>
        </div>
        <div class="control-actions">
          <button id="btn-trigger-task" class="btn btn-work">WORK</button>
          <button id="btn-trigger-success" class="btn btn-success">SUCCESS</button>
          <button id="btn-trigger-error" class="btn btn-error">ERROR</button>
        </div>
        <div class="control-zoom">
          <button id="btn-toggle-zoom" class="btn btn-secondary">TOGGLE ZOOM (2x / 3x)</button>
        </div>
      </div>
    `;

    const selectEl = this.container.querySelector('#select-bot-role') as HTMLSelectElement;

    this.container.querySelector('#btn-trigger-task')?.addEventListener('click', () => {
      this.callbacks.onTriggerTask(selectEl.value);
    });

    this.container.querySelector('#btn-trigger-success')?.addEventListener('click', () => {
      this.callbacks.onTriggerSuccess(selectEl.value);
    });

    this.container.querySelector('#btn-trigger-error')?.addEventListener('click', () => {
      this.callbacks.onTriggerError(selectEl.value);
    });

    this.container.querySelector('#btn-toggle-zoom')?.addEventListener('click', () => {
      this.callbacks.onToggleZoom();
    });
  }
}
