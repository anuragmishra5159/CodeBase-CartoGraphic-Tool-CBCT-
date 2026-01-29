# CBCT Semantic Layer - Quick Reference

## 🎯 What is the Semantic Layer?

The Semantic Layer Engine automatically adapts graph visualization based on repository size while maintaining a **consistent user experience**. Users always interact with "units" - the system handles whether those are files, folders, or semantic clusters behind the scenes.

---

## 📊 The 4 Layers

| Layer | Zoom | Purpose | What You See |
|-------|------|---------|--------------|
| **1. Orientation** | < 0.5 | Overview | Top 20 units, key components |
| **2. Structural** | 0.5-1.2 | Structure | Expanded details, connections |
| **3. Impact & Risk** | 1.2-2.0 | Impact | Dependencies, risk indicators |
| **4. Detail** | Action | Deep dive | Full file-level detail |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Restore previous state / Exit focus |
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `C` | Center view |

---

## 🔧 API Endpoints

### Get Graph with Semantic Layers
```bash
POST /api/analysis/dependencies
{
  "path": "/path/to/repo",
  "language": "javascript"
}
```

**Response**:
```json
{
  "nodes": [...],           // Semantic units (not raw files)
  "edges": [...],           // Unit-level dependencies
  "metadata": {
    "totalUnits": 150,
    "visibleUnits": 20,
    "revealDepth": 3,
    "maxNodes": 300
  }
}
```

---

### Expand a Unit
```bash
POST /api/analysis/expand
{
  "path": "/path/to/repo",
  "unitId": "folder:src",
  "depth": 1
}
```

**Response**:
```json
{
  "nodes": [...],           // Internal nodes
  "edges": [...]            // Internal edges
}
```

---

### Get Impact Chain
```bash
POST /api/analysis/impact
{
  "path": "/path/to/repo",
  "unitId": "folder:src"
}
```

**Response**:
```json
{
  "unitId": "folder:src",
  "upstream": ["unit1", "unit2"],      // Dependencies
  "downstream": ["unit3", "unit4"],    // Dependents
  "riskIndicators": [
    {
      "type": "high-impact",
      "severity": "warning",
      "message": "Changes affect 15 units"
    }
  ],
  "totalImpact": 19
}
```

---

## 🎨 Client Usage

### Basic Setup
```javascript
import { useStore } from './store/useStore';

function MyComponent() {
  const { 
    setRepositoryPath, 
    graphData, 
    semanticLayer 
  } = useStore();

  // Analyze repository
  await setRepositoryPath('/path/to/repo');
  
  // Current layer (1-4)
  console.log(semanticLayer.currentLayer);
  
  // Units shown
  console.log(graphData.nodes.length);
}
```

---

### Expand a Unit
```javascript
const { expandUnit } = useStore();

const handleExpand = async (unit) => {
  const expanded = await expandUnit(unit);
  // Returns { nodes, edges } for unit internals
  // Auto-transitions to Layer 2
};
```

---

### View Impact
```javascript
const { getUnitImpact } = useStore();

const handleImpact = async (unit) => {
  const impact = await getUnitImpact(unit);
  // Returns impact chain with risk indicators
  // Auto-transitions to Layer 3
};
```

---

### Restore Previous State
```javascript
const { restorePreviousState } = useStore();

// User presses Escape or clicks background
restorePreviousState();
```

---

## 🧪 Testing Checklist

### Small Repo (< 80 files)
- [ ] Units are individual files
- [ ] All files visible (up to 20)
- [ ] Fast performance

### Medium Repo (80-500 files)
- [ ] Units are folders
- [ ] Top 20 folders shown
- [ ] Expansion shows files in folder

### Large Repo (≥ 500 files)
- [ ] Units are semantic clusters
- [ ] Top 20 clusters shown
- [ ] Optimized performance

### Layer Transitions
- [ ] Zoom out → Layer 1
- [ ] Normal zoom → Layer 2
- [ ] Zoom in → Layer 3
- [ ] Click unit → Focus + Layer 2
- [ ] Trace impact → Layer 3
- [ ] Escape → Restore previous

---

## 🎯 Unit Roles

The system automatically identifies unit roles:

| Role | Description | Badge |
|------|-------------|-------|
| **Core Dependency** | Many units depend on this | 🟡 High Impact |
| **Integration Point** | Connects many parts | 🔵 Hub |
| **Entry Point** | No incoming dependencies | 🟢 Entry |
| **Leaf Unit** | End of dependency chain | 🔵 Safe to Modify |
| **Isolated** | No dependencies | ⚪ Isolated |

---

## 🚨 Risk Indicators

| Type | Severity | Meaning |
|------|----------|---------|
| **High Impact** | ⚠️ Warning | Changes affect many units |
| **High Dependency** | ℹ️ Info | Depends on many units |
| **Circular Dependency** | 🔴 Error | Circular dependency detected |

---

## 📏 Safety Limits

```javascript
MAX_INITIAL_UNITS = 20      // Layer 1 limit
MAX_VISIBLE_NODES = 300     // Total nodes cap
MAX_DETAIL_NODES = 150      // Expansion limit
```

These limits ensure the UI remains responsive even for massive repositories.

---

## 🔍 Adaptive Unit Selection

| Repo Size | Unit Type | Example |
|-----------|-----------|---------|
| < 80 files | File | `Button.jsx` |
| 80-500 files | Folder | `components/` |
| ≥ 500 files | Cluster | `Module 1` |

**Remember**: Users never see these categories! Always use "unit" in the UI.

---

## 💡 Best Practices

### ✅ DO
- Use "unit" terminology consistently
- Let zoom control layer transitions
- Cache expanded units
- Show risk indicators prominently
- Provide Escape key to reset

### ❌ DON'T
- Expose file/folder/cluster terminology
- Show different UI for different repo sizes
- Bypass semantic layer processing
- Exceed safety limits
- Break zoom-to-layer mapping

---

## 📚 Full Documentation

For complete details, see:
- [SEMANTIC_LAYER_GUIDE.md](./SEMANTIC_LAYER_GUIDE.md) - Complete guide
- [semanticLayerEngine.js](./server/src/services/semanticLayerEngine.js) - Engine code
- [GraphCanvas.jsx](./client/src/components/GraphCanvas.jsx) - Visualization
- [useStore.js](./client/src/store/useStore.js) - State management

---

**Quick Start**: `npm run dev` → Open http://localhost:3000 → Enter repo path → Explore!
