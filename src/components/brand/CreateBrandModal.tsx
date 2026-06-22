import React, { useState, useRef, useEffect } from 'react';
import { X, Briefcase, Sparkles } from 'lucide-react';

const INDUSTRIES = [
  'Tecnología',
  'Moda y Lifestyle',
  'Salud y Bienestar',
  'Educación',
  'Restaurante y Food',
  'Fitness y Deporte',
  'Finanzas',
  'Entretenimiento',
  'E-commerce',
  'Otro'
];

interface CreateBrandModalProps {
  onConfirm: (name: string, industry?: string) => void;
  onCancel: () => void;
}

export const CreateBrandModal: React.FC<CreateBrandModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = name.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(name.trim(), industry || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Briefcase size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nueva Marca</h2>
              <p className="text-xs text-neutral-400">Define la identidad de tu empresa</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            title="Cerrar"
            className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Nombre de la Marca <span className="text-rose-400">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-neutral-950 border rounded-xl px-4 py-3 text-white text-lg font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-neutral-600 ${
                name.length > 0 && !isValid
                  ? 'border-rose-500/50 focus:ring-rose-500/30'
                  : 'border-neutral-800 focus:ring-violet-500/30 focus:border-violet-500/50'
              }`}
              placeholder="Ej. TechFlow, Neon Fashion..."
              maxLength={50}
            />
            {name.length > 0 && !isValid && (
              <p className="text-xs text-rose-400 mt-1.5">El nombre debe tener al menos 2 caracteres</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Industria <span className="text-neutral-500">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndustry(industry === ind ? '' : ind)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                    industry === ind
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                isValid
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Sparkles size={16} />
              Crear Marca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
