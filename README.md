# CBCT - CodeBase Cartographic Tool

> Transform your codebase from a text forest into a navigable landscape.

**CBCT** is a cognitive-first software visualization system designed to help developers understand, reason about, and reflect on the structure of a codebase.

## 🎯 Core Philosophy

- **Thinking-First Design** — Cognitive clarity over automation
- **Observational, Not Prescriptive** — Describes what exists, never what should be done
- **Silent by Default** — No alerts, popups, or interruptions
- **Exploration-Driven** — Understanding is discovered
- **Respect for Developer Intelligence** — No oversimplification

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd cbct

# Install all dependencies
npm install

# Start development servers (both client & server)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
cbct/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API client
│   │   ├── store/          # Zustand state management
│   │   └── App.jsx         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Server entry
│   └── package.json
└── package.json            # Workspace root
```

## 🗺️ Features

### View Modes

1. **Dependencies** - Visualize file imports and connections
2. **Complexity** - See code density and size distribution
3. **Centrality** - Identify hub modules and architectural gravity

### Services Provided

- **Structural Awareness** - What modules exist? How are they connected?
- **Cognitive Onboarding** - Where should I start? What matters most?
- **Architectural Intuition** - Notice tight coupling, hub modules, chokepoints
- **Shared Understanding** - Neutral visual reference for team discussions

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- react-force-graph-2d (D3-based graph visualization)
- Zustand (state management)
- Lucide React (icons)

**Backend:**
- Node.js
- Express
- glob (file discovery)
- simple-git (Git integration)

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/repository/scan` | POST | Scan a repository |
| `/api/repository/tree` | GET | Get file tree structure |
| `/api/analysis/dependencies` | POST | Analyze file dependencies |
| `/api/analysis/complexity` | POST | Analyze code complexity |
| `/api/analysis/centrality` | POST | Analyze module centrality |
| `/api/analysis/insights/:nodeId` | GET | Get insights for a specific node |

## 🎨 Design Principles

CBCT follows strict interaction invariants:

- No insight is shown without explicit user intent
- All insights are descriptive, short, contextual, and non-judgmental
- The UI remains passive until engaged
- AI (when added) functions strictly as a pattern narrator

## 🔮 Roadmap

**V1 (Current)**
- Single-language support (JavaScript/TypeScript)
- Static and live mapping
- Hover-based insights
- Read-only visualization

**Future**
- Multi-language adapters
- Drift timelines
- Shared maps
- Learning modes

## 📝 Core Identity

> CBCT exists to help developers think clearly before they write confident code—by revealing what their system is, not telling them what it should be.

---

**Clear thinking precedes confident code.**
