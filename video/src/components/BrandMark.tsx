import React from 'react';
import {Img, staticFile} from 'remotion';
import {colors, fonts} from '../theme';

export const BrandMark: React.FC<{compact?: boolean}> = ({compact = false}) => {
  const logoSize = compact ? 78 : 112;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: compact ? 18 : 24}}>
      <div
        style={{
          width: logoSize,
          height: logoSize,
          borderRadius: compact ? 20 : 28,
          overflow: 'hidden',
          border: '1px solid rgba(255,215,0,0.25)',
          boxShadow: '0 0 38px rgba(255,215,0,0.12)',
        }}
      >
        <Img src={staticFile('logo.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div>
        <div
          style={{
            color: colors.cream,
            fontFamily: fonts.display,
            fontSize: compact ? 34 : 50,
            letterSpacing: '0.08em',
          }}
        >
          MEENAMMA
        </div>
        <div
          style={{
            color: colors.gold,
            fontFamily: fonts.mono,
            fontSize: compact ? 11 : 14,
            fontWeight: 700,
            letterSpacing: '0.28em',
            marginTop: 5,
          }}
        >
          MICRO-SAVINGS
        </div>
      </div>
    </div>
  );
};
