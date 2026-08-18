import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme';

const Ring: React.FC<{size: number; left: number; top: number; reverse?: boolean}> = ({
  size,
  left,
  top,
  reverse = false,
}) => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, 900], [0, reverse ? -28 : 28]);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        border: '1px solid rgba(255,215,0,0.12)',
        borderRadius: '50%',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {Array.from({length: 12}).map((_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size * 0.38,
            height: 1,
            transformOrigin: '0 0',
            transform: `rotate(${index * 30}deg)`,
            background: 'linear-gradient(90deg, rgba(255,215,0,0.18), transparent)',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: '16%',
          border: '1px solid rgba(212,175,55,0.08)',
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export const BrandBackground: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: colors.obsidian,
        backgroundImage:
          'radial-gradient(circle at 54% 0%, rgba(212,175,55,0.15), transparent 55%), radial-gradient(circle at 8% 95%, rgba(197,155,39,0.08), transparent 42%), radial-gradient(circle at 96% 82%, rgba(245,158,11,0.06), transparent 42%)',
      }}
    >
      <Ring size={760} left={-310} top={-270} />
      <Ring size={900} left={1450} top={430} reverse />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
        }}
      />
    </AbsoluteFill>
  );
};
