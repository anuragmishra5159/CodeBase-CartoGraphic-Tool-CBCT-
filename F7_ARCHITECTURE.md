# F7 Implementation Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  GraphCanvas Component                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ State Management                                      │  │
│  │ ├─ showDensitySignal (boolean)                       │  │
│  │ ├─ densityData (Map<nodeId, DensityInfo>)          │  │
│  │ └─ jitterOffsetsRef (Ref<Map>)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Data Flow                                             │  │
│  │                                                       │  │
│  │  processedData (nodes, links)                       │  │
│  │         │                                           │  │
│  │         ▼                                           │  │
│  │  calculateStructuralDensity()                       │  │
│  │         │                                           │  │
│  │         ▼                                           │  │
│  │  densityData Map                                    │  │
│  │  (density, isHigh, isMedium, isLow)               │  │
│  │         │                                           │  │
│  │         ▼                                           │  │
│  │  jitterOffsetsRef initialization                   │  │
│  │  (random phases for animation)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Rendering Pipeline                                   │  │
│  │                                                       │  │
│  │  paintNode(node, ctx, globalScale)                  │  │
│  │  {                                                   │  │
│  │    IF showDensitySignal ENABLED:                    │  │
│  │      densityInfo = densityData.get(node.id)         │  │
│  │      isHighDensity = densityInfo?.isHigh            │  │
│  │                                                       │  │
│  │      IF isHighDensity:                              │  │
│  │        // Apply jitter animation                     │  │
│  │        time = Date.now() * 0.003                    │  │
│  │        phase = jitterData.phase + time              │  │
│  │        drawX = node.x + sin(phase) * amplitude      │  │
│  │        drawY = node.y + cos(phase*0.8) * amplitude  │  │
│  │        jitterData.phase = phase                     │  │
│  │                                                       │  │
│  │        // Draw pressure effect                       │  │
│  │        drawPressureRing(drawX, drawY)                │  │
│  │        drawReducedInnerElement()                     │  │
│  │                                                       │  │
│  │      ELSE (Low/Medium density):                     │  │
│  │        // Draw calm aesthetic                        │  │
│  │        drawX = node.x (no jitter)                   │  │
│  │        drawY = node.y                               │  │
│  │        drawEnhancedHalo()                            │  │
│  │        drawHigherOpacityInner()                      │  │
│  │    ELSE:                                             │  │
│  │      // Standard rendering                          │  │
│  │      drawX = node.x                                 │  │
│  │      drawY = node.y                                 │  │
│  │  }                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ UI Controls                                           │  │
│  │                                                       │  │
│  │  Right Toolbar:                                      │  │
│  │  ├─ Force Graph / Radial View Toggle                │  │
│  │  ├─ Zoom Controls (±, Reset)                        │  │
│  │  ├─ Action Controls                                 │  │
│  │  │  ├─ Maximize                                      │  │
│  │  │  ├─ Refresh                                       │  │
│  │  │  ├─ Weak Edges Toggle                             │  │
│  │  │  └─ ⚡ F7 Density Toggle ◄───── HERE             │  │
│  │  │     (purple when enabled)                         │  │
│  │  └─ Bottom Controls (always visible)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Density Calculation Algorithm

```
function calculateStructuralDensity(nodes, links) {
  
  const densityMap = new Map();
  const neighborhood_radius = 400; // pixels
  
  for each node:
    
    // Count direct connections
    const neighbor_links = count(links where source=node OR target=node)
    
    // Count nearby nodes
    let nearby_count = 1 // self
    for each other_node:
      if distance(node, other_node) < neighborhood_radius:
        nearby_count++
    
    // Calculate normalized density
    const raw_density = (neighbor_links + nearby_count) / (total_nodes * 0.5)
    const normalized_density = min(raw_density, 1.0)
    
    // Categorize
    densityMap[node.id] = {
      density: normalized_density,
      isHigh: density > 0.6,
      isMedium: density >= 0.3 && density <= 0.6,
      isLow: density < 0.3
    }
  
  return densityMap
}
```

## Animation Algorithm

