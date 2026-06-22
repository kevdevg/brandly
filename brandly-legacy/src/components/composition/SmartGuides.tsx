import React from 'react';

interface SmartGuidesProps {
  guides: { x: number | null; y: number | null };
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({ guides }) => {
  return (
    <>
      {guides.x !== null && (
        <div style={{ position: 'absolute', left: `${guides.x}%`, top: 0, bottom: 0, width: '2px', backgroundColor: '#ec4899', zIndex: 50, pointerEvents: 'none' }} />
      )}
      {guides.y !== null && (
        <div style={{ position: 'absolute', top: `${guides.y}%`, left: 0, right: 0, height: '2px', backgroundColor: '#ec4899', zIndex: 50, pointerEvents: 'none' }} />
      )}
    </>
  );
};
