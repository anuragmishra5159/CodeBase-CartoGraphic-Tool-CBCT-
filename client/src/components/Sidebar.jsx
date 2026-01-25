import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  BarChart3, 
  Target, 
  Layers,
  ChevronRight,
  ChevronLeft,
  Info 
} from 'lucide-react';
import { useStore } from '../store/useStore';

const viewModes = [
  { 
    id: 'dependencies', 
    label: 'Dependencies', 
    icon: GitBranch,
    description: 'File connections and imports'
  },
  { 
    id: 'complexity', 
    label: 'Complexity', 
    icon: BarChart3,
    description: 'Code density and size'
  },
  { 
    id: 'centrality', 
    label: 'Centrality', 
    icon: Target,
    description: 'Hub modules and gravity'
  }
];

function Sidebar() {
  const { 
    repositoryPath, 
    repositoryInfo, 
    viewMode, 
    setViewMode,
    graphData,
    selectedNode
  } = useStore();
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle function with resize trigger for D3
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setTimeout(() => {
       window.dispatchEvent(new Event('resize'));
    }, 400); 
  };

  if (!repositoryPath) return null;

  return (
    <motion.aside 
      initial={{ width: 320 }}
      animate={{ width: isCollapsed ? 20 : 320 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative bg-[#0B0B15]/80 backdrop-blur-md border-r border-white/10 flex flex-col z-40 h-full shadow-2xl"
    >
      {/* Toggle Button - Center of bar */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-cbct-accent text-white flex items-center justify-center rounded-r-lg shadow-[0_0_15px_rgba(88,166,255,0.4)] hover:bg-cbct-accent/90 transition-all z-50 overflow-hidden"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Content Container */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} transition-opacity duration-200 delay-75`}>
        
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* View Mode */}
          <div>
            <h2 className="text-xs font-bold text-cbct-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <Layers className="w-3 h-3" /> View Mode
            </h2>
            <div className="space-y-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group relative overflow-hidden border ${
                    viewMode === mode.id
                      ? 'bg-cbct-accent/10 border-cbct-accent/30 text-cbct-accent shadow-sm'
                      : 'border-transparent text-cbct-muted hover:bg-white/5 hover:text-white hover:border-white/5'
                  }`}
                >
                  <mode.icon className={`w-5 h-5 transition-colors ${
                    viewMode === mode.id ? 'text-cbct-accent' : 'text-cbct-muted group-hover:text-white'
                  }`} />
                  <div>
                    <div className="text-sm font-semibold">{mode.label}</div>
                    <div className="text-[10px] opacity-70 leading-tight mt-0.5">{mode.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Repository Stats */}
          {repositoryInfo && (
            <div>
              <h2 className="text-xs font-bold text-cbct-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Info className="w-3 h-3" /> Repository Stats
              </h2>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-cbct-muted">Total Files</span>
                  <span className="font-mono font-bold text-white">{repositoryInfo.totalFiles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-cbct-muted">Modules</span>
                  <span className="font-mono font-bold text-white">{repositoryInfo.structure?.modules?.length || 0}</span>
                </div>
                
                {repositoryInfo.languages?.length > 0 && (
                  <div className="pt-3 border-t border-white/5 mt-2">
                    <span className="text-xs text-cbct-muted block mb-2">Languages</span>
                    <div className="flex flex-wrap gap-1.5">
                      {repositoryInfo.languages.map((lang) => (
                        <span key={lang} className="text-[10px] font-medium bg-cbct-accent/10 text-cbct-accent px-2 py-0.5 rounded-full border border-cbct-accent/20">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Graph Metrics */}
          {graphData && (
            <div>
              <h2 className="text-xs font-bold text-cbct-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                 <BarChart3 className="w-3 h-3" /> Graph Metrics
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                   <div className="text-2xl font-bold text-white mb-1">{graphData.nodes?.length || 0}</div>
                   <div className="text-[10px] text-cbct-muted uppercase tracking-wide">Nodes</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                   <div className="text-2xl font-bold text-white mb-1">{graphData.edges?.length || 0}</div>
                   <div className="text-[10px] text-cbct-muted uppercase tracking-wide">Edges</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Selected Node Inspector (Mini) */}
          {selectedNode && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xs font-bold text-cbct-accent uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                   <Target className="w-3 h-3" /> Selected Node
                </h2>
                <div className="bg-cbct-accent/5 p-4 rounded-xl border border-cbct-accent/20">
                   <div className="font-bold text-white text-sm break-all mb-1">{selectedNode.label}</div>
                   <div className="text-xs text-cbct-accent font-mono mb-2">{selectedNode.type}</div>
                   <div className="text-[10px] text-cbct-muted/80 font-mono break-all line-clamp-2">{selectedNode.path || selectedNode.id}</div>
                </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
           <div className="text-[10px] text-cbct-muted/50 text-center font-mono">
             v1.0.0 • Shift+Scroll to Zoom
           </div>
        </div>
      
      </div>
      
      {/* Click-to-expand sensitive area on the closed bar */}
      {isCollapsed && (
        <div 
          className="absolute inset-y-0 left-0 w-full cursor-pointer hover:bg-white/5 transition-colors z-40" 
          onClick={toggleSidebar}
          title="Click to expand"
        />
      )}
    </motion.aside>
  );
}

export default Sidebar;
