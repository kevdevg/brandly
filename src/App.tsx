import React, { useState, useCallback, useMemo } from 'react';
import { DesignMD, TimelineElement, TimelineLayer, CompanyProfile, Project, ContentPiece, ContentPillar, ExpressTemplate } from './types';
import { TopHeader } from './components/TopHeader';
import { BrandArchitecture } from './components/BrandArchitecture';
import { Dashboard } from './components/Dashboard';
import { ProductionForm } from './components/dashboard/ProductionForm';
import { StudioEditor } from './components/studio/StudioEditor';
import { ExpressEditor } from './components/express/ExpressEditor';
import { StudioTopBar } from './components/studio/StudioTopBar';
import { EditorProvider, useEditor } from './context/EditorContext';
import { DEFAULT_DESIGN_MD, PREDEFINED_COMPANIES, DEFAULT_PILLARS } from './data/defaults';
import { useCustomTooltips } from './hooks/useCustomTooltips';
import { ToastProvider } from './components/ui/ToastProvider';
import { usePersistence, loadCompanies, useTemplatePersistence, loadTemplates } from './hooks/usePersistence';
import { ContentGridView } from './components/content-grid/ContentGridView';
import { TemplateBuilder } from './components/express/builder/TemplateBuilder';
import { EXPRESS_TEMPLATES } from './config/expressTemplates';
import { compileExpressToTimeline } from './utils/expressCompiler';
import { FullscreenToggle } from './components/ui/FullscreenToggle';

type Step = 'dashboard' | 'brand' | 'studio' | 'express' | 'content-grid' | 'template-builder' | 'production-form';

