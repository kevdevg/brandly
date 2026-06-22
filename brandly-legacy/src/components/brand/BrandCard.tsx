import React from 'react';
import { Building2 } from 'lucide-react';
import { DesignMD } from '../../types';

interface BrandCardProps {
  designMD: DesignMD;
  width?: number;
  height?: number;
  className?: string;
  /** Scale transform applied to the card */
  scale?: number;
}

/**
 * Reusable brand preview card that renders a mock frame
 * showing how the DesignMD looks. Used in Dashboard and BrandPreview.
 * All typography sizes scale proportionally to the card dimensions.
 */
export const BrandCard: React.FC<BrandCardProps> = ({
  designMD,
  width = 320,
  height = 480,
  className = '',
  scale = 1,
}) => {
  // Scale factor relative to a 1080-wide composition
  const sf = width / 1080;
  const pad = Math.max(12, Math.round(24 * sf * 4));

  const titleFontSize = Math.round(Math.min(designMD.titleSize || 64, 64) * sf * 2.2);
  const subtitleFontSize = Math.round(Math.min(designMD.subtitleSize || 32, 32) * sf * 2.2);
  const paragraphFontSize = Math.max(8, Math.round(Math.min(designMD.paragraphSize || 16, 16) * sf * 2.2));
  const logoWidth = Math.max(32, Math.round(120 * sf * 2));

  return (
    <div 
      className={`relative shadow-2xl transition-all duration-500 ease-out flex flex-col overflow-hidden ${className}`}
      style={{
        width,
        height,
        backgroundColor: designMD.secondaryColor,
        border: `${Math.max(1, Math.round(designMD.frameThickness * sf * 2))}px solid ${designMD.primaryColor}`,
        borderRadius: Math.max(8, Math.round(16 * sf * 2)),
        padding: pad,
        transform: `scale(${scale})`,
        transformOrigin: 'center center'
      }}
    >
      {/* Logo */}
      <div className="shrink-0">
        {designMD.logoUrl ? (
          <img 
            src={designMD.logoUrl} 
            alt="Logo" 
            style={{ width: logoWidth, maxHeight: logoWidth * 0.6, objectFit: 'contain' }}
            className="filter drop-shadow-md" 
          />
        ) : (
          <div className="flex items-center gap-1.5 opacity-30">
            <Building2 size={Math.max(12, logoWidth * 0.3)} style={{ color: designMD.textColor }} />
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Typography Preview */}
      <div 
        className="shrink-0 text-center border border-white/5"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          padding: `${Math.max(8, pad * 0.8)}px ${Math.max(6, pad * 0.6)}px`,
          borderRadius: Math.max(6, Math.round(16 * sf * 2)),
        }}
      >
        <h1 
          style={{ 
            fontFamily: designMD.titleFont || designMD.baseFont, 
            color: designMD.titleColor || designMD.textColor,
            fontSize: titleFontSize,
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }} 
          className="font-bold tracking-tight"
        >
          Título Principal
        </h1>
        
        <h2 
          style={{ 
            fontFamily: designMD.subtitleFont || designMD.baseFont, 
            color: designMD.subtitleColor || designMD.textColor,
            fontSize: subtitleFontSize,
            lineHeight: 1.25,
            marginTop: Math.max(2, Math.round(8 * sf * 2)),
          }} 
          className="font-medium opacity-90"
        >
          Subtítulo de marca
        </h2>

        <p 
          style={{ 
            fontFamily: designMD.paragraphFont || designMD.baseFont, 
            color: designMD.paragraphColor || designMD.textColor,
            fontSize: paragraphFontSize,
            lineHeight: 1.5,
            marginTop: Math.max(2, Math.round(6 * sf * 2)),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }} 
          className="opacity-70 font-light"
        >
          Este es un párrafo de ejemplo que muestra el estilo del texto extendido.
        </p>
      </div>

      {/* Color palette strip */}
      <div className="flex gap-1 mt-2 justify-center shrink-0">
        <div 
          className="rounded-full" 
          style={{ width: Math.max(6, 10 * sf * 2), height: Math.max(6, 10 * sf * 2), backgroundColor: designMD.primaryColor }} 
        />
        <div 
          className="rounded-full border border-white/10" 
          style={{ width: Math.max(6, 10 * sf * 2), height: Math.max(6, 10 * sf * 2), backgroundColor: designMD.secondaryColor }} 
        />
        <div 
          className="rounded-full" 
          style={{ width: Math.max(6, 10 * sf * 2), height: Math.max(6, 10 * sf * 2), backgroundColor: designMD.textColor }} 
        />
      </div>
    </div>
  );
};
