import { create } from 'zustand';
import { api } from '../services/api';

export const useStore = create((set, get) => ({
  // Repository state
  repositoryPath: null,      // Original input (URL or local path)
  effectivePath: null,       // Actual local path for analysis (clonePath for GitHub, same as repositoryPath for local)
  repositoryInfo: null,
  
  // Graph data
  graphData: null,
  complexityData: null,
  centralityData: null,
  
  // Filter state
  filters: {
    extensions: [],      // e.g., ['.js', '.ts']
    languages: [],       // e.g., ['JavaScript', 'TypeScript']
    directories: [],     // e.g., ['src', 'components']
    hubFiles: [],        // e.g., ['app.js','index.js'] - files that act as central hubs
    connectionStatus: 'all', // 'all' | 'connected' | 'orphan'
    nodeType: 'all',     // 'all' | 'file' | 'folder' | 'module'
    searchQuery: ''      // text search for file names
  },
  
  // UI state
  isLoading: false,
  error: null,
  viewMode: 'dependencies', // 'dependencies' | 'complexity' | 'centrality'
  selectedNode: null,
  
  // Actions
  setSelectedNode: (node) => set({ selectedNode: node }),
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
      set({ graphData });
      
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
