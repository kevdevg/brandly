import React from 'react';
import { TopHeader } from '../TopHeader';
import { useEditor } from '../../context/EditorContext';

interface StudioTopBarProps {
  setCurrentStep: (step: 'dashboard' | 'brand' | 'studio' | 'express' | 'content-grid' | 'template-builder' | 'production-form') => void;
}

/**
 * Wrapper that connects TopHeader to EditorContext for zoom/ratio controls.
 * Lives inside EditorProvider so it can access canvas zoom state.
 */
export const StudioTopBar: React.FC<StudioTopBarProps> = ({ setCurrentStep }) => {
  const { canvasZoom, setCanvasZoom, aspectRatio, setAspectRatio, outputFormat } = useEditor();

  return (
    <TopHeader
      currentStep="studio"
      setCurrentStep={setCurrentStep}
      outputFormat={outputFormat}
      zoom={canvasZoom}
      onZoomIn={() => setCanvasZoom(prev => Math.min(5, prev + 0.25))}
      onZoomOut={() => setCanvasZoom(prev => Math.max(0.1, prev - 0.25))}
      onZoomReset={() => setCanvasZoom(1)}
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
    />
  );
};
