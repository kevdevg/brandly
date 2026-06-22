import React from 'react';
import { DesignMD } from '../../../types';

interface PreviewTypographyProps {
  designMD: DesignMD;
}

/**
 * Isolated typography hierarchy preview showing all text levels
 * with their real fonts, sizes, and colors.
 */
export const PreviewTypography: React.FC<PreviewTypographyProps> = ({ designMD }) => {
  const titleFont = designMD.titleFont || designMD.baseFont;
  const subtitleFont = designMD.subtitleFont || designMD.baseFont;
  const paragraphFont = designMD.paragraphFont || designMD.baseFont;
  const baseFont = designMD.baseFont;

  const titleSize = designMD.titleSize || 64;
  const subtitleSize = designMD.subtitleSize || 32;
  const paragraphSize = designMD.paragraphSize || 16;

  const titleColor = designMD.titleColor || designMD.textColor;
  const subtitleColor = designMD.subtitleColor || designMD.textColor;
  const paragraphColor = designMD.paragraphColor || designMD.textColor;

  return (
    <div
      className="w-[420px] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        backgroundColor: designMD.secondaryColor,
        border: `${designMD.frameThickness}px solid ${designMD.primaryColor}`,
      }}
    >
      <div className="p-8 space-y-6">
        {/* Heading 1 */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-40" style={{ color: designMD.textColor }}>
            Título — {titleFont.split(',')[0].replace(/"/g, '')} · {titleSize}px
          </span>
          <h1
            style={{
              fontFamily: titleFont,
              fontSize: `${Math.min(titleSize, 56)}px`,
              color: titleColor,
              lineHeight: 1.1,
            }}
            className="font-bold tracking-tight"
          >
            Título Principal
          </h1>
          <div className="h-px mt-2" style={{ backgroundColor: `${designMD.primaryColor}30` }} />
        </div>

        {/* Heading 2 */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-40" style={{ color: designMD.textColor }}>
            Subtítulo — {subtitleFont.split(',')[0].replace(/"/g, '')} · {subtitleSize}px
          </span>
          <h2
            style={{
              fontFamily: subtitleFont,
              fontSize: `${Math.min(subtitleSize, 32)}px`,
              color: subtitleColor,
              lineHeight: 1.2,
            }}
            className="font-semibold"
          >
            Subtítulo de Sección
          </h2>
          <div className="h-px mt-2" style={{ backgroundColor: `${designMD.primaryColor}20` }} />
        </div>

        {/* Paragraph */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-40" style={{ color: designMD.textColor }}>
            Párrafo — {paragraphFont.split(',')[0].replace(/"/g, '')} · {paragraphSize}px
          </span>
          <p
            style={{
              fontFamily: paragraphFont,
              fontSize: `${Math.min(paragraphSize, 18)}px`,
              color: paragraphColor,
              lineHeight: 1.6,
            }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        {/* Glyph Preview */}
        <div
          className="rounded-xl p-5 text-center space-y-2"
          style={{ backgroundColor: `${designMD.primaryColor}10` }}
        >
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-40 block" style={{ color: designMD.textColor }}>
            Glifos — {baseFont.split(',')[0].replace(/"/g, '')}
          </span>
          <p
            className="text-2xl font-bold tracking-wider"
            style={{ fontFamily: baseFont, color: titleColor }}
          >
            ABCDEFGHIJKLM
          </p>
          <p
            className="text-2xl tracking-wider"
            style={{ fontFamily: baseFont, color: subtitleColor }}
          >
            abcdefghijklm
          </p>
          <p
            className="text-xl font-mono tracking-[0.3em]"
            style={{ fontFamily: baseFont, color: paragraphColor, opacity: 0.7 }}
          >
            0123456789
          </p>
        </div>
      </div>
    </div>
  );
};
