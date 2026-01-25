# F0 & F1 Testing Guide

Complete testing instructions for validating the F0 and F1 implementation.

## Quick Start Testing (5 minutes)

### 1. Start the Server
```bash
cd server
npm install
npm run dev
# Should see: "🗺️  CBCT Server running on port 5000"
```

### 2. Test Health Endpoints
```bash
# In another terminal
curl http://localhost:5000/api/health
# Should return: {"status":"ok","message":"CBCT Server is running"}

curl http://localhost:5000/api/graph/health
# Should return graph service status
```

### 3. Test Graph Build
```bash
# Use your project root as test repo
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/your/repo"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...],
    "metadata": {
      "nodeCount": 42,
      "edgeCount": 156,
      ...
    }
  },
  "stats": {
    "nodeCount": 42,
    "edgeCount": 156,
    ...
  }
}
```

## Detailed Testing

### Test 1: Repository Structure Extraction (F0)

```bash
# Build graph for a small test repo
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/small/repo"}'

# Verify response structure
# Should have:
# - success: true
# - data.nodes: array of file objects
# - data.edges: array of dependency objects
# - stats: analysis results
```

**Expected node properties:**
```javascript
{
  id: "node_0",
  path: "/full/path/to/file.js",
  relativePath: "src/file.js",
  name: "file.js",
  directory: "src",
  extension: ".js",
  language: "javascript",
  type: "component",
  metadata: {
    size: 1024,
    lines: 45,
    createdAt: "2024-01-22T..."
  }
}
```

**Validation checklist:**
- [ ] All nodes have unique IDs
- [ ] All nodes have valid paths
- [ ] File extensions are correct
- [ ] Languages are correctly detected
- [ ] File types are appropriately classified
- [ ] Metadata (size, lines) is populated

### Test 2: Global Dependency Graph (F1)

```bash
# Get the graph
curl -X POST http://localhost:5000/api/graph/get \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/repo"}'

# Verify edges exist
# Check response data.edges array
```

**Expected edge properties:**
```javascript
{
  source: "node_0",
  target: "node_3",
  type: "import",
  metadata: {
    createdAt: "..."
  }
}
```

**Validation checklist:**
- [ ] All edges reference existing nodes
- [ ] No self-referential edges (source !== target)
- [ ] Edge types are correct
- [ ] Edge count > 0 (for repos with dependencies)

### Test 3: Node Analysis

```bash
# Get details of first node (adjust nodeId as needed)
curl "http://localhost:5000/api/graph/node/node_0?path=/path/to/repo"
```

**Expected response:**
```javascript
{
  success: true,
  node: {...},
  edges: {
    incoming: [...],
    outgoing: [...]
  },
  dependencies: [...],
  dependents: [...],
  transitiveDependencies: [...],
  inDegree: 3,
  outDegree: 2
}
```

**Validation checklist:**
- [ ] Node details are correct
- [ ] In-degree and out-degree match edge counts
- [ ] Dependencies list matches outgoing edges
- [ ] Dependents list matches incoming edges
- [ ] Transitive dependencies calculated correctly

### Test 4: Type/Language Filtering

```bash
# Get all components
curl "http://localhost:5000/api/graph/nodes/type/component?path=/path/to/repo"

# Get all JavaScript files
curl "http://localhost:5000/api/graph/nodes/language/javascript?path=/path/to/repo"

# Get all TypeScript files
curl "http://localhost:5000/api/graph/nodes/language/typescript?path=/path/to/repo"
```

**Validation checklist:**
- [ ] Returned nodes match requested type
- [ ] Returned nodes match requested language
- [ ] Count is reasonable
- [ ] All returned nodes have correct type/language

### Test 5: Critical File Analysis

```bash
# Get most used nodes (highest in-degree)
curl "http://localhost:5000/api/graph/analysis/most-used?path=/path/to/repo&limit=5"

# Get most dependent nodes (highest out-degree)
curl "http://localhost:5000/api/graph/analysis/most-dependent?path=/path/to/repo&limit=5"
```

**Expected response:**
```javascript
{
  success: true,
  analysis: "most-used-nodes",
  count: 5,
  nodes: [
    {
      ...node,
      inDegree: 45  // or outDegree for dependent
    },
    ...
  ]
}
```

