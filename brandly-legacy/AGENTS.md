# Development Decisions

- **Modularization:** Architect the application using small, modular, well-encapsulated components organized into appropriate subdirectories under `/src/components`. Avoid creating massive monolithic files (especially for complex UI like the timeline or property panels). Break them down into logical child components (e.g., `TimelineRuler`, `TimelineTrack`, `TimelineControls`). Keep all components focused on a single responsibility.
- **Tooltips:** Always include `title` attributes (tooltips) on every actionable button or icon button in the editor panels to improve accessibility and user experience.

---

# Component Reuse & Abstraction Rules

> **Golden Rule:** If a pattern or UI control exists in one editor and is needed in another, ALWAYS abstract it into a shared component/hook before duplicating code. Never copy-paste drag logic, inspector controls, or canvas patterns.

## Shared Hooks (`/src/hooks/`)

| Hook | Purpose | Used By |
|---|---|---|
| `useDragResize` | Pointer-based drag & resize on any canvas (pointer capture → delta % → clamp → snap) | `BuilderCanvas`, and should be used by `BrandContentEditor`. Future: `CompositionElement`. |

**When to use `useDragResize`:** Any time you need to move or resize elements on a canvas using pointer events. Do NOT implement custom `pointerDown/Move/Up` state machines — use this hook.

## Shared UI Components (`/src/components/ui/`)

| Component | Purpose | Generic Interface | Used By |
|---|---|---|---|
| `FieldInspector` | Position grid (X/Y/W/H %), alignment, font, color, opacity | `FieldPosition` + `FieldTextStyle` | `FieldConfigPanel` (Template Builder), `SceneConfigurator`. Future: abstracted from `ElementPropertiesPanel`. |
| `AlignmentTools` | Quick-align to canvas edges/center | `onAlign: ({x?, y?}) => void` | `FieldInspector`. Future: `ElementPropertiesPanel`. |
| `FontPicker` | Google Fonts selector with search, recents, categories | `value: string, onChange: (font) => void` | `FieldInspector`, `FieldConfigPanel`, `ElementPropertiesPanel` |
| `TextStylePresets` | Quick-apply text style configurations | `TimelineElement` (needs future abstraction) | `ElementPropertiesPanel` |
| `CanvasWorkspace` | Figma-like pasteboard with aspect ratio frame + overlay layer | Generic wrapper | `StudioWorkspace`. |
| `CanvasZoomControls` | Zoom in/out/reset UI | Zoom state props | `StudioWorkspace` |
| `CollapsibleSection` | Collapsible panel section with badge for active count | `title, badge?, defaultOpen?, children` | `ElementPropertiesPanel`, `GlobalSettingsPanel`, `FieldSchemaPanel`, `FieldConfigPanel` |

## UX Pattern: Basic / Advanced

**Rule:** Any configuration panel with more than ~6 controls MUST split into "Basic" (always visible) and "Advanced" (collapsible, closed by default).

- Use `CollapsibleSection` for the advanced sections.
- The `badge` prop should count active/modified options so users know something is configured without opening.
- Group related advanced controls into named sections (e.g., "Tipografía Avanzada", "Color Avanzado", "Efectos de Texto").

**Current splits:**

| Panel | Basic | Advanced |
|---|---|---|
| `ElementPropertiesPanel` (text) | Color, Recientes, Tamaño, Fuente, Alineación, B/I/U/S | ▶ Color Avanzado, ▶ Tipografía Avanzada, ▶ Efectos de Texto |
| `GlobalSettingsPanel` | Background colors, Gradients | ▶ Herramientas, ▶ Opciones de Fondo, ▶ Vista |
| `FieldConfigPanel` | Etiqueta, Naturaleza, Tipo, Posición (FieldInspector) | ▶ Reglas de Validación |

## Abstraction Checklist

Before creating any new editor panel, canvas, or property inspector, check:

1. **Does `useDragResize` cover the drag pattern?** → Use it, don't create custom pointer handlers.
2. **Does `FieldInspector` cover the property controls?** → Use it for position/text/font editing.
3. **Does `AlignmentTools` cover alignment?** → Use it via `onAlign` callback.
4. **Does `FontPicker` exist?** → Always use it for font selection, never create inline font dropdowns.
5. **Does `CanvasWorkspace` cover the canvas wrapper?** → Use it for the pasteboard + aspect frame.
6. **Does the panel have >6 controls?** → Use `CollapsibleSection` to split basic/advanced.

