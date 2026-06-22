import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Sparkles } from 'lucide-react';
import { DesignMD, CompanyProfile, ExpressTemplate } from '../types';
import { TemplatesPanel, TemplateDragPreview } from './dashboard/TemplatesPanel';
import { BrandsPanel, BrandDragPreview } from './dashboard/BrandsPanel';
import { GenerateZone } from './dashboard/GenerateZone';
import { CreateBrandModal } from './brand/CreateBrandModal';

interface DashboardProps {
  companies: CompanyProfile[];
  templates: ExpressTemplate[];
  onCreateBrand: (name: string, industry?: string) => void;
  onDeleteBrand: (id: string) => void;
  onDuplicateBrand: (id: string) => void;
  onEditBrand: (design: DesignMD) => void;
  onOpenContentGrid: (companyId: string) => void;
  onCreateTemplate: (format: 'video' | 'image', aspect: ExpressTemplate['aspectRatio']) => void;
  onEditTemplate: (template: ExpressTemplate) => void;
  onDuplicateTemplate: (template: ExpressTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onGenerate: (template: ExpressTemplate, brand: CompanyProfile) => void;
}

type DragItem =
  | { type: 'template'; template: ExpressTemplate }
  | { type: 'brand'; company: CompanyProfile };

/**
 * Dashboard — Redesigned around "content = template × brand".
 * 
 * Three zones:
 * 1. TemplatesPanel (top-left) — draggable template grid with search
 * 2. BrandsPanel (top-right) — draggable brand folder grid with search
 * 3. GenerateZone (bottom, full-width) — drop slots + Generate button
 */
export const Dashboard: React.FC<DashboardProps> = ({
  companies,
  templates,
  onCreateBrand,
  onDeleteBrand,
  onDuplicateBrand,
  onEditBrand,
  onOpenContentGrid,
  onCreateTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onGenerate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ExpressTemplate | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<CompanyProfile | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // DnD sensor config — require 5px movement before starting drag (allows click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragItem | undefined;
    if (data) setActiveDrag(data);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as DragItem | undefined;
    if (!data) return;

    const droppedOnSlot = over.id as string;

    if (data.type === 'template' && droppedOnSlot === 'slot-template') {
      setSelectedTemplate(data.template);
    } else if (data.type === 'brand' && droppedOnSlot === 'slot-brand') {
      setSelectedBrand(data.company);
    }
    // If user drops template on brand slot or vice versa, ignore silently
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

  // Click-based selection (alternative to drag)
  const handleSelectTemplate = useCallback((t: ExpressTemplate) => {
    setSelectedTemplate(t);
  }, []);

  const handleSelectBrand = useCallback((c: CompanyProfile) => {
    setSelectedBrand(c);
  }, []);

  const handleGenerate = useCallback(() => {
    if (selectedTemplate && selectedBrand) {
      onGenerate(selectedTemplate, selectedBrand);
    }
  }, [selectedTemplate, selectedBrand, onGenerate]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex-1 overflow-y-auto w-full relative bg-neutral-950">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />

        <div className="max-w-6xl w-full mx-auto p-8 relative z-10">
          {/* ── Header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Crear Contenido</h1>
                <p className="text-sm text-neutral-500">Combina una plantilla con una marca para generar contenido</p>
              </div>
            </div>
          </div>

          {/* ── Zone 1 & 2: Templates + Brands (side by side) ── */}
          <div className="flex gap-5 mb-6" style={{ height: 380 }}>
            <TemplatesPanel
              templates={templates}
              onSelect={handleSelectTemplate}
              onCreateTemplate={onCreateTemplate}
              onEditTemplate={onEditTemplate}
              onDuplicateTemplate={onDuplicateTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
            <BrandsPanel
              companies={companies}
              onSelect={handleSelectBrand}
              onCreateBrand={() => setShowCreateModal(true)}
              onEditBrand={(c) => onEditBrand(c.design)}
              onDeleteBrand={onDeleteBrand}
              onDuplicateBrand={onDuplicateBrand}
              onOpenContentGrid={onOpenContentGrid}
            />
          </div>

          {/* ── Zone 3: Generate Content ── */}
          <GenerateZone
            selectedTemplate={selectedTemplate}
            selectedBrand={selectedBrand}
            onClearTemplate={() => setSelectedTemplate(null)}
            onClearBrand={() => setSelectedBrand(null)}
            onClickTemplateSlot={() => {/* Could open a modal selector — for now click on panel */}}
            onClickBrandSlot={() => {/* Could open a modal selector — for now click on panel */}}
            onGenerate={handleGenerate}
          />
        </div>
      </div>

      {/* Drag Overlay — shows a floating preview while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeDrag?.type === 'template' && (
          <TemplateDragPreview template={activeDrag.template} />
        )}
        {activeDrag?.type === 'brand' && (
          <BrandDragPreview company={activeDrag.company} />
        )}
      </DragOverlay>

      {/* Create Brand Modal */}
      {showCreateModal && (
        <CreateBrandModal
          onConfirm={(name, industry) => {
            onCreateBrand(name, industry);
            setShowCreateModal(false);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </DndContext>
  );
};
