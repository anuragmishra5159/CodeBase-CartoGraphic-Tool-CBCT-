# Core Experience Features (F0 & F1) - Implementation Guide

## Overview

This document describes the implementation of two core features that define CBCT (CodeBase Cartographic Tool):

- **F0: Repository Structural Extraction** - Parses entire repository and builds the truth layer
- **F1: Global Dependency Graph** - Maintains a single, authoritative graph of all dependencies

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Application Layer (Client - React/Vite)                │
├─────────────────────────────────────────────────────────┤
│  API Layer (Express Routes - /api/graph/*)              │
├─────────────────────────────────────────────────────────┤
│  F1: Global Dependency Graph Service                    │
│  - Maintains single graph instance                      │
│  - Provides stable node identity                        │
│  - Supports recomputation                               │
│  - All visual features use graph projections            │
├─────────────────────────────────────────────────────────┤
│  F0: Structural Extraction Service                      │
│  - Parse files without configuration                    │
│  - Build nodes (files/modules)                          │
│  - Build edges (dependencies)                           │
│  - This is the truth layer (never exposed directly)     │
├─────────────────────────────────────────────────────────┤
│  Low-Level Utilities                                    │
│  - File parsing (JS, TS, Python, etc.)                  │
│  - Import resolution                                    │
│  - Path normalization                                   │
└─────────────────────────────────────────────────────────┘
```

## F0: Repository Structural Extraction

### Purpose
F0 provides the **truth layer** - a complete, unbiased representation of the repository structure without configuration, annotations, or assumptions.

### Key Components

#### `structuralExtraction.js`

**Main Function: `extractRepositoryStructure(repoPath)`**

Extracts all code files and creates node objects:

```javascript
{
  nodes: [
    {
      id: "node_0",                    // Stable identifier
      path: "/full/path/to/file.js",   // Absolute path (truth)
      relativePath: "src/file.js",     // Relative to repo
      name: "file.js",
      directory: "src",
      extension: ".js",
      language: "javascript",
      type: "component",               // Auto-detected
      metadata: {
        size: 1024,                    // bytes
        lines: 45,
        createdAt: "2024-01-22T..."
      }
    }
  ],
  nodeMap: Map,                        // Internal lookup
  metadata: {
    timestamp: "...",
    repoPath: "...",
    fileCount: 42,
    languages: ["javascript", "typescript"],
    types: ["component", "service", "utility", ...]
  }
}
```

### Supported Languages

- JavaScript/TypeScript (JS, JSX, TS, TSX, MJS, CJS)
- Python (PY, PYI)
- Java (JAVA)
- Kotlin (KT, KTS)
- Go (GO)
- Rust (RS)
- Ruby (RB)
- PHP (PHP)
- Swift (SWIFT)
- C/C++ (C, CPP, H, HPP)
- C# (CS)
- Vue/Svelte (VUE, SVELTE)
- CSS/SCSS/LESS
- JSON/YAML/XML
- HTML

### File Type Detection

Files are automatically categorized:

- **component** - UI components (React, Vue, etc.)
- **service** - Services, API handlers, middleware
- **utility** - Helper, utility, common functions
- **hook** - React hooks
- **route** - Routing files
- **model** - Data models, schemas, types
- **config** - Configuration files
- **test** - Test files
- **entry** - Entry points (index, main)
- **style** - Stylesheets
- **module** - Generic modules

### Import Resolution

Supports extracting imports from:

**JavaScript/TypeScript:**
- CommonJS: `require('./path')`
- ES6: `import { x } from './path'`
- Dynamic: `import('./path')`

**Python:**
- `import module`
- `from module import x`

**Limitations:**
- External packages (node_modules) are skipped
- Conditional imports may be missed
- Dynamic/string-based imports not fully resolved

## F1: Global Dependency Graph

### Purpose
F1 maintains a **single, authoritative graph** of the entire repository. It:
- Provides stable node identity across scans
- Supports recomputation as repository changes
- Serves as the foundation for all visual features
- Only graph projections are exposed to UI

### Key Components

#### `globalDependencyGraph.js`

**Main Class: `GlobalDependencyGraph`**

```javascript
const graph = new GlobalDependencyGraph(repoPath);
await graph.buildGraph();
```

### Graph Structure

```javascript
{
  nodes: [...],                // From F0
  edges: [
    {
      source: "node_0",        // Source node ID
      target: "node_3",        // Target node ID
      type: "import",          // Dependency type
      metadata: {
        createdAt: "..."
      }
    }
  ],
  metadata: {
    repoPath: "...",
    nodeCount: 42,
    edgeCount: 156,
    timestamp: "...",
    buildTime: 1234,           // milliseconds
    status: "success"
  }
}
```

### API Methods

#### Node Access
- `getNode(nodeId)` - Get node by ID
- `getNodeByPath(filePath)` - Get node by file path
- `getNodesByType(type)` - Filter nodes by type
- `getNodesByLanguage(language)` - Filter nodes by language

#### Dependency Traversal
- `getDependencies(nodeId)` - Immediate dependencies
- `getDependents(nodeId)` - Nodes that depend on this
- `getTransitiveDependencies(nodeId)` - All reachable nodes
- `getEdgesForNode(nodeId)` - All connected edges

#### Graph Metrics
- `getInDegree(nodeId)` - Number of dependents
- `getOutDegree(nodeId)` - Number of dependencies
- `getMostUsedNodes(limit)` - Most depended-upon files
- `getMostDependentNodes(limit)` - Files with most dependencies
- `findCircularDependencies()` - Detect cycles

#### Management
- `buildGraph()` - Build/rebuild graph
- `recompute()` - Recompute for changed repo
- `getStats()` - Graph statistics
- `exportToJSON()` - Export full graph
- `getMemoryStats()` - Memory usage

### Graph Caching

Global instances are cached:

```javascript
const graph = await getOrCreateGraph(repoPath);
// Next call returns cached instance
const graph2 = await getOrCreateGraph(repoPath);
// graph === graph2
```

Invalidate cache when repo changes:
```javascript
invalidateGraph(repoPath);
// Next getOrCreateGraph will rebuild
```

## API Endpoints

All endpoints use the graph as the foundation.

### Graph Building & Management

**POST /api/graph/build**
- Build global graph for repository
- Body: `{ path: "/repo/path" }`
- Returns: Full graph + statistics

**POST /api/graph/get**
- Get existing graph
- Body: `{ path: "/repo/path" }`
- Returns: Full graph + statistics

**POST /api/graph/recompute**
- Recompute graph (after repo changes)
- Body: `{ path: "/repo/path" }`
- Returns: Updated graph + statistics

### Node Information

**GET /api/graph/node/:nodeId**
- Get detailed node information
- Query: `?path=/repo/path`
- Returns: Node + connections + degrees

**GET /api/graph/nodes/type/:type**
- Get all nodes of a type
- Query: `?path=/repo/path`
- Returns: Filtered nodes

**GET /api/graph/nodes/language/:language**
- Get all nodes of a language
- Query: `?path=/repo/path`
- Returns: Filtered nodes

### Analysis

**GET /api/graph/analysis/most-used**
- Most depended-upon nodes
- Query: `?path=/repo/path&limit=10`
- Returns: Ranked nodes with degrees

**GET /api/graph/analysis/most-dependent**
- Nodes with most dependencies
- Query: `?path=/repo/path&limit=10`
- Returns: Ranked nodes with degrees

**GET /api/graph/analysis/cycles**
- Find circular dependencies
- Query: `?path=/repo/path`
- Returns: List of cycles

### Statistics & Export

**GET /api/graph/stats**
- Graph statistics
- Query: `?path=/repo/path`
- Returns: Comprehensive metrics

**GET /api/graph/export**
- Export full graph as JSON
- Query: `?path=/repo/path`
- Returns: Versioned export data

## Client Integration

### API Methods

```javascript
import { api } from './services/api';

// Build graph
const result = await api.buildGlobalGraph(repoPath);

// Get graph
const graph = await api.getGlobalGraph(repoPath);

// Node analysis
const node = await api.getNodeFromGraph(repoPath, nodeId);
const inDegree = node.inDegree;
const outDegree = node.outDegree;

// Graph analysis
const mostUsed = await api.getMostUsedNodes(repoPath, 10);
const mostDependent = await api.getMostDependentNodes(repoPath, 10);
const cycles = await api.findCircularDependencies(repoPath);

// Statistics
const stats = await api.getGraphStats(repoPath);
```

### React Hook Integration

Use the graph data in React components via Zustand store:

```javascript
const { graphData } = useStore();
// graphData contains F1 graph
```

## Usage Workflow

### Initial Setup

```
1. User selects repository
   ↓
2. Scan repository (existing feature)
   ↓
3. POST /api/graph/build
   ↓
4. F0: Extract structure (all files, no config)
   ↓
5. F1: Build global graph (dependencies)
   ↓
6. Cache graph instance
   ↓
7. Return to client
```

### During Visualization

```
1. User interacts with graph
   ↓
2. Get projection from F1
   ↓
3. Apply filters/views
   ↓
4. Render to GraphCanvas
```

### After Repository Changes

```
1. Invalidate cached graph: invalidateGraph(repoPath)
   ↓
2. User triggers recompute
   ↓
3. POST /api/graph/recompute
   ↓
4. F0 & F1 rebuild
   ↓
5. Cache updated
```

## Performance Considerations

### Build Time
- ~50-500ms for small repos (<100 files)
- ~500-5000ms for medium repos (100-1000 files)
- ~5-30s for large repos (1000+ files)

### Memory Usage
- Depends on file count and edge density
- Use `getMemoryStats()` for monitoring
- Graph is cached to avoid recomputation

### Optimization Tips
1. Ignore node_modules, .git, etc. (built-in)
2. Cache graph instances
3. Use filters for large graphs
4. Recompute only when needed

## Examples

### Find Unused Modules

```javascript
const graph = await getOrCreateGraph(repoPath);
const nodes = graph.graph.nodes;
const orphans = nodes.filter(node => {
  return graph.getInDegree(node.id) === 0 && 
         graph.getOutDegree(node.id) === 0;
});
console.log('Unused modules:', orphans);
```

### Detect Bottleneck Files

```javascript
const mostUsed = graph.getMostUsedNodes(5);
// Files that many modules depend on
console.log('Bottleneck modules:', mostUsed);
```

### Find Circular Dependencies

```javascript
const cycles = graph.findCircularDependencies();
// Arrays of node paths forming cycles
cycles.forEach(cycle => {
  console.log('Circular:', cycle.join(' -> '));
});
```

### Analyze Module Impact

```javascript
const node = graph.getNode(nodeId);
const transitive = graph.getTransitiveDependencies(nodeId);
// All files that depend on this (directly or indirectly)
console.log(`${transitive.length} modules depend on ${node.name}`);
```

## Future Enhancements

1. **Incremental Updates** - Update only changed files
2. **Weighted Edges** - Track import frequency
3. **Cross-Module Analysis** - Detect coupling
4. **Performance Optimization** - Worker threads for large repos
5. **Persist Graph** - Save to disk for instant load
6. **Graph Versioning** - Track changes over time

## Notes

- F0 is the **truth layer** - never directly exposed to UI
- F1 is the **single source of truth** - all features derive from it
- Stable node IDs (`node_0`, `node_1`, ...) persist across scans
- Graph paths are normalized to forward slashes
- Import resolution respects repo boundaries (no escape)
- Configuration-free - works with any language structure
