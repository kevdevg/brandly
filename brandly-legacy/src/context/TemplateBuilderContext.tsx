import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  TemplateField,
  TemplateFieldNature,
  TemplateFieldType,
  TemplateFieldStyle,
  TemplateFieldRules,
  BrandSource,
  ExpressScene,
  ExpressTemplate,
  DesignMD,
  CompanyProfile,
} from '../types';

// ── View modes ──
export type BuilderViewMode = 'design' | 'form-preview' | 'test-data';

// ── Template metadata ──
export interface TemplateMeta {
  name: string;
  description: string;
  category: ExpressTemplate['category'];
  aspectRatio: ExpressTemplate['aspectRatio'];
  format: 'video' | 'image';
  usesBrandAudio: boolean;
}

// ── Neutral defaults (no brand loaded) ──
export const NEUTRAL_DESIGN: DesignMD = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#1e1b4b',
  textColor: '#ffffff',
  baseFont: 'Inter, sans-serif',
  logoUrl: '',
  frameThickness: 0,
};

export const NEUTRAL_COMPANY: CompanyProfile = {
  id: 'neutral',
  name: 'Tu Marca',
  tagline: 'Tu eslogan aquí',
  projects: [],
  design: NEUTRAL_DESIGN,
  socialLinks: {
    instagram: '@usuario',
    tiktok: '@usuario',
    x: '@usuario',
    youtube: 'Tu Canal',
    website: 'www.tumarca.com',
  },
};

// ── Context state ──
export interface TemplateBuilderState {
  // Scene management
  scenes: ExpressScene[];
  setScenes: React.Dispatch<React.SetStateAction<ExpressScene[]>>;
  activeSceneId: string | null;
  setActiveSceneId: (id: string | null) => void;
  activeScene: ExpressScene | null;

  // Fields for the active scene (TemplateField[])
  fields: TemplateField[];
  addField: (params: {
    nature: TemplateFieldNature;
    type: TemplateFieldType;
    label: string;
    content?: string;
    brandSource?: BrandSource;
    brandAssetId?: string;
    position?: Partial<TemplateField['position']>;
    style?: Partial<TemplateFieldStyle>;
    rules?: TemplateFieldRules;
    required?: boolean;
  }) => string; // returns new id
  updateField: (id: string, updates: Partial<TemplateField>) => void;
  removeField: (id: string) => void;
  reorderField: (id: string, direction: 'up' | 'down') => void;
  /** Move a field to a specific array index (for drag & drop) */
  moveField: (id: string, toArrayIndex: number) => void;

  // Selection (bidirectional panel ↔ canvas)
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;

  // View mode
  viewMode: BuilderViewMode;
  setViewMode: (mode: BuilderViewMode) => void;

  // Test data (for test-data view mode)
  testFieldData: Record<string, string>;
  setTestFieldData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  testMediaFits: Record<string, 'cover' | 'contain' | 'fill'>;
  setTestMediaFits: React.Dispatch<React.SetStateAction<Record<string, 'cover' | 'contain' | 'fill'>>>;
  testContainBgColors: Record<string, string | null>;
  setTestContainBgColors: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;

  // Template metadata
  templateMeta: TemplateMeta;
  setTemplateMeta: React.Dispatch<React.SetStateAction<TemplateMeta>>;

  // Brand preview (optional)
  previewBrand: CompanyProfile | null;
  setPreviewBrand: (brand: CompanyProfile | null) => void;
  availableBrands: CompanyProfile[];

  // Resolved brand data (preview > props > neutral)
  resolvedDesignMD: DesignMD;
  resolvedCompany: CompanyProfile;

  /** @deprecated Use resolvedDesignMD instead */
  designMD: DesignMD;
  /** @deprecated Use resolvedCompany instead */
  company: CompanyProfile;

  // Derived counts
  editableSlotCount: number;
  totalFieldCount: number;

  // ── Segment (pre-roll / post-roll) management ──
  /** Add a pre-roll or post-roll segment */
  addSegment: (position: 'before' | 'after', source: 'brand' | 'form') => void;
  /** Remove the pre-roll or post-roll segment */
  removeSegment: (position: 'before' | 'after') => void;
  /** Update properties of a segment scene */
  updateSegment: (sceneId: string, updates: Partial<ExpressScene>) => void;
  /** The intro scene (first scene with type 'intro'), or null */
  introScene: ExpressScene | null;
  /** The outro scene (first scene with type 'outro'), or null */
  outroScene: ExpressScene | null;
}

const TemplateBuilderContext = createContext<TemplateBuilderState | null>(null);

