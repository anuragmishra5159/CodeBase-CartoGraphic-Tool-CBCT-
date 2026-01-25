import React, { useState, useMemo } from 'react';
import { Map, FolderOpen, Github, X, Filter, Search, ChevronDown, File, Folder, Box, Layers } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '@/lib/utils'; // Assuming this utility exists

function Header() {
  const { 
    repositoryPath, 
    repositoryInfo, 
    clearRepository, 
    graphData,
    filters,
    setFilter,
    toggleExtensionFilter,
    toggleLanguageFilter,
    clearFilters
  } = useStore();
  
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const isGithub = repositoryInfo?.source === 'github';
  const displayName = repositoryInfo?.name || repositoryPath;

  // Get unique extensions and languages from graphData
  const filterOptions = useMemo(() => {
    if (!graphData?.nodes) return { extensions: [], languages: [] };
    
    const extensions = [...new Set(graphData.nodes.map(n => n.extension).filter(Boolean))].sort();
    const languages = [...new Set(graphData.nodes.map(n => n.language).filter(l => l && l !== 'unknown'))].sort();
    
    return { extensions, languages };
  }, [graphData]);

  const activeFilterCount = filters.extensions.length + filters.languages.length + 
    (filters.connectionStatus !== 'all' ? 1 : 0) + (filters.searchQuery ? 1 : 0) +
    (filters.nodeType !== 'all' ? 1 : 0);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300 backdrop-blur-xl bg-[#0B0B15]/40 border-b border-white/5 shadow-2xl">
      <div className="h-full flex items-center px-6 justify-between max-w-[1920px] mx-auto w-full gap-4">
        
        {/* LEFT: Branding */}
        <div className="flex items-center gap-3 group cursor-pointer min-w-fit">
          <div className="relative">
            <div className="absolute inset-0 bg-cbct-accent/40 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Map className="w-6 h-6 text-cbct-accent relative z-10 transition-transform group-hover:scale-110 duration-300" />
          </div>
          <h1 className="text-xl font-bold tracking-tight flex items-baseline">
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent group-hover:to-cbct-accent transition-all duration-300">CBCT</span>
            <span className="text-cbct-muted ml-3 font-medium text-sm hidden sm:inline opacity-60 group-hover:opacity-80 transition-opacity">
              CodeBase Cartographic Tool
            </span>
          </h1>
        </div>

        {repositoryPath && (
          <>
            {/* CENTER: Search and Quick Filters */}
            <div className="flex-1 max-w-2xl flex items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-500 delay-100">
               {/* Search Bar */}
               <div className="relative w-full max-w-sm group">
                  <div className="absolute inset-0 bg-white/5 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cbct-muted group-focus-within:text-cbct-accent transition-colors w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search files, modules..." 
                    className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cbct-accent/50 focus:bg-white/5 transition-all shadow-inner"
                    value={filters.searchQuery}
                    onChange={(e) => setFilter('searchQuery', e.target.value)}
                  />
               </div>

               {/* Node Type Pills */}
               <div className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/10 backdrop-blur-md">
                 {[
                   { id: 'all', icon: Layers, label: 'All' },
                   { id: 'file', icon: File, label: 'Files' },
                   { id: 'folder', icon: Folder, label: 'Folders' },
                   { id: 'module', icon: Box, label: 'Modules' },
                 ].map((type) => (
                   <button
                     key={type.id}
                     onClick={() => setFilter('nodeType', type.id)}
                     className={cn(
                       "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
                       filters.nodeType === type.id 
                         ? "bg-cbct-accent text-white shadow-[0_0_15px_rgba(88,166,255,0.4)]" 
                         : "text-cbct-muted hover:text-white hover:bg-white/5"
                     )}
                   >
                     <type.icon className="w-3 h-3" />
                     <span className="hidden xl:inline">{type.label}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* RIGHT: Repo Info & Advanced Filter */}
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 min-w-fit justify-end">
              
              {/* Repo Chip */}
              <div className="hidden lg:flex items-center gap-2 text-sm bg-white/5 px-4 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm">
                {isGithub ? (
                  <Github className="w-3.5 h-3.5 text-cbct-muted" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5 text-cbct-muted" />
                )}
                <span className="text-cbct-muted max-w-[150px] truncate font-medium">
                  {displayName}
                </span>
                {repositoryInfo && (
                  <span className="text-xs text-cbct-accent bg-cbct-accent/10 px-2 py-0.5 rounded-full ml-1 border border-cbct-accent/10">
                    {repositoryInfo.totalFiles} files
                  </span>
                )}
              </div>

              {/* Advanced Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
                    activeFilterCount > 0 
                      ? 'bg-cbct-accent/20 border-cbct-accent/50 text-cbct-accent shadow-[0_0_10px_rgba(88,166,255,0.2)]' 
                      : 'bg-white/5 border-white/10 text-cbct-muted hover:text-white hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Adv. Filters</span>
                  {activeFilterCount > 0 && (
                     <span className="bg-cbct-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                       {activeFilterCount}
                     </span>
                   )}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Content */}
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-[#0B0B15]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
                    
                    {/* Connection Status */}
                    <div className="mb-4">
                      <label className="text-xs text-cbct-muted uppercase tracking-wider mb-2 block font-semibold">Connection Status</label>
                      <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
                        {['all', 'connected', 'orphan'].map(status => (
                          <button
                            key={status}
                            onClick={() => setFilter('connectionStatus', status)}
                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              filters.connectionStatus === status
                                ? 'bg-cbct-accent text-white shadow-sm'
                                : 'text-cbct-muted hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File Extensions */}
                    {filterOptions.extensions.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs text-cbct-muted uppercase tracking-wider mb-2 block font-semibold">File Types</label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {filterOptions.extensions.map(ext => (
                            <button
                              key={ext}
                              onClick={() => toggleExtensionFilter(ext)}
                              className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                                filters.extensions.includes(ext)
                                  ? 'bg-cbct-accent/20 border-cbct-accent/40 text-cbct-accent'
                                  : 'bg-transparent border-white/10 text-cbct-muted hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {ext}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {filterOptions.languages.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs text-cbct-muted uppercase tracking-wider mb-2 block font-semibold">Languages</label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {filterOptions.languages.map(lang => (
                            <button
                              key={lang}
                              onClick={() => toggleLanguageFilter(lang)}
                              className={`px-2 py-1 rounded text-xs border transition-all ${
                                filters.languages.includes(lang)
                                  ? 'bg-cbct-secondary/20 border-cbct-secondary/40 text-cbct-secondary'
                                  : 'bg-transparent border-white/10 text-cbct-muted hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="w-full py-2 text-sm text-cbct-muted hover:text-white border border-dashed border-white/20 rounded-lg hover:border-cbct-accent/50 hover:bg-cbct-accent/5 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={clearRepository}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-cbct-muted hover:text-red-400 border border-transparent hover:border-red-500/30"
                title="Close repository"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
