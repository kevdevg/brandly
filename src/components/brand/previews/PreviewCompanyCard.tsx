import React from 'react';
import { Globe, Instagram, AtSign, Play, Building2 } from 'lucide-react';
import { CompanyProfile, DesignMD } from '../../../types';

interface PreviewCompanyCardProps {
  company: CompanyProfile;
  designMD: DesignMD;
}

/**
 * Live corporate identity card showing company data in real-time.
 */
export const PreviewCompanyCard: React.FC<PreviewCompanyCardProps> = ({ company, designMD }) => {
  const socialEntries = [
    { icon: <Globe size={14} />, value: company.socialLinks?.website, label: 'Web' },
    { icon: <Instagram size={14} />, value: company.socialLinks?.instagram, label: 'Instagram' },
    { icon: <AtSign size={14} />, value: company.socialLinks?.tiktok, label: 'TikTok' },
    { icon: <Play size={14} />, value: company.socialLinks?.youtube, label: 'YouTube' },
  ].filter(s => s.value);

  return (
    <div
      className="w-[340px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500"
      style={{ border: `3px solid ${designMD.primaryColor}` }}
    >
      {/* Header band */}
      <div
        className="px-6 py-8 flex flex-col items-center text-center relative"
        style={{ backgroundColor: designMD.primaryColor }}
      >
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow-xl mb-4">
          {designMD.logoUrl ? (
            <img src={designMD.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
          ) : (
            <Building2 size={32} className="text-neutral-300" />
          )}
        </div>

        {/* Name */}
        <h2
          className="text-xl font-bold tracking-tight"
          style={{
            fontFamily: designMD.titleFont || designMD.baseFont,
            color: designMD.textColor,
          }}
        >
          {company.name || 'Nombre de Marca'}
        </h2>

        {/* Tagline */}
        {company.tagline && (
          <p
            className="text-sm mt-1.5 opacity-80"
            style={{
              fontFamily: designMD.subtitleFont || designMD.baseFont,
              color: designMD.textColor,
            }}
          >
            "{company.tagline}"
          </p>
        )}
      </div>

      {/* Body */}
      <div
        className="px-6 py-5 space-y-4"
        style={{ backgroundColor: designMD.secondaryColor }}
      >
        {/* Industry Badge */}
        {company.industry && (
          <div className="flex justify-center">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: `${designMD.primaryColor}30`,
                color: designMD.primaryColor,
                border: `1px solid ${designMD.primaryColor}40`,
              }}
            >
              {company.industry}
            </span>
          </div>
        )}

        {/* Social Links */}
        {socialEntries.length > 0 && (
          <div className="space-y-2">
            {socialEntries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${designMD.primaryColor}10`,
                }}
              >
                <span style={{ color: designMD.primaryColor }}>{entry.icon}</span>
                <span
                  className="text-sm font-medium truncate"
                  style={{
                    color: designMD.textColor,
                    fontFamily: designMD.baseFont,
                  }}
                >
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!company.tagline && socialEntries.length === 0 && !company.industry && (
          <p className="text-center text-sm opacity-50" style={{ color: designMD.textColor }}>
            Completa los datos en el panel izquierdo para verlos aquí
          </p>
        )}
      </div>
    </div>
  );
};
