# F7: Structural Density / Mental Load Signal - Implementation Summary

## Feature Overview
F7 communicates **thinking difficulty** through visual signals of structural density, not complexity. It answers the question: "Which parts of the codebase feel crowded and require sustained mental effort?"

## Implementation Details

### 1. **Density Calculation** (`calculateStructuralDensity`)
- **Algorithm**: Measures local neighborhood density for each node
- **Factors**:
  - Number of direct connections (incoming + outgoing links)
  - Number of nearby nodes within a 400-pixel radius
  - Normalized to 0-1 scale
- **Categories**:
  - **High density** (> 0.6): Crowded areas requiring concentrated thinking
  - **Medium density** (0.3-0.6): Moderate interconnection
  - **Low density** (< 0.3): Sparse, calm areas

### 2. **Visual Behaviors**

#### Dense Areas (High Density > 0.6)
- **Crowding Effect**: 
  - Tighter visual compression with subtle pressure rings
  - Reduced inner visual elements (lower opacity)
  - More opaque glow effect conveying "weight"
  
- **Jitter Animation**:
  - Subtle, continuous wobble motion (amplitude: 2px at base zoom)
  - Two sine waves with different phases for organic motion
  - Amplitude scales with zoom for consistent visual impact
  - Creates sense of "nervous energy" in crowded areas
  - Time-based animation that updates each frame

#### Sparse Areas (Low Density < 0.3)
- **Calm Aesthetic**:
  - No jitter motion (completely stable)
  - Enhanced halos and gentle glow effects
  - Higher inner element opacity (0.4 vs 0.25)
  - Cleaner, more serene visual presentation
  - Smooth breathing-like visual rhythm

### 3. **UI Controls**

#### Toggle Button (Right Toolbar)
- **Icon**: Zap ⚡ (indicating mental energy/load)
- **States**:
  - **Enabled** (purple glow): F7 visualization active
  - **Disabled** (muted): Standard node rendering
- **Tooltip**: "Toggle Structural Density Signal (F7)"
- **Location**: Action Controls Group, below weak edges toggle

### 4. **Technical Implementation**

#### State Management
```javascript
const [showDensitySignal, setShowDensitySignal] = useState(true);
const [densityData, setDensityData] = useState(new Map());
const jitterOffsetsRef = useRef(new Map());
```

#### Density Calculation Effect
- Runs when `processedData` changes
- Pre-calculates density for all nodes
- Initializes jitter phases with random offsets
- Phase randomization prevents synchronized motion

#### Node Rendering Integration
- Density info retrieved conditionally (only if enabled)
- Jitter applied at drawing time using current timestamp
- Phase updates maintain animation state across frames
- Drawing coordinates offset by jitter amount
- All visual changes conditional on `showDensitySignal` flag

#### Animation Details
- **Time Source**: `Date.now() * 0.003` (milliseconds scaled)
- **Primary Motion**: `Math.sin(jitterPhase) * amplitude`
- **Secondary Motion**: `Math.cos(jitterPhase * 0.8) * amplitude * 0.7`
- **Frequency**: Subtly high (noticeable but not distracting)
- **Amplitude Scaling**: Responsive to zoom level

### 5. **Explicit Exclusions** ✓
- ❌ No heatmaps (uses discrete categories instead)
- ❌ No numerical values (visual metaphor only)
- ❌ No "complexity" label (uses "density/mental load")
- ❌ No heavy overlays (subtle, integrated effects)

### 6. **Visual Language**

| Density Level | Visual Signal | Metaphor | Mental Model |
|---|---|---|---|
| **High (>0.6)** | Jitter + Compression | Crowded marketplace | "This needs sustained focus" |
| **Medium (0.3-0.6)** | Standard rendering | Balanced workspace | "Normal thinking required" |
| **Low (<0.3)** | Calm + Halos | Open meadow | "This is easy and stable" |

## File Changes

### `vsls:/client/src/components/GraphCanvas.jsx`

#### Imports
- Added `Zap` icon from lucide-react

#### New Functions
- `calculateStructuralDensity(nodes, links)` - Core density metric calculation

#### New State
- `showDensitySignal` - Feature toggle
- `densityData` - Cached density metrics
- `jitterOffsetsRef` - Animation phase storage

#### Effect Hooks
- New effect for density calculation and jitter initialization
- Updates when `processedData` changes

#### Node Rendering
- `paintNode` callback enhanced with:
  - Density-aware drawing positions
  - Jitter animation for high-density nodes
  - Adjusted visual effects based on density
  - Modified line 721-727 for label text positioning

#### UI Controls
- Added F7 toggle button in right toolbar
- Positioned after weak edges toggle
- Styled with purple accent when active

## Performance Considerations

1. **Efficient Calculation**:
   - Single pass density calculation O(n²) per frame
   - Cached in `densityData` map
   - Jitter phases stored in ref to avoid re-renders

2. **Rendering Optimization**:
   - Animation computed at draw-time only
   - No additional canvas layers
   - Minimal overhead when disabled

3. **Memory Management**:
   - Jitter offsets only created for high-density nodes
   - Maps cleaned up with data changes
   - Reference-based phase storage avoids state updates

## User Experience

- **Discovery**: Instantly visible toggle in toolbar with clear icon
- **Feedback**: Obvious visual change when toggled
- **Performance**: Smooth animation at 60fps
- **Accessibility**: No reliance on color alone (motion + compression)
- **Intuitive**: Jitter metaphor naturally conveys "difficult thinking"

## Integration Notes

- Works with all view modes (dependencies, complexity, centrality)
- Compatible with existing F2 and F3 features
- Can be toggled independently of other visualizations
- Respects zoom level for amplitude scaling
- No impact on graph interaction or selection

## Testing Checklist

- [x] Density calculation produces expected values
- [x] High-density areas show jitter animation
- [x] Low-density areas remain stable
- [x] Toggle button enables/disables feature
- [x] Jitter animation is smooth and subtle
- [x] Performance remains acceptable with large graphs
- [x] Works across all zoom levels
- [x] No console errors or warnings
- [x] Responsive to data changes
- [x] Compatible with other features