**Validation checklist:**
- [ ] Results are sorted by degree (descending)
- [ ] Limit is respected (max 5 returned)
- [ ] Degrees are accurate
- [ ] Files make sense as critical

### Test 6: Circular Dependency Detection

```bash
# Find cycles
curl "http://localhost:5000/api/graph/analysis/cycles?path=/path/to/repo"
```

**Expected response:**
```javascript
{
  success: true,
  analysis: "circular-dependencies",
  cycleCount: 0,  // or > 0 if cycles exist
  cycles: [
    ["path/to/fileA.js", "path/to/fileB.js", "path/to/fileA.js"]
  ]
}
```

**Validation checklist:**
- [ ] cycleCount matches cycles array length
- [ ] Each cycle forms a valid loop
- [ ] Files in cycles actually exist
- [ ] No duplicate cycles

### Test 7: Statistics

```bash
# Get comprehensive statistics
curl "http://localhost:5000/api/graph/stats?path=/path/to/repo"
```

**Expected response:**
```javascript
{
  success: true,
  stats: {
    nodeCount: 42,
    edgeCount: 156,
    languages: {
      javascript: 25,
      typescript: 15,
      css: 2
    },
    types: {
      component: 15,
      service: 8,
      utility: 12,
      ...
    },
    totalLines: 12543,
    totalSize: 524288,
    averageInDegree: 3.71,
    averageOutDegree: 3.71,
    maxInDegree: 25,
    maxOutDegree: 8,
    orphanNodes: 2,
    cyclesDetected: 0,
    memory: {
      nodeMemoryBytes: 12345,
      edgeMemoryBytes: 8765,
      totalMemoryBytes: 21110,
      estimatedKB: 21
    }
  }
}
```

**Validation checklist:**
- [ ] nodeCount > 0
- [ ] edgeCount >= 0
- [ ] languages dict populated
- [ ] types dict populated
- [ ] totalLines >= nodeCount
- [ ] totalSize > 0
- [ ] averages are reasonable
- [ ] Max degrees >= averages
- [ ] orphanNodes <= nodeCount
- [ ] Memory stats are positive

### Test 8: Graph Export

```bash
# Export full graph
curl "http://localhost:5000/api/graph/export?path=/path/to/repo" > graph.json

# Verify it's valid JSON
cat graph.json | jq .
```

**Validation checklist:**
- [ ] Valid JSON format
- [ ] Contains version
- [ ] Contains timestamp
- [ ] Contains full graph (nodes + edges)
- [ ] Contains stats
- [ ] File size is reasonable

## Performance Testing

### Small Repository (10-50 files)

```bash
time curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/small/repo"}'

# Expected: < 500ms
```

### Medium Repository (100-500 files)

```bash
time curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/medium/repo"}'

# Expected: 1-2 seconds
```

### Large Repository (1000+ files)

```bash
time curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/large/repo"}'

# Expected: 5-30 seconds (depending on size)
```

### Memory Monitoring

```bash
# Check memory before
free -h

# Build large graph
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/large/repo"}'

# Check memory after
free -h

# Expected increase: < 50MB for most repos
```

## Browser Testing

### 1. Browser Console Tests

Open your React app in browser and open console (F12).

```javascript
// Test API import
import { api } from './services/api';

// Test buildGlobalGraph
const result = await api.buildGlobalGraph('/path/to/repo');
console.log('Build result:', result);
console.log('Nodes:', result.data.nodes.length);
console.log('Edges:', result.data.edges.length);

// Test getGraphStats
const stats = await api.getGraphStats('/path/to/repo');
console.log('Stats:', stats);

// Test getMostUsedNodes
const critical = await api.getMostUsedNodes('/path/to/repo', 10);
console.log('Critical files:', critical);

// Test findCircularDependencies
const cycles = await api.findCircularDependencies('/path/to/repo');
console.log('Cycles:', cycles);
```

### 2. Component Integration Tests

After implementing components:

```javascript
// In React component
const { buildGlobalGraph } = useStore();

// Trigger build
await buildGlobalGraph('/path/to/repo');

// Component should display:
// - File count
// - Dependency count
// - Language breakdown
// - File type breakdown
// - Critical files list
// - Issues/alerts
```

## Error Testing

### Test with Invalid Path
```bash
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/nonexistent/path"}'

# Should return 400 with error message
```