export function useTemplateBuilder(): TemplateBuilderState {
  const ctx = useContext(TemplateBuilderContext);
  if (!ctx) throw new Error('useTemplateBuilder must be used within TemplateBuilderProvider');
  return ctx;
}

// ── Helper: get fields for a scene, preferring new `fields` over legacy `editableFields` ──
function getSceneFields(scene: ExpressScene): TemplateField[] {
  if (scene.fields && scene.fields.length > 0) return scene.fields;
  // Migrate legacy editableFields → TemplateField[]
  return migrateExpressFields(scene.editableFields);
}

/** Migrate legacy ExpressField[] to TemplateField[] */
export function migrateExpressFields(legacyFields: import('../types').ExpressField[]): TemplateField[] {
  return legacyFields.map((f, i): TemplateField => {
    // Determine nature from legacy data
    let nature: TemplateFieldNature = 'editable-slot';
    if (f.brandSource) nature = 'brand-variable';

    // Map legacy type to TemplateFieldType
    let type: TemplateFieldType = 'text';
    if (f.type === 'media') type = 'image';
    else if (f.type === 'logo') type = 'image';
    else if (f.type === 'shape') type = 'shape';
    else type = 'text';

    return {
      id: f.id,
      nature,
      label: f.label,
      type,
      required: f.required,
      content: f.placeholder || f.label,
      position: { ...f.position, rotation: 0 },
      brandSource: f.brandSource,
      brandAssetId: f.brandAssetId,
      rules: undefined,
      style: {
        fontSize: f.style.fontSize,
        fontWeight: f.style.fontWeight,
        fontFamily: f.style.fontFamily,
        textAlign: f.style.textAlign as TemplateFieldStyle['textAlign'],
        color: f.style.color,
        opacity: f.style.opacity,
        shapeType: f.style.shapeType,
        shapeFill: f.style.shapeFill,
        shapeStroke: f.style.shapeStroke,
        shapeStrokeWidth: f.style.shapeStrokeWidth,
        shapeCornerRadius: f.style.shapeCornerRadius,
      },
      formOrder: i,
    };
  });
}

// ── Helper: derive formOrder from array position (coupled mode) ──
function recalcFormOrder(fields: TemplateField[]): TemplateField[] {
  let order = 0;
  return fields.map(f => {
    if (f.nature === 'editable-slot') {
      return { ...f, formOrder: order++ };
    }
    return f;
  });
}

/**
 * Enforce scene ordering: intro(s) first, then content/transition, then outro(s) last.
 * This is called after every mutation to `scenes`.
 */
function enforceSceneOrder(scenes: ExpressScene[]): ExpressScene[] {
  const intros = scenes.filter(s => s.type === 'intro');
  const middles = scenes.filter(s => s.type === 'content' || s.type === 'transition');
  const outros = scenes.filter(s => s.type === 'outro');
  return [...intros, ...middles, ...outros];
}

// ── Provider ──

interface TemplateBuilderProviderProps {
  children: ReactNode;
  designMD?: DesignMD;
  company?: CompanyProfile;
  availableBrands?: CompanyProfile[];
  initialScenes: ExpressScene[];
  initialMeta: TemplateMeta;
}

