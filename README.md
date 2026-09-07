# ROBO-OFFICE: Multi-Agent Pixel Art Spatial Visualiser

Lightweight, role-based 2D top-down / isometric pixel art workspace and telemetry visualizer for autonomous AI agent pipelines.

![Robo-Office Workspace](/assets/background.png)

## Overview & Concept

`robo-office-visualiser` renders a cozy miniature robot workshop where each autonomous agent is represented as a chibi robot occupying a dedicated workstation based on their role (`Server`, `Frontend`, `OCModule`, `Design`, `Orchestrator`).

Workstations feature props matching real engineering responsibilities, connected via a central conveyor pipeline, dynamic LED visors, battery charging docks, and a glassmorphism HUD overlay.

---

## System Architecture

```
[ AI Agents (OpenCode / LangGraph / CrewAI / AutoGen) ]
                     |
                     v (JSON events via WebSocket / SSE / HTTP)
       [ EventBridge (Local Gateway / Port 5173) ]
                     |
       +-------------+-------------+
       |                           |
       v                           v
[ Canvas 2D Renderer ]     [ HUD Telemetry Overlay ]
(480x270 pixel-perfect)     (Glassmorphism Stats & Log)
       |                           |
       +-------------+-------------+
                     |
                     v
  [ Browser Window / OpenCode Visualiser Tab ]
```

---

## Quick Start Guide

### 1. Standalone Development

```bash
# Clone and install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser. Mock telemetry runs automatically if no live backend is detected, cycling all 5 agent roles through working, researching, success, and idle states.

### 2. Build for Production

```bash
npm run build
npm run preview
```

Total build footprint is ~65 KB total assets (JS + CSS + Spritesheets), well within the 1 MB budget.

### 3. OpenCode Plugin Setup

Include `robo-office-visualiser` in your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["robo-office-visualiser"]
}
```

---

## Customization

### Adding or Modifying Roles

Edit `src/world/WorkshopLayout.ts`:

```typescript
export const WORKSTATIONS: Record<AgentRole, WorkstationDef> = {
  server: {
    gridPos: { x: 1, y: 1 },
    pixelPos: { x: 44, y: 88 },
    props: ['server-rack', 'cooling-fan', 'ethernet-cables', 'log-monitor'],
    ledColor: '#0ea5e9',
    activityIndicator: 'terminal-scroll',
  },
  // Add new workstation definitions here
};
```

### Palette Swapping

Edit `src/core/SpriteSystem.ts`:

```typescript
export const PALETTE_MAPS = {
  server:       { primary: '#2563eb', accent: '#60a5fa', visor: '#0ea5e9' },
  frontend:     { primary: '#f97316', accent: '#fb923c', visor: '#f59e0b' },
  ocmodule:     { primary: '#8b5cf6', accent: '#a78bfa', visor: '#c084fc' },
  design:       { primary: '#ec4899', accent: '#f472b6', visor: '#fb7185' },
  orchestrator: { primary: '#10b981', accent: '#34d399', visor: '#6ee7b7' },
};
```

---

## Integration Examples

### LangGraph (Python)

```python
import asyncio
import json
import websockets

async def emit_agent_state(agent_id, role, state, task):
    uri = "ws://localhost:5173/ws"
    async with websockets.connect(uri) as websocket:
        payload = {
            "timestamp": int(asyncio.get_event_loop().time() * 1000),
            "agent_id": agent_id,
            "role": role,
            "state": state,
            "task_summary": task,
            "metrics": {
                "tokens_used": 340,
                "latency_ms": 78
            }
        }
        await websocket.send(json.dumps(payload))
```

### CrewAI / AutoGen (Python)

```python
import requests

def notify_visualiser(role, state, task):
    url = "http://localhost:5173/events"
    payload = {
        "timestamp": 1725760000,
        "agent_id": f"crew_{role}",
        "role": role,
        "state": state,
        "task_summary": task
    }
    requests.post(url, json=payload, timeout=2)
```

---

## Performance Benchmarks

| Metric | Target | Measured |
| :--- | :--- | :--- |
| **Total Asset Size** | < 1 MB | 65.2 KB |
| **Internal Resolution** | 480x270 | 480x270 (CSS 2x/3x) |
| **Canvas Frame Rate** | 30 FPS | 30 FPS solid |
| **Idle CPU Usage** | < 1% | ~0.4% |
| **RAM Footprint** | < 50 MB | ~32 MB |

---

## License

MIT License. Free for open source and commercial agent instrumentation.
