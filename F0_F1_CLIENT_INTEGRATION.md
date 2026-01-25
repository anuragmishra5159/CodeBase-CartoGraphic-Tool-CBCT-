# F0 & F1 Client Integration Guide

## Overview

This guide explains how to integrate F0 (Repository Structural Extraction) and F1 (Global Dependency Graph) into your React client components.

## Store Integration

Update your Zustand store to work with the global graph:

### Example Store Enhancement

```javascript
// client/src/store/useStore.js (ADD to existing store)

import create from 'zustand';
import { api } from '../services/api';

const useStore = create((set, get) => ({
  // ... existing state ...

  // F0 & F1 State
  globalGraph: null,
  graphStats: null,
  graphLoading: false,
  graphError: null,
  
  // Methods
  buildGlobalGraph: async (repoPath) => {
    set({ graphLoading: true, graphError: null });
    try {
      const result = await api.buildGlobalGraph(repoPath);
      const stats = await api.getGraphStats(repoPath);
      
      set({
        globalGraph: result.data,
        graphStats: stats.stats,
        graphLoading: false,
      });
      
      return result;
    } catch (error) {
      set({ graphError: error.message, graphLoading: false });
      throw error;
    }
  },

  getNodeAnalysis: async (repoPath, nodeId) => {
    try {
      return await api.getNodeFromGraph(repoPath, nodeId);
    } catch (error) {
      set({ graphError: error.message });
      throw error;
    }
  },

  analyzeCriticalFiles: async (repoPath, limit = 10) => {
    try {
      const mostUsed = await api.getMostUsedNodes(repoPath, limit);
      const mostDependent = await api.getMostDependentNodes(repoPath, limit);
      
      return {
        mostUsed: mostUsed.nodes,
        mostDependent: mostDependent.nodes,
      };
    } catch (error) {
      set({ graphError: error.message });
      throw error;
    }
  },

  detectIssues: async (repoPath) => {
    try {
      const cycles = await api.findCircularDependencies(repoPath);
      
      return {
        circularDependencies: cycles.cycles,
        cycleCount: cycles.cycleCount,
      };
    } catch (error) {
      set({ graphError: error.message });
      throw error;
    }
  },

  clearGraph: () => {
    set({
      globalGraph: null,
      graphStats: null,
      graphError: null,
    });
  },
}));
```

## Component Examples

### 1. Graph Statistics Dashboard

```jsx
// client/src/components/GraphStatsDashboard.jsx

import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Activity, FileCode, GitBranch, AlertCircle } from 'lucide-react';

export function GraphStatsDashboard({ repoPath }) {
  const { graphStats, graphLoading, buildGlobalGraph } = useStore();

  useEffect(() => {
    if (repoPath && !graphStats) {
      buildGlobalGraph(repoPath);
    }
  }, [repoPath]);

  if (graphLoading) {
    return <div className="text-center p-4">Building graph...</div>;
  }

  if (!graphStats) {
    return <div className="text-center p-4">No data</div>;
  }

  const stats = graphStats;
  const langCount = Object.keys(stats.languages || {}).length;
  const typeCount = Object.keys(stats.types || {}).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {/* File Count */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-600 text-sm">Files</div>
            <div className="text-2xl font-bold">{stats.nodeCount}</div>
          </div>
          <FileCode className="text-blue-500" size={24} />
        </div>
      </div>

      {/* Dependency Count */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-600 text-sm">Dependencies</div>
            <div className="text-2xl font-bold">{stats.edgeCount}</div>
          </div>
          <GitBranch className="text-green-500" size={24} />
        </div>
      </div>

      {/* Languages */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-600 text-sm">Languages</div>
            <div className="text-2xl font-bold">{langCount}</div>
          </div>
          <Activity className="text-purple-500" size={24} />
        </div>
      </div>

      {/* Circular Dependencies */}
      <div className={`rounded-lg p-4 border ${stats.cyclesDetected > 0 
        ? 'bg-red-50 border-red-200' 
        : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-600 text-sm">Cycles</div>
            <div className="text-2xl font-bold">{stats.cyclesDetected}</div>
          </div>
          <AlertCircle className={stats.cyclesDetected > 0 
            ? 'text-red-500' 
            : 'text-green-500'} size={24} />
        </div>
      </div>
    </div>
  );
}
```

### 2. Critical Files Panel

```jsx
// client/src/components/CriticalFilesPanel.jsx

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { TrendingUp } from 'lucide-react';

