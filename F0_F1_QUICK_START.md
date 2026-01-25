# F0 & F1 Quick Start Guide

## Installation

All dependencies are already included. The new features don't require any additional packages.

### Running the Project

```bash
# From root directory
npm run dev

# This starts both:
# - Server on http://localhost:5000
# - Client on http://localhost:5173 (or Vite's port)
```

## Basic Usage

### 1. Build the Global Graph

```javascript
// From client
import { api } from './services/api';

const repoPath = '/path/to/your/repo';
const result = await api.buildGlobalGraph(repoPath);

console.log('Graph built!');
console.log('Nodes:', result.data.nodes.length);
console.log('Edges:', result.data.edges.length);
console.log('Time taken:', result.stats.buildTime, 'ms');
```

### 2. Get Graph Statistics

```javascript
const stats = await api.getGraphStats(repoPath);

console.log('Statistics:');
console.log('- Files:', stats.stats.nodeCount);
console.log('- Dependencies:', stats.stats.edgeCount);
console.log('- Languages:', Object.keys(stats.stats.languages));
console.log('- File types:', Object.keys(stats.stats.types));
console.log('- Circular dependencies:', stats.stats.cyclesDetected);
```

### 3. Analyze a Specific File

```javascript
const nodeInfo = await api.getNodeFromGraph(repoPath, 'node_0');

console.log('File:', nodeInfo.node.path);
console.log('Type:', nodeInfo.node.type);
console.log('Language:', nodeInfo.node.language);
console.log('Dependents:', nodeInfo.inDegree);
console.log('Dependencies:', nodeInfo.outDegree);
console.log('Files that depend on it:', nodeInfo.dependents);
console.log('Files it depends on:', nodeInfo.dependencies);
```

### 4. Find Critical Files

```javascript
// Most used files (highest in-degree)
const mostUsed = await api.getMostUsedNodes(repoPath, 10);
console.log('Most critical files:');
mostUsed.nodes.forEach(node => {
  console.log(`- ${node.name}: used by ${node.inDegree} files`);
});

// Files with most dependencies (highest out-degree)
const mostDependent = await api.getMostDependentNodes(repoPath, 10);
console.log('\nMost dependent files:');
mostDependent.nodes.forEach(node => {
  console.log(`- ${node.name}: depends on ${node.outDegree} files`);
});
```

### 5. Detect Circular Dependencies

```javascript
const cycles = await api.findCircularDependencies(repoPath);

if (cycles.cycles.length > 0) {
  console.log('⚠️  Found circular dependencies:');
  cycles.cycles.forEach((cycle, i) => {
    console.log(`\nCycle ${i + 1}:`);
    console.log(cycle.join(' ↓ '));
  });
} else {
  console.log('✅ No circular dependencies found!');
}
```

## API Reference Quick Guide

### Graph Building
- **POST** `/api/graph/build` - Build graph
- **POST** `/api/graph/get` - Get existing graph
- **POST** `/api/graph/recompute` - Rebuild graph

### Node Queries
- **GET** `/api/graph/node/:nodeId` - Get node details
- **GET** `/api/graph/nodes/type/:type` - Filter by type
- **GET** `/api/graph/nodes/language/:language` - Filter by language

### Analysis
- **GET** `/api/graph/analysis/most-used` - Most depended-upon files
- **GET** `/api/graph/analysis/most-dependent` - Files with most dependencies
- **GET** `/api/graph/analysis/cycles` - Circular dependencies

### Utilities
- **GET** `/api/graph/stats` - Statistics
- **GET** `/api/graph/export` - Export as JSON
- **GET** `/api/graph/health` - Service status

## Key Concepts

### Stable Node Identity
Nodes keep the same ID (`node_0`, `node_1`, etc.) across multiple scans:

```javascript
// Scan 1
const graph1 = await api.buildGlobalGraph(repoPath);
const node0_first = graph1.data.nodes[0]; // node_0

// After repo changes
// Scan 2
const graph2 = await api.buildGlobalGraph(repoPath);
const node0_second = graph2.data.nodes[0]; // Still node_0 if it's the same file

// Safe to track nodes across scans!
```

