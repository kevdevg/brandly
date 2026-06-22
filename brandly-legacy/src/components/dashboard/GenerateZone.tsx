import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ExpressTemplate, CompanyProfile } from '../../types';
import { DropSlot } from './DropSlot';

interface GenerateZoneProps {
  selectedTemplate: ExpressTemplate | null;
  selectedBrand: CompanyProfile | null;
  onClearTemplate: () => void;
  onClearBrand: () => void;
  onClickTemplateSlot: () => void;
  onClickBrandSlot: () => void;
  onGenerate: () => void;
}

/**
 * GenerateZone — Bottom full-width area with two drop slots (Template × Brand) and a Generate button.
 */
export const GenerateZone: React.FC<GenerateZoneProps> = ({
  selectedTemplate,
  selectedBrand,
  onClearTemplate,
  onClearBrand,
  onClickTemplateSlot,
  onClickBrandSlot,
  onGenerate,
}) => {
  const canGenerate = !!selectedTemplate && !!selectedBrand;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
          <Sparkles size={14} className="text-violet-400" />
        </div>
        <h2 className="text-sm font-bold text-white">Generar contenido</h2>
      </div>
      <p className="text-[11px] text-neutral-500 mb-5 ml-8">
        Arrastra una plantilla y una marca, o toca para elegir.
      </p>

      {/* Slots row */}
      <div className="flex items-center gap-3">
        {/* Template slot */}
        <DropSlot
          type="template"
          item={selectedTemplate}
          onClear={onClearTemplate}
          onClick={onClickTemplateSlot}
        />

        {/* × separator */}
        <div className="shrink-0 flex items-center justify-center">
          <span className="text-xl font-bold text-neutral-600 select-none">×</span>
        </div>

        {/* Brand slot */}
        <DropSlot
          type="brand"
          item={selectedBrand}
          onClear={onClearBrand}
          onClick={onClickBrandSlot}
        />

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          title={canGenerate ? 'Generar contenido con esta plantilla y marca' : 'Selecciona una plantilla y una marca primero'}
          className={`
            shrink-0 flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all duration-200
            ${canGenerate
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-neutral-800/50 text-neutral-600 cursor-not-allowed border border-neutral-800'
            }
          `}
        >
          Generar
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
