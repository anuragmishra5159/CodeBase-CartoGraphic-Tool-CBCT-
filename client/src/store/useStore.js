import { create } from 'zustand';
import { api } from '../services/api';

export const useStore = create((set, get) => ({
  // Repository state
  repositoryPath: null,      // Original input (URL or local path)
  effectivePath: null,       // Actual local path for analysis (clonePath for GitHub, same as repositoryPath for local)
  repositoryInfo: null,

  // Graph data (now includes semantic layer metadata)
  graphData: null,
  complexityData: null,
  centralityData: null,

  // Semantic Layer State (INTERNAL - adapts based on repo size, never exposed to user)
  semanticLayer: {
    currentLayer: 1,        // 1=Orientation, 2=Structural, 3=Impact, 4=Detail
    focusedUnit: null,      // Currently focused unit
    expandedUnits: [],      // Units that have been expanded
    previousState: null,    // For restoring on escape/background click
    revealDepth: 3,         // Based on repo size (set from metadata)
  },

  // Filter state
  filters: {
    extensions: [],      // e.g., ['.js', '.ts']
    languages: [],       // e.g., ['JavaScript', 'TypeScript']
    directories: [],     // e.g., ['src', 'components']
    hubFiles: [],        // e.g., ['app.js','index.js'] - files that act as central hubs
    connectionStatus: 'all', // 'all' | 'connected' | 'orphan'
    nodeType: 'all',     // 'all' | 'unit' (UI uses UNIT terminology only)
    searchQuery: ''      // text search for unit names
  },

  // UI state
  isLoading: false,
  error: null,
  viewMode: 'dependencies', // 'dependencies' | 'complexity' | 'centrality'
  selectedNode: null,

  // Semantic Layer Actions
  setSemanticLayer: (layer) => {
    const current = get().semanticLayer;
    set({
      semanticLayer: {
        ...current,
        previousState: { ...current },
        currentLayer: layer
      }
    });
  },

  focusUnit: (unit) => {
    const current = get().semanticLayer;
    set({
      semanticLayer: {
        ...current,
        previousState: { ...current },
        focusedUnit: unit,
        currentLayer: unit ? 2 : 1  // Auto-transition to Layer 2 on focus
      },
      selectedNode: unit
    });
  },

  expandUnit: async (unit) => {
    const { effectivePath, semanticLayer } = get();
    if (!effectivePath || !unit) return;

    try {
      const expanded = await api.expandUnit(effectivePath, unit.id, semanticLayer.revealDepth);
      set(state => ({
        semanticLayer: {
          ...state.semanticLayer,
          expandedUnits: [...state.semanticLayer.expandedUnits, {
            unitId: unit.id,
            nodes: expanded.nodes,
            edges: expanded.edges
          }]
        }
      }));
      return expanded;
    } catch (error) {
      console.error('Failed to expand unit:', error);
      return null;
    }
  },

  getUnitImpact: async (unit) => {
    const { effectivePath } = get();
    if (!effectivePath || !unit) return null;

    try {
      const impact = await api.getUnitImpact(effectivePath, unit.id);
      set(state => ({
        semanticLayer: {
          ...state.semanticLayer,
          currentLayer: 3  // Auto-transition to Layer 3 for impact view
        }
      }));
      return impact;
    } catch (error) {
      console.error('Failed to get unit impact:', error);
      return null;
    }
  },

  restorePreviousState: () => {
    const current = get().semanticLayer;
    if (current.previousState) {
      set({
        semanticLayer: current.previousState,
        selectedNode: current.previousState.focusedUnit
      });
    } else {
      // Default to Layer 1 orientation
      set({
        semanticLayer: {
          ...current,
          currentLayer: 1,
          focusedUnit: null
        },
        selectedNode: null
      });
    }
  },

  // Zoom-to-layer mapping
  updateLayerFromZoom: (zoomLevel) => {
    let newLayer = 1;
    if (zoomLevel < 0.5) {
      newLayer = 1;  // Zoomed out = Orientation
    } else if (zoomLevel < 1.2) {
      newLayer = 2;  // Normal = Structural
    } else if (zoomLevel < 2.0) {
      newLayer = 3;  // Zoomed in = Impact
    } else {
      // Layer 4 requires explicit action, not just zoom
      newLayer = 3;
    }

    const current = get().semanticLayer;
    if (current.currentLayer !== newLayer && newLayer <= 3) {
      set({
        semanticLayer: {
          ...current,
          currentLayer: newLayer
        }
      });
    }
  },

  // Actions
  setSelectedNode: (node) => {
    set({ selectedNode: node });
    // Also update focusedUnit for semantic layer consistency
    if (node) {
      get().focusUnit(node);
    }
  },

  setRepositoryPath: async (path) => {
    set({ isLoading: true, error: null });

    try {
      // First scan repository to get info and effective path
      const repoInfo = await api.scanRepository(path);

      // For GitHub repos, use clonePath; for local repos, use the scanned path
      const effectivePath = repoInfo.clonePath || repoInfo.path || path;

      set({
        repositoryPath: path,
        effectivePath,
        repositoryInfo: repoInfo
      });

      // Load dependency graph using the effective local path (not the GitHub URL)
      const graphData = await api.analyzeDependencies(effectivePath);

      // Extract reveal depth from metadata if available
      const revealDepth = graphData.metadata?.revealDepth || 3;

      set({
        graphData,
        semanticLayer: {
          currentLayer: 1,
          focusedUnit: null,
          expandedUnits: [],
          previousState: null,
          revealDepth
        }
      });

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error.message || 'Failed to load repository',
        isLoading: false
      });
    }
  },

  loadComplexityData: async () => {
    const { effectivePath } = get();
    if (!effectivePath) return;

    try {
      const data = await api.analyzeComplexity(effectivePath);
      set({ complexityData: data });
    } catch (error) {
      console.error('Failed to load complexity data:', error);
    }
  },

  loadCentralityData: async () => {
    const { effectivePath } = get();
    if (!effectivePath) return;

    try {
      const data = await api.analyzeCentrality(effectivePath);
      set({ centralityData: data });
    } catch (error) {
      console.error('Failed to load centrality data:', error);
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });

    // Load data for the view mode if not already loaded
    const { complexityData, centralityData, loadComplexityData, loadCentralityData } = get();

    if (mode === 'complexity' && !complexityData) {
      loadComplexityData();
    }
    if (mode === 'centrality' && !centralityData) {
      loadCentralityData();
    }
  },

  clearRepository: () => {
    set({
      repositoryPath: null,
      effectivePath: null,
      repositoryInfo: null,
      graphData: null,
      complexityData: null,
      centralityData: null,
      error: null,
      semanticLayer: {
        currentLayer: 1,
        focusedUnit: null,
        expandedUnits: [],
        previousState: null,
        revealDepth: 3
      },
      filters: {
        extensions: [],
        languages: [],
        directories: [],
        hubFiles: [],
        connectionStatus: 'all',
        nodeType: 'all',
        searchQuery: ''
      },
      selectedNode: null
    });
  },

  // Filter actions
  setFilter: (filterType, value) => {
    set(state => ({
      filters: {
        ...state.filters,
        [filterType]: value
      }
    }));
  },

  toggleExtensionFilter: (ext) => {
    set(state => {
      const current = state.filters.extensions;
      const newExts = current.includes(ext)
        ? current.filter(e => e !== ext)
        : [...current, ext];
      return { filters: { ...state.filters, extensions: newExts } };
    });
  },

  toggleLanguageFilter: (lang) => {
    set(state => {
      const current = state.filters.languages;
      const newLangs = current.includes(lang)
        ? current.filter(l => l !== lang)
        : [...current, lang];
      return { filters: { ...state.filters, languages: newLangs } };
    });
  },

  clearFilters: () => {
    set({
      filters: {
        extensions: [],
        languages: [],
        directories: [],
        hubFiles: [],
        connectionStatus: 'all',
        nodeType: 'all',
        searchQuery: ''
      }
    });
  },

  clearError: () => set({ error: null })
}));

