# Filter Tool Implementation Plan

**Objective**: Create a Batch Image Editor with Lightroom-style controls and 3D LUT support, following the modular `ToolLayout` architecture.

## 1. Directory Structure
```
src/
  components/
    tools/
      filter/
        FilterTool.tsx         # Main Orchestrator
        FilterEngine.ts        # WebGL Processor (Custom Class)
        components/
            DevelopPanel.tsx   # Right Sidebar (Sliders)
            AssetSidebar.tsx   # Left Sidebar (Grid)
            Histogram.tsx      # (Optional) Visual feedback
        shaders/
            vertex.glsl        # Basic vertex shader
            fragment.glsl      # Complex color processing shader
        utils/
            lutParser.ts       # .cube file parser (and .png CLUTs)
```

## 2. Core Features (The "Develop" Panel)

The UI will replicate professional editing controls:

### Profile / LUT
- **Input**: Dropdown + Import button for `.cube` files.
- **Logic**: 3D Texture lookup in WebGL.
- **Reference**: Adobe Camera Raw / Lightroom 'Profile' section.

### Light (Tone Mapping)
- **Exposure**: Multiplier (2^ev).
- **Contrast**: S-curve centered at 0.5.
- **Highlights**: Compresses high luminance areas (Tone mapping).
- **Shadows**: Boosts low luminance areas (Tone mapping).
- **Whites**: Adjusts the white point clipping.
- **Blacks**: Adjusts the black point clipping.

### Color
- **Temp/Tint**: White Balance adjustment (Matrix multiplication).
- **Vibrance**: Saturation boost that protects skin tones/already saturated pixels.
- **Saturation**: Global saturation multiplier.

## 3. Architecture & State

### State Management
- `activePhotoId`: string
- `photos`: Array<{ id, url, config, originalFile }>
- `globalConfig`: The "preset" being applied/edited.
  - *Logic*: Editing sliders updates `globalConfig`. This config is applied to the `activePhoto` preview immediately.
  - *Bulk Action*: "Apply to All" copies `globalConfig` to every photo's distinct config.

### Filter Engine (WebGL)
- **Why WebGL?**:
    - "Highlights/Shadows" and 3D LUTs require per-pixel math that is expensive on CPU.
    - We need 60fps slider dragging on 12MP+ images.
- **Implementation**:
    - `FilterEngine` class manages the GL context.
    - It compiles a dynamic Fragment Shader based on enabled modules (or one ubershader).
    - It accepts an `HTMLImageElement` as a texture source.
    - It renders to a hidden canvas, which is then drawn to the visible canvas (or used directly).

## 4. Work Breakdown

### Phase 1: Engine Core
1.  **WebGL Setup**: Initialize GL context, load texture, basic render loop.
2.  **Shader Writing**: Implement the math for Exposure, Contrast, WB, and basic color grading.
3.  **LUT Support**: Implement 3D Texture loading for `.cube` files.

### Phase 2: UI Construction
4.  **Layout**: Use `ToolLayout` with `AssetSidebar` (Left) and `DevelopPanel` (Right).
5.  **Develop Panel**: Create high-quality, granular sliders (using Radix UI or a custom implementation for precise control).
6.  **Asset Sidebar**: Grid view of photos with "Add", "Remove", and thumbnail preview.

### Phase 3: Integration
7.  ** wiring**: Connect Slider `onChange` -> `Update Config` -> `FilterEngine.render()`.
8.  **Export**: Loop through all photos -> Render at full res -> Zip -> Download.
9.  **Registration**: Add to `tools.config.tsx`.

## 5. Technical Notes
- **Performance**: Use `requestAnimationFrame` for rendering to avoid UI blocking.
- **Memory**: Be careful with creating too many WebGL contexts. Use ONE context and swap textures.
- **Libraries**:
    - `gl-react` is an option, but raw WebGL/twgl.js might be lighter for this specific use case.
    - `papaparse` or simple string splitting for parsing `.cube` files.
Updating plan to clarify Native WebGL usage