export function CriticalFilesPanel({ repoPath }) {
  const [critical, setCritical] = useState(null);
  const [loading, setLoading] = useState(false);
  const { analyzeCriticalFiles } = useStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await analyzeCriticalFiles(repoPath, 10);
        setCritical(result);
      } finally {
        setLoading(false);
      }
    }

    if (repoPath) load();
  }, [repoPath]);

  if (loading) return <div className="p-4">Analyzing...</div>;
  if (!critical) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} />
        <h3 className="text-lg font-bold">Most Critical Files</h3>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Most Depended Upon
          </h4>
          {critical.mostUsed.map((node, i) => (
            <div 
              key={node.id} 
              className="flex items-center justify-between p-2 bg-blue-50 rounded mb-1"
            >
              <div className="flex-1">
                <div className="text-sm font-mono">{node.name}</div>
                <div className="text-xs text-gray-500">{node.directory}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">
                  {node.inDegree}
                </div>
                <div className="text-xs text-gray-500">dependents</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Most Dependent
          </h4>
          {critical.mostDependent.map((node, i) => (
            <div 
              key={node.id} 
              className="flex items-center justify-between p-2 bg-green-50 rounded mb-1"
            >
              <div className="flex-1">
                <div className="text-sm font-mono">{node.name}</div>
                <div className="text-xs text-gray-500">{node.directory}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">
                  {node.outDegree}
                </div>
                <div className="text-xs text-gray-500">dependencies</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3. Issues & Alerts Panel

```jsx
// client/src/components/IssuesPanel.jsx

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function IssuesPanel({ repoPath }) {
  const [issues, setIssues] = useState(null);
  const [loading, setLoading] = useState(false);
  const { detectIssues } = useStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await detectIssues(repoPath);
        setIssues(result);
      } finally {
        setLoading(false);
      }
    }

    if (repoPath) load();
  }, [repoPath]);

  if (loading) return <div className="p-4">Scanning for issues...</div>;
  if (!issues) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        {issues.cycleCount === 0 ? (
          <CheckCircle className="text-green-500" size={20} />
        ) : (
          <AlertTriangle className="text-red-500" size={20} />
        )}
        <h3 className="text-lg font-bold">Code Health Issues</h3>
      </div>

      {issues.cycleCount === 0 ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
          ✅ No circular dependencies detected!
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="font-semibold text-red-800 mb-2">
              ⚠️ {issues.cycleCount} Circular Dependencies Found
            </div>
            {issues.circularDependencies.slice(0, 5).map((cycle, i) => (
              <div 
                key={i} 
                className="text-xs font-mono text-red-700 mb-1 p-2 bg-red-100 rounded break-all"
              >
                {cycle.map(path => {
                  const name = path.split('/').pop();
                  return name;
                }).join(' → ')}
              </div>
            ))}
            {issues.circleCount > 5 && (
              <div className="text-xs text-red-600 mt-2">
                ... and {issues.circleCount - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Node Details Modal

```jsx
// client/src/components/NodeDetailsModal.jsx

import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';

export function NodeDetailsModal({ nodeId, repoPath, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getNodeAnalysis } = useStore();

  useEffect(() => {
    async function load() {
      try {
        const result = await getNodeAnalysis(repoPath, nodeId);
        setDetails(result);
      } finally {
        setLoading(false);
      }
    }

    if (nodeId && repoPath) load();
  }, [nodeId, repoPath]);

  if (!details) return null;

  const { node, inDegree, outDegree, dependencies, dependents } = details;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-auto">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold font-mono">{node.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{node.path}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-600">Type</div>
              <div className="font-semibold capitalize">{node.type}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Language</div>
              <div className="font-semibold">{node.language}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Size</div>
              <div className="font-semibold">
                {Math.round(node.metadata.size / 1024)} KB
              </div>
            </div>
          </div>

          {/* Degrees */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-xs text-gray-600">In-Degree (Dependents)</div>
              <div className="text-2xl font-bold text-blue-600">{inDegree}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-xs text-gray-600">Out-Degree (Dependencies)</div>
              <div className="text-2xl font-bold text-green-600">{outDegree}</div>
            </div>
          </div>

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Dependencies</h3>
              <div className="space-y-1">
                {dependencies.slice(0, 5).map(dep => (
                  <div key={dep.id} className="text-sm text-gray-700">
                    → {dep.name}
                  </div>
                ))}
                {dependencies.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {dependencies.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dependents */}
          {dependents.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Dependents</h3>
              <div className="space-y-1">
                {dependents.slice(0, 5).map(dep => (
                  <div key={dep.id} className="text-sm text-gray-700">
                    ← {dep.name}
                  </div>
                ))}
                {dependents.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {dependents.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Integration Workflow

### 1. Update Store

Add the F0/F1 methods to your Zustand store (shown above).

### 2. Add Dashboard Component

```jsx
// client/src/components/AnalysisDashboard.jsx

import { GraphStatsDashboard } from './GraphStatsDashboard';
import { CriticalFilesPanel } from './CriticalFilesPanel';
import { IssuesPanel } from './IssuesPanel';

export function AnalysisDashboard({ repoPath }) {
  return (
    <div className="space-y-4">
      <GraphStatsDashboard repoPath={repoPath} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CriticalFilesPanel repoPath={repoPath} />
        <IssuesPanel repoPath={repoPath} />
      </div>
    </div>
  );
}
```

### 3. Integrate into Main App

```jsx
// client/src/App.jsx

import { AnalysisDashboard } from './components/AnalysisDashboard';

function App() {
  const { currentRepoPath } = useStore();

  return (
    <div>
      {/* ... existing components ... */}
      
      <AnalysisDashboard repoPath={currentRepoPath} />
      
      {/* ... rest of app ... */}
    </div>
  );
}
```

## Performance Tips

1. **Lazy Load**: Only build graph when user requests it
2. **Cache Results**: Store graph in Zustand to avoid rebuilds
3. **Pagination**: Show top 10-20 items, allow "show more"
4. **Debounce**: Debounce filter changes before analysis
5. **Selective Updates**: Recompute only when repo actually changes

## Next Steps

1. ✅ Backend implementation complete (structuralExtraction.js, globalDependencyGraph.js)
2. ✅ API routes complete (routes/graph.js)
3. ✅ Client API methods complete (services/api.js)
4. **Now**: Integrate components into your UI
5. Customize styling to match your design
6. Add additional visualizations

---

For detailed API documentation, see `FEATURES_F0_F1.md`.
