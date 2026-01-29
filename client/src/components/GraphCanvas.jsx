import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { cn } from '@/lib/utils';
import {
  File, Folder, Box, FileCode, Image as ImageIcon, Database,
  Layout, Settings, Share2, Layers, Search, Filter,
  ArrowRight, Activity, GitCommit, GitBranch, AlertCircle, Zap, Crosshair,
  ZoomIn, ZoomOut, RotateCcw, Target
} from 'lucide-react';
import { PythonIcon, ReactIcon, JSIcon, TSIcon, HTMLIcon, CSSIcon, JSONIcon, MarkdownIcon } from './LanguageIcons';

// --- Graph Constants & Styles ---
const NODE_SIZE = 60;
const LINK_DISTANCE = 180;
const REPULSION_STRENGTH = -800; // Stronger repulsion to separate clusters
const CENTER_FORCE = 0.05; // Weaker center force to allow spread

// --- Node Icon Mapping ---
const getIconForType = (type, extension) => {
  if (type === 'directory' || type === 'folder') return Folder;
  if (type === 'module') return Box;

  const ext = (extension || '').toLowerCase();

  if (['py', 'python'].includes(ext)) return PythonIcon;
  if (['js', 'javascript'].includes(ext)) return JSIcon;
  if (['ts', 'tsx'].includes(ext)) {
    if (ext === 'tsx') return ReactIcon; // Assumption: TSX is often React
    return TSIcon;
  }
  if (['jsx'].includes(ext)) return ReactIcon;
  if (['html', 'htm'].includes(ext)) return HTMLIcon;
  if (['css', 'scss', 'less', 'sass'].includes(ext)) return CSSIcon;
  if (['json', 'yml', 'yaml'].includes(ext)) return JSONIcon; // JSON icon for config
  if (['md', 'markdown'].includes(ext)) return MarkdownIcon;

  // Fallbacks
  if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) return ImageIcon;
  if (['xml', 'sql', 'db'].includes(ext)) return Database;

  return File;
};

// --- Color & Style Mapping ---
// Returns an object: { text, bg, border, shadow, glow }
const getNodeStyles = (type, extension) => {
  const ext = (extension || '').toLowerCase();

  // Default Style (Generic File) - Slate/White
  let style = {
    text: 'text-slate-200',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]', // Base shadow
    glow: 'group-hover:shadow-[0_0_20px_rgba(148,163,184,0.3)]', // Slate glow
    iconColor: 'text-slate-300'
  };

  if (type === 'directory' || type === 'folder') {
    return {
      text: 'text-blue-200',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      iconColor: 'text-blue-400'
    };
  }

  if (type === 'module') {
    return {
      text: 'text-purple-200',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      iconColor: 'text-purple-400'
    };
  }

  // --- Tech Stack Colors ---

  // JavaScript (Yellow)
  if (['js'].includes(ext)) {
    style = {
      text: 'text-yellow-200',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]',
      iconColor: 'text-yellow-400'
    };
  }
  // TypeScript (Blue)
  else if (['ts', 'tsx'].includes(ext)) {
    style = {
      text: 'text-blue-200',
      bg: 'bg-blue-600/10',
      border: 'border-blue-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]',
      iconColor: 'text-blue-400'
    };
  }
  // React (Cyan) - prioritizing over JS/TS if we could detect it, but ext is usually unique
  else if (['jsx'].includes(ext)) {
    style = {
      text: 'text-cyan-200',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]',
      iconColor: 'text-cyan-400'
    };
  }
  // Python (Blue/Yellow - using Blue)
  else if (['py'].includes(ext)) {
    style = {
      text: 'text-sky-200',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]',
      iconColor: 'text-sky-400'
    };
  }
  // HTML (Orange)
  else if (['html', 'htm'].includes(ext)) {
    style = {
      text: 'text-orange-200',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]',
      iconColor: 'text-orange-500'
    };
  }
  // CSS (Pink/Rose)
  else if (['css', 'scss', 'less', 'sass'].includes(ext)) {
    style = {
      text: 'text-pink-200',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]',
      iconColor: 'text-pink-400'
    };
  }
  // JSON/Config (Green/Emerald)
  else if (['json', 'yml', 'yaml', 'env'].includes(ext)) {
    style = {
      text: 'text-emerald-200',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      iconColor: 'text-emerald-400'
    };
  }
  // Markdown (Purple/Gray)
  else if (['md'].includes(ext)) {
    style = {
      text: 'text-indigo-200',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
      glow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
      iconColor: 'text-indigo-400'
    };
  }

  return style;
};