// ── Content persistence ──
const CONTENT_STORAGE_KEY = 'remix-content-data';
function loadContentData(): Record<string, { pieces: ContentPiece[]; pillars: ContentPillar[] }> | null {
  try {
    const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveContentData(data: Record<string, { pieces: ContentPiece[]; pillars: ContentPillar[] }>): void {
  try { localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function App() {
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    return loadCompanies() ?? PREDEFINED_COMPANIES;
  });
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('dashboard');
  const [designMD, setDesignMD] = useState<DesignMD>(DEFAULT_DESIGN_MD);
  const [outputFormat, setOutputFormat] = useState<'video' | 'image'>('video');

  // Global templates (decoupled from brands) — persisted
  const [globalTemplates, setGlobalTemplates] = useState<ExpressTemplate[]>(() => {
    return loadTemplates() ?? [];
  });
  const [templateBuilderFormat, setTemplateBuilderFormat] = useState<'video' | 'image'>('image');
  const [templateBuilderAspect, setTemplateBuilderAspect] = useState<ExpressTemplate['aspectRatio']>('9:16');
  const [editingGlobalTemplate, setEditingGlobalTemplate] = useState<ExpressTemplate | null>(null);

  // Production form state
  const [productionTemplate, setProductionTemplate] = useState<ExpressTemplate | null>(null);
  const [productionBrand, setProductionBrand] = useState<CompanyProfile | null>(null);

  // Merge preset + custom templates for the dashboard
  const allTemplates = useMemo(() => [
    ...EXPRESS_TEMPLATES,
    ...globalTemplates,
  ], [globalTemplates]);

  const handleSaveGlobalTemplate = useCallback((template: ExpressTemplate) => {
    setGlobalTemplates(prev => {
      const existing = prev.findIndex(t => t.id === template.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = template;
        return next;
      }
      return [...prev, template];
    });
    setEditingGlobalTemplate(null);
    setCurrentStep('dashboard');
  }, []);

  // Content grid state (per company)
  const [contentData, setContentData] = useState<Record<string, { pieces: ContentPiece[]; pillars: ContentPillar[] }>>(() => {
    return loadContentData() ?? {};
  });

  const getContentForCompany = useCallback((companyId: string) => {
    return contentData[companyId] ?? { pieces: [], pillars: [...DEFAULT_PILLARS] };
  }, [contentData]);

  const updateContentPieces = useCallback((companyId: string, pieces: ContentPiece[]) => {
    setContentData(prev => {
      const next = { ...prev, [companyId]: { ...prev[companyId] ?? { pillars: [...DEFAULT_PILLARS] }, pieces } };
      saveContentData(next);
      return next;
    });
  }, []);

  const updateContentPillars = useCallback((companyId: string, pillars: ContentPillar[]) => {
    setContentData(prev => {
      const next = { ...prev, [companyId]: { ...prev[companyId] ?? { pieces: [] }, pillars } };
      saveContentData(next);
      return next;
    });
  }, []);

  // Studio initial data (passed to EditorProvider when entering studio)
  const [studioInitialElements, setStudioInitialElements] = useState<TimelineElement[]>([]);
  const [studioInitialLayers, setStudioInitialLayers] = useState<TimelineLayer[]>([
    { id: 'layer-1', name: 'Capa Gráfica 1', type: 'visual' }
  ]);
  // Key to force remount EditorProvider when switching projects
  const [editorKey, setEditorKey] = useState(0);

  useCustomTooltips();
  usePersistence(companies);
  useTemplatePersistence(globalTemplates);

  const handleDesignChange = (key: keyof DesignMD, value: string | number | string[] | boolean) => {
    setDesignMD((prev) => {
      const newDesign = { ...prev, [key]: value };
      if (currentCompanyId) {
        setCompanies(prev2 => prev2.map(c => c.id === currentCompanyId ? { ...c, design: newDesign } : c));
      }
      return newDesign;
    });
  };

  const saveCurrentProject = (elements: TimelineElement[], layers: TimelineLayer[]) => {
    if (currentCompanyId) {
      setCompanies(prev => prev.map(c => {
        if (c.id !== currentCompanyId) return c;
        const projs = c.projects || [];
        if (currentProjectId) {
          return {
            ...c,
            projects: projs.map(p => p.id === currentProjectId ? { ...p, elements, layers } : p)
          };
        } else {
          const newId = `proj-${Date.now()}`;
          const newProject: Project = {
            id: newId,
            name: `Proyecto ${outputFormat === 'video' ? 'Video' : 'Imagen'} ${projs.length + 1}`,
            format: outputFormat,
            elements,
            layers
          };
          setCurrentProjectId(newId);
          return { ...c, projects: [...projs, newProject] };
        }
      }));
    }
  };

  const enterStudio = (design: DesignMD, format: 'video' | 'image', elements: TimelineElement[], layers: TimelineLayer[], companyId?: string, projectId?: string | null) => {
    if (companyId) setCurrentCompanyId(companyId);
    if (projectId !== undefined) setCurrentProjectId(projectId);
    setDesignMD(design);
    setOutputFormat(format);
    setStudioInitialElements(elements);
    setStudioInitialLayers(layers);
    setEditorKey(prev => prev + 1);
    setCurrentStep('studio');
  };

  // ── Blank canvas editors (no brand) ──
  const handleStartExpressBlank = useCallback(() => {
    setCurrentCompanyId(null);
    setDesignMD(DEFAULT_DESIGN_MD);
    setOutputFormat('video');
    setCurrentStep('express');
  }, []);

  const handleStartProBlank = useCallback(() => {
    const initialElements: TimelineElement[] = [{
      id: `el-content-${Date.now()}`,
      layerId: 'layer-1',
      type: 'text',
      content: 'Inserta tu contenido aquí',
      startFrame: 0,
      endFrame: 180,
      x: 50, y: 50,
      fontSize: 48,
      color: '#FFFFFF',
      fontFamily: DEFAULT_DESIGN_MD.baseFont,
    }];
    const initialLayers: TimelineLayer[] = [{ id: 'layer-1', name: 'Capa Gráfica 1', type: 'visual' }];
    enterStudio(DEFAULT_DESIGN_MD, 'video', initialElements, initialLayers, undefined, null);
  }, []);

  // ── Production flow: template × brand → form → editor ──
  const handleGenerate = useCallback((template: ExpressTemplate, brand: CompanyProfile) => {
    setProductionTemplate(template);
    setProductionBrand(brand);
    setCurrentStep('production-form');
  }, []);

  // ── Template management (edit / duplicate / delete) ──
  const handleEditTemplate = useCallback((template: ExpressTemplate) => {
    setEditingGlobalTemplate(template);
    setTemplateBuilderFormat(template.format);
    setCurrentStep('template-builder');
  }, []);

  const handleDuplicateTemplate = useCallback((template: ExpressTemplate) => {
    const copy: ExpressTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copia)`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      scenes: template.scenes.map(s => ({ ...s, id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    setGlobalTemplates(prev => [...prev, copy]);
  }, []);

  const handleDeleteTemplate = useCallback((id: string) => {
    setGlobalTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleProducePro = useCallback((fieldData: Record<string, string>) => {
    if (!productionTemplate || !productionBrand) return;
    // Compile template + brand + fieldData → TimelineElement[]
    const compiled = compileExpressToTimeline(productionTemplate, fieldData, productionBrand.design, productionBrand);
    enterStudio(productionBrand.design, productionTemplate.format, compiled.elements, compiled.layers, productionBrand.id, null);
  }, [productionTemplate, productionBrand]);

  return (
    <ToastProvider>
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {currentStep !== 'studio' && (
        <TopHeader 
          currentStep={currentStep} 
          setCurrentStep={(step) => {
            setCurrentStep(step);
          }} 
          outputFormat={outputFormat}
          onStartExpressBlank={handleStartExpressBlank}
          onStartProBlank={handleStartProBlank}
        />
      )}

      <div className="flex-1 flex overflow-hidden relative bg-neutral-950">
        
        {currentStep === 'dashboard' && (
          <Dashboard
            companies={companies}
            templates={allTemplates}
            onCreateBrand={(name, industry) => {
              const newAppId = Date.now().toString();
              const newBrand: CompanyProfile = {
                id: newAppId,
                name,
                industry,
                design: { ...DEFAULT_DESIGN_MD },
                projects: []
              };
              setCompanies(prev => [...prev, newBrand]);
              setCurrentCompanyId(newAppId);
              setDesignMD(newBrand.design);
              setCurrentStep('brand');
            }}
            onDeleteBrand={(id) => {
              setCompanies(prev => prev.filter(c => c.id !== id));
            }}
            onDuplicateBrand={(id) => {
              const original = companies.find(c => c.id === id);
              if (!original) return;
              const newId = Date.now().toString();
              const duplicate: CompanyProfile = {
                ...original,
                id: newId,
                name: `${original.name} (Copia)`,
                projects: [],
                design: { ...original.design, brandStickers: [...(original.design.brandStickers || [])] },
                socialLinks: original.socialLinks ? { ...original.socialLinks } : undefined,
              };
              setCompanies(prev => [...prev, duplicate]);
            }}
            onEditBrand={(design) => {
              const comp = companies.find(c => c.design === design);
              if (comp) setCurrentCompanyId(comp.id);
              setDesignMD(design);
              setCurrentStep('brand');
            }}
            onOpenContentGrid={(companyId) => {
              setCurrentCompanyId(companyId);
              setCurrentStep('content-grid');
            }}
            onCreateTemplate={(format, aspect) => {
              setTemplateBuilderFormat(format);
              setTemplateBuilderAspect(aspect);
              setEditingGlobalTemplate(null);
              setCurrentStep('template-builder');
            }}
            onEditTemplate={handleEditTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onGenerate={handleGenerate}
          />
        )}

        {currentStep === 'production-form' && productionTemplate && productionBrand && (
          <ProductionForm
            template={productionTemplate}
            brand={productionBrand}
            onBack={() => setCurrentStep('dashboard')}
            onProducePro={handleProducePro}
          />
        )}

        {currentStep === 'brand' && (
          <BrandArchitecture 
            company={companies.find(c => c.id === currentCompanyId)!}
            handleCompanyChange={(company) => {
              setCompanies(prev => prev.map(c => c.id === company.id ? company : c));
            }}
            designMD={designMD} 
            handleDesignChange={handleDesignChange} 
            onContinue={() => setCurrentStep('dashboard')}
          />
        )}

        {currentStep === 'content-grid' && currentCompanyId && (
          <ContentGridView
            company={companies.find(c => c.id === currentCompanyId)!}
            pieces={getContentForCompany(currentCompanyId).pieces}
            pillars={getContentForCompany(currentCompanyId).pillars}
            onPiecesChange={(pieces) => updateContentPieces(currentCompanyId, pieces)}
            onPillarsChange={(pillars) => updateContentPillars(currentCompanyId, pillars)}
            onOpenProject={(projectId) => {
              const comp = companies.find(c => c.id === currentCompanyId);
              if (comp) {
                const proj = comp.projects.find(p => p.id === projectId);
                if (proj) {
                  const layers = proj.layers.length > 0 ? proj.layers : [{ id: 'layer-1', name: 'Capa Gráfica 1', type: 'visual' as const }];
                  enterStudio(comp.design, proj.format, proj.elements, layers, comp.id, projectId);
                }
              }
            }}
          />
        )}

        {currentStep === 'express' && (
          <ExpressEditor
            designMD={designMD}
            company={companies.find(c => c.id === currentCompanyId)}
            onBack={() => setCurrentStep('dashboard')}
            onUpgradeToPro={(elements, layers) => {
              const comp = companies.find(c => c.id === currentCompanyId);
              enterStudio(designMD, outputFormat, elements, layers, comp?.id, null);
            }}
            onExport={(elements, layers, format) => {
              const comp = companies.find(c => c.id === currentCompanyId);
              enterStudio(designMD, format, elements, layers, comp?.id, null);
            }}
          />
        )}

        {currentStep === 'studio' && (
          <EditorProvider
            key={editorKey}
            initialDesignMD={designMD}
            initialElements={studioInitialElements}
            initialLayers={studioInitialLayers}
            initialFormat={outputFormat}
            brandContent={companies.find(c => c.id === currentCompanyId)?.brandContent}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <StudioTopBar setCurrentStep={setCurrentStep} />
              <StudioEditor />
            </div>
          </EditorProvider>
        )}

        {currentStep === 'template-builder' && (
          <TemplateBuilder
            availableBrands={companies}
            onSave={handleSaveGlobalTemplate}
            onBack={() => setCurrentStep('dashboard')}
            editingTemplate={editingGlobalTemplate}
            initialFormat={templateBuilderFormat}
            initialAspect={templateBuilderAspect}
          />
        )}
      </div>
      <FullscreenToggle />
    </div>
    </ToastProvider>
  );
}
