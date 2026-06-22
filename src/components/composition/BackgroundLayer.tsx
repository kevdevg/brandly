import React from 'react';
import { Sequence, AbsoluteFill, Img, Video } from 'remotion';
import { TimelineElement, TimelineLayer, MediaFilter } from '../../types';

const getFilterStyle = (filter?: MediaFilter): React.CSSProperties => {
  switch (filter) {
    case 'grayscale':
      return { filter: 'grayscale(100%)' };
    case 'sepia':
      return { filter: 'sepia(100%)' };
    case 'contrast':
      return { filter: 'contrast(150%)' };
    default:
      return {};
  }
};

interface BackgroundLayerProps {
  timelineElements: TimelineElement[];
  layers: TimelineLayer[];
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ timelineElements, layers }) => {
  const backgroundElements = timelineElements.filter(
    el => layers?.find(l => l.id === el.layerId)?.type === 'background'
  );

  return (
    <>
      {backgroundElements.map((el) => {
        const filterStyle = getFilterStyle(el.filter || 'none');
        return (
          <Sequence key={el.id} from={el.startFrame} durationInFrames={el.endFrame - el.startFrame}>
            <AbsoluteFill style={filterStyle}>
              {el.type === 'color' && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  ...(el.content.includes('gradient')
                    ? { background: el.content }
                    : { backgroundColor: el.content }),
                }}>
                  {el.backgroundPattern && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: el.backgroundPattern,
                      backgroundSize: '10px 10px',
                    }} />
                  )}
                </div>
              )}
              {el.type === 'image' && <Img src={el.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {el.type === 'video' && <Video src={el.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => console.warn('Video failed to load', e)} />}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};
