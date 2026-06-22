import React from 'react';
import { Layers, Image as ImageIcon } from 'lucide-react';

export const GraphicLayerPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-neutral-800">
        <h2 className="text-sm font-bold text-white mb-1">
          <Layers size={16} className="inline mr-2 text-violet-400 align-text-bottom"/> Capa Gráfica
        </h2>
        <p className="text-[11px] text-neutral-400">Añade textos o imágenes a esta capa</p>
      </div>
      <div className="p-5 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="text-center text-neutral-500 text-sm py-10 px-4">
          <ImageIcon size={24} className="mx-auto mb-3 opacity-50" />
          Selecciona un elemento en la línea temporal para editarlo, o usa la barra de herramientas para añadir uno nuevo.
        </div>
      </div>
    </div>
  );
};
