import React from 'react';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold text-white mb-2">Eliminar Objeto</h3>
        <p className="text-neutral-400 text-sm mb-6">¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-red-900/20"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