// --- Single Node Component ---
const GraphNode = ({ node, mouseX, mouseY, onHover, onClick, isSelected, isDimmed }) => {
  const iconRef = useRef(null);

  // Robust extension detection
  const extension = node.extension || (node.label && node.label.includes('.') ? node.label.split('.').pop() : '');

  const IconComponent = getIconForType(node.type, extension);
  const styles = getNodeStyles(node.type, extension);

  // Motion values for interaction
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  useEffect(() => {
    // Simple repulsion effect on mouse move near node
    const handleRepulsion = (mx, my) => {
      if (!iconRef.current) return;
      const rect = iconRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2));

      if (distance < 250) { // Increased radius for better "float" feel
        const angle = Math.atan2(my - centerY, mx - centerX);
        const force = (1 - distance / 250) * 50; // Stronger, smoother push
        x.set(-Math.cos(angle) * force);
        y.set(-Math.sin(angle) * force);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const unsubscribeX = mouseX.on("change", (v) => handleRepulsion(v, mouseY.get()));
    const unsubscribeY = mouseY.on("change", (v) => handleRepulsion(mouseX.get(), v));
    return () => { unsubscribeX(); unsubscribeY(); };
  }, [mouseX, mouseY, x, y]);

  return (
    <motion.div
      ref={iconRef}
      className={cn(
        "absolute top-0 left-0 cursor-pointer will-change-transform group",
        isDimmed ? "opacity-20 grayscale" : "opacity-100"
      )}
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      whileHover={{ scale: 1.3, zIndex: 60 }}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(node); }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isSelected ? 1.4 : 1, opacity: isDimmed ? 0.3 : 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <motion.div
        layoutId={`node-bg-${node.id}`}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 p-3 rounded-2xl transition-all duration-300",
          styles.bg,
          styles.border,
          "border backdrop-blur-md", // Glass effect
          styles.shadow,
          styles.glow, // Hover glow from styles

          isSelected
            ? "ring-2 ring-offset-2 ring-offset-black ring-blue-500 bg-[#252530]"
            : "hover:bg-[#252530]/80"
        )}
      >
        {/* Glossy Overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

        <IconComponent
          className={cn(
            "relative z-10 w-7 h-7 transition-colors duration-300",
            styles.iconColor
          )}
          strokeWidth={1.5}
        />

        {/* Active Indicator */}
        {isSelected && (
          <motion.div
            layoutId="selection-dot"
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] border-2 border-[#0B0B15] flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// --- Detailed Tooltip Component ---
// Uses UNIT terminology only - never mentions file/folder/module to user
const DetailedNodeTooltip = ({ node, onInspectInternals }) => {
  if (!node) return null;

  // Use summary from semantic engine if available, otherwise generate basic info
  const summary = node.summary || {};
  const role = summary.role || 'Standard Unit';
  const description = summary.description || 'A structural unit in the codebase.';
  const metrics = summary.metrics || {};

  // Layer info (abstracted - doesn't expose internal categorization)
  const layer = node.path?.includes('components') ? 'Interface' :
    (node.path?.includes('services') ? 'Logic' : 'Core');

  // Real metrics from semantic engine
  const fanIn = node.inDegree || metrics.dependedBy || 0;
  const fanOut = node.outDegree || metrics.dependsOn || 0;
  const childCount = node.childCount || metrics.internalUnits || 0;

  // Determine fan levels for display
  const getFanLevel = (count) => {
    if (count === 0) return 'None';
    if (count <= 3) return 'Low';
    if (count <= 7) return 'Medium';
    return 'High';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-24 right-6 z-50 w-80 bg-[#0B0B15]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Box className="w-4 h-4 text-cbct-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-[180px]" title={node.label}>{node.label}</h3>
              <span className="text-xs text-cbct-muted">Unit</span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider bg-white/5 px-2 py-0.5 rounded text-cbct-muted">
            {layer}
          </span>
        </div>
        <div className="text-xs text-cbct-muted/70 font-mono truncate px-1">
          {node.path || node.id}
        </div>
      </div>

      {/* Content - Scrollable if needed */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">

        {/* Role & Purpose */}
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-cbct-muted uppercase tracking-wider mb-2">
            <Activity className="w-3 h-3" /> Role & Purpose
          </h4>
          <p className="text-sm text-white/90 leading-relaxed mb-1">{role}</p>
          <p className="text-xs text-cbct-muted leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {role === 'Core Dependency' && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/20">High Impact</span>}
            {role === 'Entry Point' && <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] border border-green-500/20">Entry</span>}
            {role === 'Leaf Unit' && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">Safe to Modify</span>}
            {role === 'Isolated' && <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[10px] border border-gray-500/20">Isolated</span>}
          </div>
        </div>

        {/* Structural Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-[10px] text-cbct-muted uppercase">Depended By</span>
            <span className="text-lg font-mono font-medium text-white">{fanIn}</span>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-[10px] text-cbct-muted uppercase">Depends On</span>
            <span className="text-lg font-mono font-medium text-white">{fanOut}</span>
          </div>
          {childCount > 0 && (
            <div className="bg-white/5 rounded-lg p-2 border border-white/5 text-center">
              <span className="block text-[10px] text-cbct-muted uppercase">Contains</span>
              <span className="text-lg font-mono font-medium text-white">{childCount}</span>
            </div>
          )}
        </div>

        {/* Health Signals */}
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-cbct-muted uppercase tracking-wider mb-2">
            <AlertCircle className="w-3 h-3" /> Connectivity
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-cbct-muted">Fan-In</span>
              <span className={`${fanIn > 5 ? 'text-amber-400' : 'text-white/80'}`}>{getFanLevel(fanIn)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-cbct-muted">Fan-Out</span>
              <span className={`${fanOut > 5 ? 'text-amber-400' : 'text-white/80'}`}>{getFanLevel(fanOut)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 flex gap-2">
          <button className="flex-1 py-1.5 text-xs bg-cbct-accent/10 text-cbct-accent border border-cbct-accent/20 rounded hover:bg-cbct-accent/20 transition-colors">
            Trace Impact
          </button>
          {childCount > 0 && (
            <button
              onClick={() => onInspectInternals && onInspectInternals(node)}
              className="flex-1 py-1.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-colors"
            >
              Inspect Internals
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


export default function GraphCanvas() {
  const containerRef = useRef(null);
  const {
    graphData,
    filters,
    selectedNode,
    setSelectedNode,
    semanticLayer,
    updateLayerFromZoom,
    restorePreviousState,
    focusUnit
  } = useStore();

  // D3 & DOM refs
  const simulationRef = useRef(null);
  const nodeElementsRef = useRef(new Map());
  const linkElementsRef = useRef(null);

  // Local interaction state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [zoomTransform, setZoomTransform] = useState({ x: 0, y: 0, k: 1 });

  // Zoom functions with semantic layer integration
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    setZoomTransform(prev => ({ ...prev, k: newZoom }));
    // Update semantic layer based on zoom level
    updateLayerFromZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    setZoomTransform(prev => ({ ...prev, k: newZoom }));
    // Update semantic layer based on zoom level
    updateLayerFromZoom(newZoom);
  };

  const handleZoomReset = () => {
    setZoom(1);
    setZoomTransform({ x: 0, y: 0, k: 1 });
    updateLayerFromZoom(1);
  };

  const handleCenter = () => {
    setZoomTransform({ x: 0, y: 0, k: zoom });
  };

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    let nodes = graphData.nodes || [];
    let links = graphData.edges || [];

    // Node Type Filter
    if (filters.nodeType !== 'all') {
      const typeMap = { 'file': 'file', 'folder': 'directory', 'module': 'module' };
      const target = typeMap[filters.nodeType];
      if (target) {
        if (filters.nodeType === 'file') {
          // Include only true files, exclude dirs/modules
          nodes = nodes.filter(n => !['directory', 'module', 'root'].includes(n.type));
        } else {
          nodes = nodes.filter(n => n.type === target);
        }
      }
    }

    // Search Filter
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      nodes = nodes.filter(n => n.label.toLowerCase().includes(q));
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    links = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

    // Deep copy for D3 purely to avoid mutation issues if reused
    return { nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) };
  }, [graphData, filters.nodeType, filters.searchQuery]);


  // --- D3 Simulation ---
  useEffect(() => {
    if (!containerRef.current || !filteredData.nodes.length) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Simulation
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force("link", d3.forceLink(filteredData.links).id(d => d.id).distance(LINK_DISTANCE))
      .force("charge", d3.forceManyBody().strength(REPULSION_STRENGTH))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(NODE_SIZE / 1.2))
      // Add a bounding force to keep nodes accessible
      .force("x", d3.forceX(width / 2).strength(CENTER_FORCE))
      .force("y", d3.forceY(height / 2).strength(CENTER_FORCE))
      .on("tick", ticked);

    simulationRef.current = simulation;

    function ticked() {
      // Optimised DOM updates
      if (linkElementsRef.current) {
        const lines = linkElementsRef.current.querySelectorAll('line');
        // Match lines by index (assuming stable order from data map)
        filteredData.links.forEach((d, i) => {
          if (lines[i]) {
            lines[i].setAttribute('x1', d.source.x);
            lines[i].setAttribute('y1', d.source.y);
            lines[i].setAttribute('x2', d.target.x);
            lines[i].setAttribute('y2', d.target.y);
          }
        });
      }

      filteredData.nodes.forEach(node => {
        const el = nodeElementsRef.current.get(node.id);
        if (el) {
          // Bounding Box Logic (Soft Clamp)
          // const clampedX = Math.max(NODE_SIZE, Math.min(width - NODE_SIZE, node.x));
          // const clampedY = Math.max(NODE_SIZE, Math.min(height - NODE_SIZE, node.y));
          // node.x = clampedX; node.y = clampedY; // Modifying D3 state? Careful.

          el.style.transform = `translate3d(${node.x}px, ${node.y}px, 0)`;
        }
      });
    }

    return () => simulation.stop();
  }, [filteredData]);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          restorePreviousState();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleZoomReset();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          handleCenter();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  const handleBgClick = () => {
    // Restore previous state (focus mode exit)
    restorePreviousState();
  };

  // --- Interaction Helpers ---
  const isNodeDimmed = (nodeId) => {
    if (!selectedNode && !hoveredNode) return false;

    const focusNode = hoveredNode || selectedNode;
    if (focusNode.id === nodeId) return false;

    // Check if connected
    const isConnected = filteredData.links.some(l =>
      (l.source.id === focusNode.id && l.target.id === nodeId) ||
      (l.target.id === focusNode.id && l.source.id === nodeId)
    );

    return !isConnected;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden cursor-crosshair active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onClick={handleBgClick}
    >
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cbct-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Visualization Layer */}
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          style={{ transform: `scale(${zoomTransform.k}) translate(${zoomTransform.x}px, ${zoomTransform.y}px)` }}
        >
          <g ref={linkElementsRef}>
            {filteredData.links.map((link, i) => {
              // Calculate highlight states
              const sourceId = link.source.id || link.source;
              const targetId = link.target.id || link.target;
              const isHighlight = selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id);
              const isHoverHighlight = hoveredNode && (sourceId === hoveredNode.id || targetId === hoveredNode.id);

              return (
                <line
                  key={link.id || i}
                  stroke={isHighlight || isHoverHighlight ? "#58a6ff" : "rgba(255,255,255,0.05)"}
                  strokeWidth={isHighlight || isHoverHighlight ? 2 : 1}
                  className="transition-colors duration-300"
                />
              );
            })}
          </g>
        </svg>

        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ transform: `scale(${zoomTransform.k}) translate(${zoomTransform.x}px, ${zoomTransform.y}px)` }}
        >
          {filteredData.nodes.map((node) => (
            <div
              key={node.id}
              className="absolute top-0 left-0 will-change-transform pointer-events-auto"
              ref={(el) => {
                if (el) nodeElementsRef.current.set(node.id, el);
                else nodeElementsRef.current.delete(node.id);
              }}
            >
              <GraphNode
                node={node}
                mouseX={mouseX}
                mouseY={mouseY}
                onHover={setHoveredNode}
                onClick={setSelectedNode}
                isSelected={selectedNode?.id === node.id}
                isDimmed={isNodeDimmed(node.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Tooltip on Right Side (Or floating near node, but user asked for sidebar-like detail or robust insight) */}
      <AnimatePresence>
        {(hoveredNode || selectedNode) && (
          <DetailedNodeTooltip node={hoveredNode || selectedNode} />
        )}
      </AnimatePresence>

      {/* Accessibility Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-[#0B0B15]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
          <button
            onClick={handleZoomOut}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Zoom Out"
            aria-label="Zoom out graph view"
          >
            <ZoomOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleZoomReset}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Reset Zoom"
            aria-label="Reset zoom to default"
          >
            <RotateCcw className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleCenter}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Center View"
            aria-label="Center the graph view"
          >
            <Target className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleZoomIn}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
            title="Zoom In"
            aria-label="Zoom in graph view"
          >
            <ZoomIn className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

    </div>
  );
}
