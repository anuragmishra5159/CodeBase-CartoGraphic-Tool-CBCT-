# F7 Quick Start Guide

## Activating the Feature

The **Structural Density / Mental Load Signal** is located in the right-side toolbar.

### Toggle Button Location
```
┌─ Right Toolbar ──────────────────┐
│                                  │
│  ◉ Share2     ← Force Graph      │
│  ○ Orbit      ← Radial View      │
│  ────────────────────────────── │
│  ┌ Zoom Controls                │
│  │ + │ -                        │
│  └─────────────────────────────  │
│  ┌ Actions                      │
│  │ ⬜ Maximize                  │
│  │ ↻  Refresh                  │
│  │ ⊟ Weak Edges               │
│  │ ⚡ F7 Density ← HERE        │
│  └─────────────────────────────  │
│                                  │
└──────────────────────────────────┘
```

### Visual Indicators
- **Purple glow**: F7 is ENABLED (showing density)
- **Muted gray**: F7 is DISABLED (standard rendering)

## What You'll See

### Dense Areas (Crowded Code)
When enabled, areas with many interdependent files will:
- **Vibrate slightly** with subtle jitter animation
- **Feel compressed** with tighter visual spacing
- **Show reduced inner elements** (less visual noise)
- **Convey mental load** - "This requires concentrated thinking"

**Example**: Service layers with many dependencies, shared utilities, cross-cutting concerns

### Sparse Areas (Clean Code)  
Areas with few dependencies will:
- **Remain perfectly still** (no jitter)
- **Show soft halos** (gentle, calm effect)
- **Have higher visual clarity** with visible inner elements
- **Convey stability** - "This is straightforward"

**Example**: Utility modules, dedicated components, isolated features

## Understanding the Signal

```
Visual Behavior          ↔  Mental Load Implied
─────────────────────────────────────────────────
Jitter + Compression         HIGH effort needed
                            (think carefully)
                            
Standard rendering          MEDIUM effort
                            (normal coding)
                            
Calm + Halos               LOW effort
                            (easy to understand)
```

## Using F7 with Other Features

F7 works seamlessly with:
- **View modes**: Dependencies, Complexity, Centrality
- **Weak edges toggle**: Shows cluster boundaries
- **Zoom controls**: Jitter scales with zoom
- **Node selection**: Card view unaffected

**Tip**: Combine F7 with **Complexity view** to see where high complexity AND high density coincide - these are critical refactoring targets!

## Tips for Code Review

1. **Find hotspots**: Look for areas with strong jitter - these are cognitively demanding
2. **Verify stability**: Sparse areas should feel calm - if not, unexpected dependencies may exist
3. **Refactoring targets**: Dense + complex areas are prime candidates for modularization
4. **Architecture validation**: Clear density patterns indicate good or poor architectural separation

## Technical Details

- **No numbers shown**: F7 uses visual metaphor, not metrics
- **No heatmaps**: Discrete categories (high/medium/low) avoid false precision
- **Animation-based**: Jitter communicates "mental effort," not complexity
- **Real-time**: Density recalculated as graph data changes

## Keyboard Access

The F7 toggle can be accessed via:
- Click the **⚡ Zap icon** in the right toolbar
- (Keyboard shortcut can be added if needed)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too much jitter | Consider zooming in to reduce motion |
| No jitter visible | Ensure F7 is enabled (purple glow) |
| Animation stuttering | Check your network/browser performance |
| Jitter not smooth | Verify frame rate - try refreshing the layout |

---

**Remember**: F7 signals **thinking difficulty**, not code complexity. Use it to understand the mental load required to navigate and modify different areas of the codebase.
