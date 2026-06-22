import { interpolate, spring } from 'remotion';
import { TimelineElement } from '../../types';
import { resolveKeyframes } from './keyframeEngine';

interface TransitionResult {
  opacity: number;
  transformStr: string;
  displayContent: string;
}

/**
 * Calculate full transition state (in, out, typewriter, keyframe animations)
 * for a single timeline element at a given frame.
 */
export function calculateElementTransitions(
  el: TimelineElement,
  frame: number,
  baseOpacity: number,
  currentScale: number,
  currentRot: number,
  tempX?: number,
  tempY?: number
): TransitionResult {
  let opacity = baseOpacity;
  let transformStr = `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRot}deg)`;
  let displayContent = el.content;

  // --- IN TRANSITIONS ---
  if (el.transitionIn) {
    const { type, duration } = el.transitionIn;
    if (type === 'fade') {
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
    } else if (type === 'slideUp') {
      const translateY = interpolate(frame, [el.startFrame, el.startFrame + duration], [50, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, calc(-50% + ${translateY}px)) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'slideRight') {
      const translateX = interpolate(frame, [el.startFrame, el.startFrame + duration], [-50, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(calc(-50% + ${translateX}px), -50%) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'bounce') {
      const scaleAnim = spring({
        frame: frame - el.startFrame,
        fps: 30,
        config: { damping: 10, stiffness: 100, mass: 1 },
      });
      transformStr = `translate(-50%, -50%) scale(${scaleAnim * currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'scale') {
      const scaleAnim = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, -50%) scale(${scaleAnim * currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'slideDown') {
      const translateY = interpolate(frame, [el.startFrame, el.startFrame + duration], [-50, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, calc(-50% + ${translateY}px)) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'slideLeft') {
      const translateX = interpolate(frame, [el.startFrame, el.startFrame + duration], [50, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(calc(-50% + ${translateX}px), -50%) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'blur') {
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
    } else if (type === 'spin') {
      const spinDeg = interpolate(frame, [el.startFrame, el.startFrame + duration], [360, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [el.startFrame, el.startFrame + duration], [0, baseOpacity], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRot + spinDeg}deg)`;
    } else if (type === 'flip') {
      const flipDeg = interpolate(frame, [el.startFrame, el.startFrame + duration], [90, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRot}deg) rotateY(${flipDeg}deg)`;
    }
  }
  
  // --- OUT TRANSITIONS ---
  if (el.transitionOut) {
    const { type, duration } = el.transitionOut;
    const outStart = el.endFrame - duration;
    if (type === 'fade') {
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
    } else if (type === 'slideUp') {
      const translateY = interpolate(frame, [outStart, el.endFrame], [0, 50], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, calc(-50% + ${translateY}px)) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'slideRight') {
      const translateX = interpolate(frame, [outStart, el.endFrame], [0, 50], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(calc(-50% + ${translateX}px), -50%) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'scale' || type === 'bounce') {
      const scaleAnim = interpolate(frame, [outStart, el.endFrame], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, -50%) scale(${scaleAnim * currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'slideDown') {
      const translateY = interpolate(frame, [outStart, el.endFrame], [0, -50], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, calc(-50% + ${translateY}px)) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'slideLeft') {
      const translateX = interpolate(frame, [outStart, el.endFrame], [0, -50], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(calc(-50% + ${translateX}px), -50%) scale(${currentScale}) rotate(${currentRot}deg)`;
    } else if (type === 'blur') {
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
    } else if (type === 'spin') {
      const spinDeg = interpolate(frame, [outStart, el.endFrame], [0, 360], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      opacity = interpolate(frame, [outStart, el.endFrame], [baseOpacity, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRot + spinDeg}deg)`;
    } else if (type === 'flip') {
      const flipDeg = interpolate(frame, [outStart, el.endFrame], [0, 90], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
      });
      transformStr = `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRot}deg) rotateY(${flipDeg}deg)`;
    }
  }

  // --- TYPEWRITER ---
  if (el.type === 'text') {
     if (el.transitionIn?.type === 'typewriter' && frame <= el.startFrame + el.transitionIn.duration) {
        const lettersCount = el.content.length;
        const visibleLetters = Math.floor(interpolate(frame, [el.startFrame, el.startFrame + el.transitionIn.duration], [0, lettersCount], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
        }));
        displayContent = el.content.substring(0, visibleLetters);
     } else if (el.transitionOut?.type === 'typewriter' && frame >= el.endFrame - el.transitionOut.duration) {
        const lettersCount = el.content.length;
        const visibleLetters = Math.floor(interpolate(frame, [el.endFrame - el.transitionOut.duration, el.endFrame], [lettersCount, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
        }));
        displayContent = el.content.substring(0, visibleLetters);
     }
  }

  // --- KEYFRAME ANIMATIONS ---
  if (el.keyframes && el.keyframes.length >= 2) {
    // ── Multi-keyframe engine ──
    const resolved = resolveKeyframes(el.keyframes, frame, {
      x: tempX ?? el.x,
      y: tempY ?? el.y,
      scale: currentScale,
      opacity: opacity,
      rotation: currentRot,
    });
    // Note: x/y are applied in CompositionElement via tempPositions, not in transformStr
    // But scale, rotation, and opacity need to update transformStr
    transformStr = `translate(-50%, -50%) scale(${resolved.scale}) rotate(${resolved.rotation}deg)`;
    opacity = resolved.opacity;
    // Return resolved x/y through the transform (CompositionElement reads these)
    return { opacity, transformStr, displayContent };
  }
  
  // --- Legacy 2-point Keyframe Interpolations (backwards compatible) ---
  if (el.animEndX !== undefined) {
    interpolate(frame, [el.startFrame, el.endFrame], [tempX ?? el.x, el.animEndX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  if (el.animEndY !== undefined) {
    interpolate(frame, [el.startFrame, el.endFrame], [tempY ?? el.y, el.animEndY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  if (el.animEndScale !== undefined) {
    currentScale = interpolate(frame, [el.startFrame, el.endFrame], [currentScale, el.animEndScale], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    transformStr = transformStr.replace(/scale\([\d.]+\)/, `scale(${currentScale})`);
  }
  if (el.animEndOpacity !== undefined) {
    opacity = opacity * interpolate(frame, [el.startFrame, el.endFrame], [1, el.animEndOpacity / 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  return { opacity, transformStr, displayContent };
}