export const TemplateBuilderProvider: React.FC<TemplateBuilderProviderProps> = ({
  children,
  designMD,
  company,
  availableBrands = [],
  initialScenes,
  initialMeta,
}) => {
  // ── Scenes ──
  const [scenes, setScenes] = useState<ExpressScene[]>(initialScenes);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(initialScenes[0]?.id || null);
  const activeScene = scenes.find(s => s.id === activeSceneId) || null;

  // ── Per-scene fields map ──
  const [sceneFieldsMap, setSceneFieldsMap] = useState<Record<string, TemplateField[]>>(() => {
    const map: Record<string, TemplateField[]> = {};
    for (const scene of initialScenes) {
      map[scene.id] = getSceneFields(scene);
    }
    return map;
  });

  const fields = activeSceneId ? (sceneFieldsMap[activeSceneId] || []) : [];

  // ── Field CRUD ──
  const updateSceneFields = useCallback((sceneId: string, updater: (prev: TemplateField[]) => TemplateField[]) => {
    setSceneFieldsMap(prev => ({
      ...prev,
      [sceneId]: updater(prev[sceneId] || []),
    }));
  }, []);

  const addField = useCallback((params: Parameters<TemplateBuilderState['addField']>[0]): string => {
    if (!activeSceneId) return '';
    const newId = `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const currentFields = sceneFieldsMap[activeSceneId] || [];
    const maxOrder = currentFields.reduce((max, f) => Math.max(max, f.formOrder), -1);

    const newField: TemplateField = {
      id: newId,
      nature: params.nature,
      type: params.type,
      label: params.label,
      required: params.required ?? false,
      content: params.content || params.label,
      position: {
        x: params.position?.x ?? 50,
        y: params.position?.y ?? 50,
        w: params.position?.w ?? (params.type === 'text' || params.type === 'sticker' ? 80 : 40),
        h: params.position?.h ?? (params.type === 'text' ? 10 : params.type === 'sticker' ? 8 : 20),
        rotation: params.position?.rotation ?? 0,
      },
      brandSource: params.brandSource,
      brandAssetId: params.brandAssetId,
      rules: params.rules,
      style: {
        fontSize: params.style?.fontSize ?? (params.type === 'text' ? 24 : params.type === 'sticker' ? 14 : undefined),
        fontWeight: params.style?.fontWeight ?? (params.type === 'text' ? 400 : params.type === 'sticker' ? 500 : undefined),
        textAlign: params.style?.textAlign ?? (params.type === 'sticker' ? 'left' : 'center'),
        opacity: params.style?.opacity ?? 100,
        color: params.style?.color,
        fontFamily: params.style?.fontFamily,
        shapeType: params.style?.shapeType,
        shapeFill: params.style?.shapeFill,
        shapeStroke: params.style?.shapeStroke,
        shapeStrokeWidth: params.style?.shapeStrokeWidth,
        shapeCornerRadius: params.style?.shapeCornerRadius,
        sticker: params.style?.sticker,
      },
      formOrder: maxOrder + 1,
    };

    updateSceneFields(activeSceneId, prev => [...prev, newField]);
    return newId;
  }, [activeSceneId, sceneFieldsMap, updateSceneFields]);

  const updateFieldCb = useCallback((id: string, updates: Partial<TemplateField>) => {
    if (!activeSceneId) return;
    updateSceneFields(activeSceneId, prev =>
      prev.map(f => f.id === id ? { ...f, ...updates } : f)
    );
  }, [activeSceneId, updateSceneFields]);

  const removeField = useCallback((id: string) => {
    if (!activeSceneId) return;
    updateSceneFields(activeSceneId, prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [activeSceneId, updateSceneFields]);

  const reorderField = useCallback((id: string, direction: 'up' | 'down') => {
    if (!activeSceneId) return;
    updateSceneFields(activeSceneId, prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx === -1) return prev;

      // Background fields are pinned to the bottom — can't move
      if (prev[idx].isBackground) return prev;

      // In the array: index 0 = bottom (back), last = top (front)
      // In the layers panel (Photoshop convention): "up" means toward front = higher index
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;

      // Can't swap with background layer
      if (prev[swapIdx].isBackground) return prev;

      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

      // Recalculate formOrder for editable-slots based on array position (coupled mode)
      return recalcFormOrder(next);
    });
  }, [activeSceneId, updateSceneFields]);

  const moveField = useCallback((id: string, toArrayIndex: number) => {
    if (!activeSceneId) return;
    updateSceneFields(activeSceneId, prev => {
      const fromIdx = prev.findIndex(f => f.id === id);
      if (fromIdx === -1 || fromIdx === toArrayIndex) return prev;

      // Background fields are pinned — can't move
      if (prev[fromIdx].isBackground) return prev;

      // Clamp: can't go below background at index 0
      let targetIdx = toArrayIndex;
      if (prev[0]?.isBackground && targetIdx === 0) targetIdx = 1;

      if (fromIdx === targetIdx) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(targetIdx, 0, moved);

      return recalcFormOrder(next);
    });
  }, [activeSceneId, updateSceneFields]);

  // ── Selection ──
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // ── View mode ──
  const [viewMode, setViewMode] = useState<BuilderViewMode>('design');

  // ── Test data (for test-data view mode) ──
  const [testFieldData, setTestFieldData] = useState<Record<string, string>>({});
  const [testMediaFits, setTestMediaFits] = useState<Record<string, 'cover' | 'contain' | 'fill'>>({});
  const [testContainBgColors, setTestContainBgColors] = useState<Record<string, string | null>>({});

  // ── Template metadata ──
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta>(initialMeta);

  // ── Brand preview ──
  const [previewBrand, setPreviewBrand] = useState<CompanyProfile | null>(
    company ?? null
  );

  // Resolved brand: preview > props > neutral
  const resolvedCompany = previewBrand ?? company ?? NEUTRAL_COMPANY;
  const resolvedDesignMD = resolvedCompany.design ?? designMD ?? NEUTRAL_DESIGN;

  // ── Derived counts ──
  const editableSlotCount = fields.filter(f => f.nature === 'editable-slot').length;
  const totalFieldCount = fields.length;

  // ── Derived segment state ──
  const introScene = scenes.find(s => s.type === 'intro') || null;
  const outroScene = scenes.find(s => s.type === 'outro') || null;

  // ── Segment CRUD ──
  const addSegment = useCallback((position: 'before' | 'after', source: 'brand' | 'form') => {
    const now = Date.now();
    const isIntro = position === 'before';

    // Default duration: try to use brand duration, fallback to 5s
    const brandDurationFrames = isIntro
      ? resolvedDesignMD.introDurationFrames
      : resolvedDesignMD.outroDurationFrames;
    const defaultDuration = brandDurationFrames ? brandDurationFrames / 30 : 5;

    const newScene: ExpressScene = {
      id: `segment-${isIntro ? 'intro' : 'outro'}-${now}`,
      type: isIntro ? 'intro' : 'outro',
      name: isIntro
        ? (source === 'brand' ? 'Intro de marca' : 'Video de intro')
        : (source === 'brand' ? 'Outro de marca' : 'Video de cierre'),
      durationSeconds: source === 'brand' ? defaultDuration : 5,
      layout: 'fullscreen-media',
      editableFields: [],
      fields: [],
      segmentSource: source,
      segmentFieldLabel: source === 'form'
        ? (isIntro ? 'Video de intro' : 'Video de cierre')
        : undefined,
      segmentFieldRequired: source === 'form' ? true : undefined,
      segmentTransition: { type: 'fade', duration: 10 },
      background: { type: 'brand' },
    };

    setScenes(prev => {
      // Remove existing segment of same type
      const filtered = prev.filter(s => s.type !== (isIntro ? 'intro' : 'outro'));
      return enforceSceneOrder([...filtered, newScene]);
    });
  }, [resolvedDesignMD, setScenes]);

  const removeSegment = useCallback((position: 'before' | 'after') => {
    const targetType = position === 'before' ? 'intro' : 'outro';
    setScenes(prev => prev.filter(s => s.type !== targetType));
    // If the removed scene was active, switch to first content scene
    const firstContent = scenes.find(s => s.type === 'content');
    if (activeSceneId && scenes.find(s => s.id === activeSceneId)?.type === targetType) {
      setActiveSceneId(firstContent?.id || null);
    }
  }, [scenes, activeSceneId, setScenes, setActiveSceneId]);

  const updateSegment = useCallback((sceneId: string, updates: Partial<ExpressScene>) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updates } : s));
  }, [setScenes]);

  // ── Expose getSceneFieldsMap for save ──
  // We attach it to the context so TemplateBuilder can access all scene fields at save time
  const value: TemplateBuilderState & { _sceneFieldsMap: Record<string, TemplateField[]> } = {
    scenes,
    setScenes,
    activeSceneId,
    setActiveSceneId: useCallback((id: string | null) => {
      setActiveSceneId(id);
      setSelectedFieldId(null);
    }, []),
    activeScene,

    fields,
    addField,
    updateField: updateFieldCb,
    removeField,
    reorderField,
    moveField,

    selectedFieldId,
    setSelectedFieldId,

    viewMode,
    setViewMode,

    testFieldData,
    setTestFieldData,
    testMediaFits,
    setTestMediaFits,
    testContainBgColors,
    setTestContainBgColors,

    templateMeta,
    setTemplateMeta,

    previewBrand,
    setPreviewBrand,
    availableBrands,

    resolvedDesignMD,
    resolvedCompany,

    // Deprecated aliases (backward compat during migration)
    designMD: resolvedDesignMD,
    company: resolvedCompany,

    editableSlotCount,
    totalFieldCount,

    // Segment management
    addSegment,
    removeSegment,
    updateSegment,
    introScene,
    outroScene,

    // Internal: for save access
    _sceneFieldsMap: sceneFieldsMap,
  };

  return (
    <TemplateBuilderContext.Provider value={value}>
      {children}
    </TemplateBuilderContext.Provider>
  );
};

/**
 * Access the internal scene fields map (for save operations).
 * Must be called within TemplateBuilderProvider.
 */
export function useSceneFieldsMap(): Record<string, TemplateField[]> {
  const ctx = useContext(TemplateBuilderContext) as TemplateBuilderState & { _sceneFieldsMap?: Record<string, TemplateField[]> };
  if (!ctx) throw new Error('useSceneFieldsMap must be used within TemplateBuilderProvider');
  return ctx._sceneFieldsMap || {};
}