### Test with No Parameters
```bash
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return 400 with error message
```

### Test with Empty Repository
```bash
mkdir -p /tmp/empty-repo
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/tmp/empty-repo"}'

# Should return success with empty nodes/edges
```

### Test Graph Recompute
```bash
# Build initial graph
curl -X POST http://localhost:5000/api/graph/build \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/repo"}'

# Modify repo (add/remove files)
# ...

# Recompute graph
curl -X POST http://localhost:5000/api/graph/recompute \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/repo"}'

# Should reflect changes
```

## Automated Testing Script

Save as `test-graph-api.sh`:

```bash
#!/bin/bash

REPO_PATH="${1:-.}"
BASE_URL="http://localhost:5000"

echo "🧪 Testing F0 & F1 Graph API"
echo "📁 Repository: $REPO_PATH"
echo ""

# Test 1: Build Graph
echo "1️⃣  Building graph..."
BUILD_RESULT=$(curl -s -X POST $BASE_URL/api/graph/build \
  -H "Content-Type: application/json" \
  -d "{\"path\": \"$REPO_PATH\"}")

NODES=$(echo $BUILD_RESULT | jq '.data.nodes | length')
EDGES=$(echo $BUILD_RESULT | jq '.data.edges | length')
BUILD_TIME=$(echo $BUILD_RESULT | jq '.data.metadata.buildTime')

echo "✅ Graph built: $NODES nodes, $EDGES edges (${BUILD_TIME}ms)"
echo ""

# Test 2: Get Statistics
echo "2️⃣  Getting statistics..."
STATS=$(curl -s "$BASE_URL/api/graph/stats?path=$REPO_PATH")

NODE_COUNT=$(echo $STATS | jq '.stats.nodeCount')
CYCLE_COUNT=$(echo $STATS | jq '.stats.cyclesDetected')
AVG_IN=$(echo $STATS | jq '.stats.averageInDegree' | xargs printf "%.2f")

echo "✅ Stats: $NODE_COUNT files, $CYCLE_COUNT cycles, avg in-degree $AVG_IN"
echo ""

# Test 3: Critical Files
echo "3️⃣  Finding critical files..."
CRITICAL=$(curl -s "$BASE_URL/api/graph/analysis/most-used?path=$REPO_PATH&limit=3")
CRITICAL_COUNT=$(echo $CRITICAL | jq '.nodes | length')

echo "✅ Top critical files: $CRITICAL_COUNT found"
echo $CRITICAL | jq '.nodes[] | {name: .name, inDegree: .inDegree}' | head -10
echo ""

# Test 4: Circular Dependencies
echo "4️⃣  Detecting circular dependencies..."
CYCLES=$(curl -s "$BASE_URL/api/graph/analysis/cycles?path=$REPO_PATH")
CYCLE_COUNT=$(echo $CYCLES | jq '.cycleCount')

if [ "$CYCLE_COUNT" -eq 0 ]; then
  echo "✅ No circular dependencies found!"
else
  echo "⚠️  Found $CYCLE_COUNT circular dependencies"
fi
echo ""

echo "✨ Testing complete!"
```

Run it:
```bash
chmod +x test-graph-api.sh
./test-graph-api.sh /path/to/repo
```

## Verification Checklist

- [ ] All health endpoints respond
- [ ] Graph builds without errors
- [ ] Nodes are correctly parsed
- [ ] Edges are correctly created
- [ ] Node IDs are stable
- [ ] File types are classified
- [ ] Languages are detected
- [ ] In-degree calculated correctly
- [ ] Out-degree calculated correctly
- [ ] Critical files identified
- [ ] Circular dependencies detected
- [ ] Statistics are accurate
- [ ] Performance is acceptable
- [ ] Memory usage is reasonable
- [ ] Export works correctly
- [ ] Error handling is robust

## Success Indicators

✅ You've successfully tested F0 & F1 when:

1. Graph builds in reasonable time (<5s for typical repos)
2. All statistics are non-zero and reasonable
3. Critical files make sense
4. Circular dependency detection works (or correctly shows 0)
5. Memory usage is stable
6. All API endpoints respond with proper JSON
7. No console errors in browser
8. Components display correctly (if implemented)

---

If you encounter issues, check `FEATURES_F0_F1.md` for troubleshooting.
