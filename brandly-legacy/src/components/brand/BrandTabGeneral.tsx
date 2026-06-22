import React from 'react';
import { Link2, Instagram, AtSign, Play, Globe } from 'lucide-react';
import { CompanyProfile } from '../../types';

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

interface BrandTabGeneralProps {
  company: CompanyProfile;
  handleCompanyChange: (company: CompanyProfile) => void;
}

export const BrandTabGeneral: React.FC<BrandTabGeneralProps> = ({ company, handleCompanyChange }) => {
  return (
    <div className="space-y-6">
      {/* Company Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase">Información de la Marca</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">Nombre de la Empresa</label>
            <input
              type="text"
              value={company?.name || ''}
              onChange={(e) => handleCompanyChange({ ...company, name: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
              placeholder="Ej. TechFlow"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
              Tagline / Eslogan
              <span className="text-xs text-neutral-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={company?.tagline || ''}
              onChange={(e) => handleCompanyChange({ ...company, tagline: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
              placeholder="Ej. Innovación que transforma"
              maxLength={80}
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
              Industria
              <span className="text-xs text-neutral-500 font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => handleCompanyChange({ 
                    ...company, 
                    industry: company.industry === ind ? undefined : ind 
                  })}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                    company.industry === ind
                      ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h3 className="text-sm font-semibold tracking-widest text-neutral-500 uppercase flex items-center gap-2">
          <Globe size={16} /> Redes y Presencia
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2"><Link2 size={14} /> Website</label>
            <input
              type="text"
              value={company?.socialLinks?.website || ''}
              onChange={(e) => handleCompanyChange({ ...company, socialLinks: { ...company.socialLinks, website: e.target.value } })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2"><Instagram size={14} /> Instagram</label>
            <input
              type="text"
              value={company?.socialLinks?.instagram || ''}
              onChange={(e) => handleCompanyChange({ ...company, socialLinks: { ...company.socialLinks, instagram: e.target.value } })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
              placeholder="@usuario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2"><AtSign size={14} /> TikTok</label>
            <input
              type="text"
              value={company?.socialLinks?.tiktok || ''}
              onChange={(e) => handleCompanyChange({ ...company, socialLinks: { ...company.socialLinks, tiktok: e.target.value } })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
              placeholder="@usuario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2"><Play size={14} /> YouTube</label>
            <input
              type="text"
              value={company?.socialLinks?.youtube || ''}
              onChange={(e) => handleCompanyChange({ ...company, socialLinks: { ...company.socialLinks, youtube: e.target.value } })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
              placeholder="@canal"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
