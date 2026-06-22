/**
 * Remotion Root — Entry point for bundler to discover compositions.
 *
 * This file is referenced by the server-side renderer bundle step.
 * It registers BrandComposition as a renderable Composition.
 */
import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { BrandComposition } from './components/BrandComposition';
import { RenderProps } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Video composition — used for MP4/WebM rendering */}
      <Composition
        id="BrandVideo"
        component={BrandComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          designMD: {} as any,
          textOverlay: '',
          timelineElements: [],
          layers: [],
        }}
      />

      {/* Still composition — used for PNG/JPEG rendering */}
      <Still
        id="BrandStill"
        component={BrandComposition}
        width={1080}
        height={1080}
        defaultProps={{
          designMD: {} as any,
          textOverlay: '',
          timelineElements: [],
          layers: [],
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