```
// Per frame, for each high-density node:

const current_time = Date.now(); // milliseconds
const scaled_time = current_time * 0.003; // slow progression

const phase = jitterData.phase + scaled_time;

// Primary motion (X axis)
const offset_x = sin(phase) * amplitude;

// Secondary motion (Y axis) with phase offset
const offset_y = cos(phase * 0.8) * amplitude * 0.7;

// Update phase for next frame
jitterData.phase = phase;

// Draw at offset position
ctx.arc(node.x + offset_x, node.y + offset_y, radius, ...)
```

## Visual State Matrix

```
┌──────────────┬─────────────┬──────────────┬────────────────┐
│ Density      │ Jitter      │ Visual Style │ Mental Signal  │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ HIGH (>0.6)  │ ✓ ACTIVE    │ Compressed   │ HIGH EFFORT    │
│              │ Wobble 2px  │ Pressure     │ Think Hard     │
│              │ 3-5Hz freq  │ rings        │                │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ MEDIUM       │ ✗ NONE      │ Standard     │ NORMAL EFFORT  │
│ (0.3-0.6)    │             │ Halos        │ Regular Code   │
│              │             │              │                │
├──────────────┼─────────────┼──────────────┼────────────────┤
│ LOW (<0.3)   │ ✗ NONE      │ Calm         │ EASY/STABLE    │
│              │ Static      │ Enhanced     │ Straightforward│
│              │             │ Clarity      │                │
└──────────────┴─────────────┴──────────────┴────────────────┘
```

## Animation Math Breakdown

### Jitter Amplitude
```
base_amplitude = 2 / globalScale
// Scales inversely with zoom
// At 1.0 zoom: 2px
// At 2.0 zoom: 1px (appears same size)
// At 0.5 zoom: 4px (very noticeable)
```

### Frequency Characteristics
```
Phase progression per frame (60fps):
- Frame time: ~16.67ms
- Time scale: 0.003
- Phase delta ≈ 0.05 radians per frame
- Frequency ≈ 0.05 / (2π) ≈ 0.008 cycles/frame
- ≈ 0.48 Hz (slow, meditative frequency)

Actual jitter visible frequency:
- Sine wave completes cycle every 125 frames
- At 60fps = 2.08 seconds per cycle
- Very subtle, noticeable but not distracting
```

### Phase Independence
```
Each node gets random initial phase:
jitterData.phase = Math.random() * Math.PI * 2

This prevents synchronized motion:
- Node A vibrates differently from Node B
- Creates organic, natural appearance
- No "flickering" effect
- Emphasizes individual node properties
```

## Integration Points

### 1. Data Processing
- **Input**: `processedData` (nodes, links)
- **Process**: `calculateStructuralDensity()`
- **Output**: `densityData` Map

### 2. Rendering
- **Input**: `densityData`, `showDensitySignal`, `jitterOffsetsRef`
- **Process**: `paintNode()` with jitter offset
- **Output**: Animated canvas rendering

### 3. User Control
- **Input**: Button click
- **Process**: Toggle `showDensitySignal`
- **Output**: Immediate visual change

## Performance Profile

### Memory Usage
```
- densityData: O(n) where n = number of nodes
- jitterOffsetsRef: O(k) where k = high-density nodes
- Typical ratio: k ≈ 0.2n (20% of nodes)
- Maps are cleaned on data change
```

### CPU Usage
```
Per frame (when density visible):
- Phase calculation: O(k) where k = high-density nodes
- Offset calculation: 3 arithmetic ops per node
- No additional canvas operations
- Negligible impact on rendering time
```

### Optimization Techniques
1. **Lazy calculation**: Only compute phase for high-density nodes
2. **Reference storage**: Use Ref to avoid state updates
3. **Time-based animation**: Single time source per frame
4. **Conditional rendering**: F7 effects only when enabled

## Debug/Inspection

To inspect density data:
```javascript
// In browser console:
const { store } = require('./useStore');
const state = store.getState();
console.log('Density Data:', densityData);

// Or inspect a specific node:
console.log('Node density:', densityData.get(node.id));
```

## Extension Points

Future enhancements could modify:
1. **Frequency**: Change `time * 0.003` scaling
2. **Amplitude**: Adjust `2 / globalScale` factor
3. **Phase relationship**: Change `0.8` multiplier for Y motion
4. **Density thresholds**: Adjust 0.6, 0.3 cutoff values
5. **Animation pattern**: Add different patterns for medium density
6. **Visual effects**: Add color shifts, glow intensity changes
