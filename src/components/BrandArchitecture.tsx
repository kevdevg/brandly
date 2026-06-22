import React, { useState, useCallback } from 'react';
import { Save, AlertCircle, Crown } from 'lucide-react';
import { DesignMD, CompanyProfile } from '../types';
import { BrandTabGeneral } from './brand/BrandTabGeneral';
import { BrandTabVisual } from './brand/BrandTabVisual';
import { BrandTabTypography } from './brand/BrandTabTypography';
import { BrandTabMedia } from './brand/BrandTabMedia';
import { BrandPreview } from './brand/BrandPreview';
import { Toast } from './ui/Toast';

interface BrandArchitectureProps {
  company: CompanyProfile;
  handleCompanyChange: (company: CompanyProfile) => void;
  designMD: DesignMD;
  handleDesignChange: (key: keyof DesignMD, value: string | number | string[] | boolean) => void;
  onContinue: () => void;
}

const TABS = [
  { id: 'general', label: 'Información', icon: '📋' },
  { id: 'visual', label: 'Visual y Colores', icon: '🎨' },
  { id: 'typography', label: 'Tipografía', icon: '🔤' },
  { id: 'media', label: 'Video y Audio', icon: '🎬' },
] as const;

type TabId = typeof TABS[number]['id'];

export const BrandArchitecture: React.FC<BrandArchitectureProps> = ({ company, handleCompanyChange, designMD, handleDesignChange, onContinue }) => {
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<'16:9'|'1:1'|'9:16'>('9:16');
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [showToast, setShowToast] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validate = useCallback((): string[] => {
    const errors: string[] = [];
    if (!company?.name || company.name.trim().length < 2) {
      errors.push('El nombre de la marca es requerido (mín. 2 caracteres)');
    }
    if (!designMD.logoUrl || designMD.logoUrl.trim().length === 0) {
      errors.push('El logo de la marca es requerido');
    }
    return errors;
  }, [company, designMD]);

  const handleSave = () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => setValidationErrors([]), 5000);
      return;
    }
    setValidationErrors([]);
    setShowToast(true);
    setTimeout(() => {
      onContinue();
    }, 800);
  };



  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      {/* ═══ Sticky Header: Title + Brand Identity ═══ */}
      <div className="shrink-0 sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/60">
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Title + Description */}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white tracking-tight">Reglas de tu Marca (Design MD)</h2>
              <p className="text-sm text-neutral-400 leading-relaxed mt-1">
                Establece el plano arquitectónico visual de la empresa. Todos los videos y renders
                futuros adoptarán estrictamente estos parámetros sin intervención de IA.
              </p>
            </div>

            {/* Right: Brand Identity Card + Save */}
            <div className="shrink-0 flex items-center gap-3">
              {/* Brand Identity Card */}
              <div className="flex items-center gap-3 bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                {/* Logo / Avatar */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                  {designMD.logoUrl ? (
                    <img
                      src={designMD.logoUrl}
                      alt={company.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-lg font-bold text-neutral-500">
                      {company.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                {/* Name + Plan */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                    {company.name || 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Crown size={10} className="text-amber-400 shrink-0" />
                    <span className="text-[10px] font-medium text-amber-400/80 tracking-wide uppercase">
                      {company.industry || 'Marca'}
                    </span>
                  </div>
                </div>
                {/* Brand color dot indicator */}
                <div className="flex flex-col gap-1 ml-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white/10 shadow-sm"
                    style={{ backgroundColor: designMD.primaryColor }}
                    title={`Primario: ${designMD.primaryColor}`}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/10 shadow-sm"
                    style={{ backgroundColor: designMD.secondaryColor }}
                    title={`Secundario: ${designMD.secondaryColor}`}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                title="Guardar marca"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30"
              >
                <Save size={14} />
                Guardar
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Full-Width Tabbar ═══ */}
        <div className="px-8 pb-0">
          <div className="flex bg-neutral-900/60 border border-neutral-800 rounded-t-xl overflow-hidden">
            {TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-[13px] font-medium transition-all relative ${
                    isActive
                      ? 'bg-neutral-800/80 text-white'
                      : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/30'
                  } ${idx > 0 ? 'border-l border-neutral-800/50' : ''}`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden text-xs">{tab.label.split(' ')[0]}</span>
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Main Content: Form + Preview Split ═══ */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Form Column */}
        <div className="w-1/2 overflow-y-auto border-r border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
          <div className="max-w-xl mx-auto p-8 space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 space-y-1.5">
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-sm text-rose-300 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'general' && (
              <BrandTabGeneral company={company} handleCompanyChange={handleCompanyChange} />
            )}
            {activeTab === 'visual' && (
              <BrandTabVisual 
                designMD={designMD} 
                handleDesignChange={handleDesignChange} 
              />
            )}
            {activeTab === 'typography' && (
              <BrandTabTypography designMD={designMD} handleDesignChange={handleDesignChange} />
            )}
            {activeTab === 'media' && (
              <BrandTabMedia
                designMD={designMD}
                handleDesignChange={handleDesignChange}
              />
            )}



          </div>
        </div>

        {/* Preview Column */}
        <BrandPreview 
          designMD={designMD} 
          company={company}
          activeTab={activeTab}
          zoom={zoom} 
          setZoom={setZoom} 
          aspectRatio={aspectRatio} 
          setAspectRatio={setAspectRatio}
          handleDesignChange={handleDesignChange}
        />
      </div>

      {/* Success Toast */}
      {showToast && (
        <Toast 
          message="Marca guardada exitosamente ✓" 
          type="success"
          onDismiss={() => setShowToast(false)} 
        />
      )}
    </div>
  );
};