### In-Degree vs Out-Degree

- **In-Degree**: How many files depend on this file
  - High = "core utility" or "critical infrastructure"
  - Low = "specialized/isolated module"

- **Out-Degree**: How many files this file depends on
  - High = "orchestrator" or "coordinator"
  - Low = "leaf node" with few dependencies

### Circular Dependencies

When A → B → C → A, the cycle is: `[A, B, C, A]`

Issues to watch for:
- Breaks tree structure assumptions
- Makes refactoring harder
- Can cause runtime issues in bundlers

## Examples

### Express Integration

```javascript
// server/routes/analysis.js
router.post('/graph-report', async (req, res) => {
  const { path } = req.body;
  
  const [
    graphData,
    stats,
    mostUsed,
    cycles
  ] = await Promise.all([
    getOrCreateGraph(path).then(g => g.getGraph()),
    api.getGraphStats(path),
    api.getMostUsedNodes(path, 5),
    api.findCircularDependencies(path)
  ]);
  
  res.json({
    summary: {
      files: stats.stats.nodeCount,
      dependencies: stats.stats.edgeCount,
    },
    criticalFiles: mostUsed.nodes,
    issues: cycles.cycles,
  });
});
```

### React Component

```jsx
// client/src/components/GraphReport.jsx
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function GraphReport({ repoPath }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const stats = await api.getGraphStats(repoPath);
        const mostUsed = await api.getMostUsedNodes(repoPath, 5);
        const cycles = await api.findCircularDependencies(repoPath);
        
        setReport({
          stats: stats.stats,
          mostUsed: mostUsed.nodes,
          cycles: cycles.cycles,
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadReport();
  }, [repoPath]);

  if (loading) return <div>Loading...</div>;
  if (!report) return <div>No data</div>;

  return (
    <div className="p-4">
      <h2>Repository Analysis</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="text-2xl font-bold">{report.stats.nodeCount}</div>
          <div className="text-gray-600">Files</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold">{report.stats.edgeCount}</div>
          <div className="text-gray-600">Dependencies</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold">{report.cycles.length}</div>
          <div className="text-gray-600">Cycles</div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold">Most Critical Files</h3>
        {report.mostUsed.map(node => (
          <div key={node.id} className="flex justify-between p-2">
            <span>{node.name}</span>
            <span className="text-gray-600">{node.inDegree} dependents</span>
          </div>
        ))}
      </div>

      {report.cycles.length > 0 && (
        <div className="mt-8 p-4 bg-red-50 rounded">
          <h3 className="text-lg font-bold text-red-700">⚠️ Circular Dependencies</h3>
          {report.cycles.map((cycle, i) => (
            <div key={i} className="mt-2 font-mono text-sm">
              {cycle.join(' → ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Graph takes too long to build
- **Check file count**: `stats.nodeCount` might be very high
- **Check ignore patterns**: node_modules, dist, etc. should be ignored
- **Large repos**: May need 10-30 seconds for repos with 1000+ files

### Memory usage too high
- Use `getMemoryStats()` to check usage
- For very large repos, consider breaking into sub-graphs
- The graph is cached - rebuild only when necessary

### Missing dependencies
- Import resolution may not catch all patterns
- Dynamic imports (`import(variable)`) are not fully supported
- Comments or special syntax might hide imports

### Circular dependencies not found
- Only detects actual cycles in parsed imports
- Indirect cycles (A→B→C→A) are detected
- Runtime-only cycles may be missed

## Next Steps

1. **Display in UI**: Use graph data in GraphCanvas component
2. **Add filters**: Filter by language, type, size
3. **Interactive analysis**: Click nodes to explore dependencies
4. **Metrics dashboard**: Show complexity, coupling metrics
5. **Export reports**: CSV, JSON, PDF of analysis

---

Need help? Check `FEATURES_F0_F1.md` for comprehensive documentation.
