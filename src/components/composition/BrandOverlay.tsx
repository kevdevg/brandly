import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DesignMD } from '../../types';

interface BrandOverlayProps {
  designMD: DesignMD;
  textOverlay: string;
  brandVisibility?: { logo: boolean; frame: boolean };
}

export const BrandOverlay: React.FC<BrandOverlayProps> = ({ designMD, textOverlay, brandVisibility }) => {
  const showLogo = brandVisibility?.logo ?? true;
  const showFrame = brandVisibility?.frame ?? true;

  return (
    <AbsoluteFill
      style={{
        border: showFrame ? `${designMD.frameThickness}px solid ${designMD.primaryColor}` : 'none',
        boxSizing: 'border-box',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      {/* Cabecera: Logo de la Marca */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        {showLogo && designMD.logoUrl && (
          <img 
            src={designMD.logoUrl} 
            alt="Brand Logo" 
            style={{ width: '120px', objectFit: 'contain' }} 
          />
        )}
      </div>

      {/* Pie: Texto sin manipulación de la imagen original */}
      <div 
        style={{
          fontFamily: designMD.baseFont,
          color: designMD.textColor,
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          backgroundColor: 'rgba(0,0,0,0.4)',
          padding: '24px',
          borderRadius: '16px',
          backdropFilter: 'blur(4px)',
        }}
      >
        {textOverlay}
      </div>
    </AbsoluteFill>
  );
};