## Interface Design Rules

- **Generic interfaces over coupled ones.** Use `onAlign: ({x?, y?}) => void` instead of `onUpdate: (Partial<TimelineElement>) => void`. This allows any data model to use the component.
- **Percentage-based coordinates.** All canvas positions use 0-100% relative to container. Never use pixels for position storage.
- **Brand context props.** Pass `brandFont`, `brandColors[]` to inspectors so they can show brand-aware quick-picks.

---

# Editor Architecture

## Three Editors, Shared Foundation

| Editor | Purpose | Canvas | Properties | Context |
|---|---|---|---|---|
| **Studio** (`StudioEditor`) | Full video editor with timeline | `StudioWorkspace` + `CompositionElement` | `ElementPropertiesPanel` (2549 LOC monolith) | `EditorProvider` |
| **Express** (`ExpressEditor`) | Simplified brand template usage | Remotion Player | `ExpressStylePanel` | N/A |
| **Template Builder** (`TemplateBuilder`) | Create/edit brand templates | `BuilderCanvas` (lightweight) | `FieldConfigPanel` + `FieldSchemaPanel` | `TemplateBuilderContext` |

## Template Builder Architecture

The Template Builder uses its own `TemplateBuilderContext` (NOT `EditorProvider`) to manage `TemplateField[]` directly.

**Key concept:** A template is two artifacts simultaneously:
1. **Layout fijo** — visual composition (positions, styles, backgrounds) inherited from DesignMD.
2. **Esquema de campos** — typed list of editable slots, brand variables, and static elements.

**TemplateField nature types:**

| Nature | Purpose | Badge | Generates form field? |
|---|---|---|---|
| `static` | Fixed decorative element | none | ❌ |
| `brand-variable` | Auto-fills from DesignMD | 🏷️ "auto" violet | ❌ |
| `editable-slot` | User fills in production | 🏷️ label, blue dashed | ✅ |

**Component layout:**
- Left: `FieldSchemaPanel` — field list by nature, counter, add buttons
- Center: `BuilderCanvas` (design view) or `FormPreviewPanel` (form preview)
- Right: `FieldConfigPanel` — per-field properties (label, nature, type, position, rules)
- Bottom (video only): `SceneComposer`

**Data flow:** `TemplateField[]` → (save) → `ExpressScene.fields` + backward-compat `editableFields` → (Express) → `compileExpressToTimeline` → `TimelineElement[]` for Remotion.

## Data Model Adapter (`src/utils/builderAdapter.ts`)

**DEPRECATED for Template Builder.** The builder now uses `TemplateField[]` directly via `TemplateBuilderContext`.

Kept only for legacy templates. Legacy conversion functions:
- `fieldsToElements()` — Load: `ExpressField[]` → `TimelineElement[]`
- `elementsToFields()` — Save: `TimelineElement[]` → `ExpressField[]`

New templates save both `scene.fields` (TemplateField[]) and `scene.editableFields` (ExpressField[]) for backward compatibility.

## Format-Aware UI

- Templates can be **video** or **image** format.
- Format is chosen BEFORE entering the builder (inline picker in `BrandTabTemplates`).
- Image format hides: scene type selector, duration, timeline (SceneComposer), intro/outro, audio toggles.
- Video format shows all features.

## Canvas Patterns

All canvases should follow this pattern:
1. **Container ref** for `getBoundingClientRect()` calculations
2. **`useDragResize` hook** for pointer interactions
3. **Percentage-based positioning** (0-100%) stored in data model
4. **Snap guides** rendered as absolute-positioned lines in the canvas
5. **Selection state** managed by parent, passed down as `selectedId`

## Known Technical Debt

- `ElementPropertiesPanel` (2549 LOC) is a monolith coupled to `TimelineElement`. Should be broken into sections using `FieldInspector` pattern.
- `StudioWorkspace` + `CompositionElement` have their own drag logic that predates `useDragResize`. Should migrate in a future refactor.
- `TextStylePresets` is coupled to `TimelineElement`. Should be abstracted like `AlignmentTools` was.
- `BuilderScenePanel` and `SceneConfigurator` are deprecated — replaced by `FieldSchemaPanel` and `FieldConfigPanel`.