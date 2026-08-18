import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../theme';

type CardMode = 'choice' | 'details' | 'verify' | 'dashboard';

const Field: React.FC<{
  label: string;
  value: string;
  active?: boolean;
  optional?: boolean;
  secure?: boolean;
}> = ({label, value, active = false, optional = false, secure = false}) => (
  <div style={{marginBottom: 17}}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        color: 'rgba(245,242,235,0.62)',
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      <span>{label}</span>
      {optional ? <span style={{color: 'rgba(255,215,0,0.38)'}}>Optional</span> : null}
    </div>
    <div
      style={{
        height: 47,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px',
        color: colors.cream,
        fontFamily: fonts.body,
        fontSize: 14,
        background: 'rgba(7,6,5,0.74)',
        border: `1px solid ${active ? colors.gold : 'rgba(212,175,55,0.2)'}`,
        boxShadow: active ? '0 0 18px rgba(255,215,0,0.18)' : 'none',
      }}
    >
      {secure ? '••••••••••' : value}
    </div>
  </div>
);

const Button: React.FC<{children: React.ReactNode; secondary?: boolean}> = ({children, secondary = false}) => (
  <div
    style={{
      height: 49,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: secondary ? colors.cream : colors.obsidian,
      fontFamily: fonts.mono,
      fontWeight: 800,
      fontSize: 11,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      background: secondary
        ? 'rgba(255,255,255,0.035)'
        : 'linear-gradient(135deg, #ffd700, #c59b27)',
      border: secondary ? '1px solid rgba(212,175,55,0.3)' : 'none',
      boxShadow: secondary ? 'none' : '0 8px 28px rgba(255,215,0,0.2)',
    }}
  >
    {children}
  </div>
);

const ChoiceCard: React.FC = () => (
  <>
    <div style={{display: 'flex', borderBottom: '1px solid rgba(212,175,55,0.18)', marginBottom: 24}}>
      <div style={{width: '50%', padding: 11, textAlign: 'center', color: 'rgba(245,242,235,0.45)', fontFamily: fonts.mono, fontSize: 11}}>SIGN IN</div>
      <div style={{width: '50%', padding: 11, textAlign: 'center', color: colors.gold, borderBottom: `2px solid ${colors.gold}`, fontFamily: fonts.mono, fontSize: 11}}>SIGN UP</div>
    </div>
    <Button>Sign up with email</Button>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, margin: '19px 0'}}>
      <div style={{height: 1, flex: 1, background: 'rgba(212,175,55,0.18)'}} />
      <span style={{fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,215,0,0.35)'}}>OR</span>
      <div style={{height: 1, flex: 1, background: 'rgba(212,175,55,0.18)'}} />
    </div>
    <Button secondary>Continue with Google</Button>
  </>
);

const DetailsCard: React.FC<{pulse: number}> = ({pulse}) => (
  <>
    <Field label="Full name" value="Meena Kumar" />
    <Field label="Email address" value="meena@example.com" />
    <Field label="Password" value="" secure active={pulse > 0.45} />
    <Field label="Postal PIN code" value="600001" optional />
    <div style={{marginTop: 6}}><Button>Create account →</Button></div>
  </>
);

const VerifyCard: React.FC<{pulse: number}> = ({pulse}) => (
  <div style={{textAlign: 'center', padding: '22px 10px 12px'}}>
    <div
      style={{
        width: 92,
        height: 92,
        margin: '0 auto 25px',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        border: '1px solid rgba(255,215,0,0.35)',
        background: 'rgba(255,215,0,0.07)',
        boxShadow: `0 0 ${28 + pulse * 24}px rgba(255,215,0,0.17)`,
        color: colors.gold,
        fontSize: 39,
      }}
    >
      ✓
    </div>
    <h3 style={{fontFamily: fonts.display, fontSize: 32, fontWeight: 500, color: colors.cream, margin: 0}}>Check your email</h3>
    <p style={{fontFamily: fonts.body, fontSize: 14, lineHeight: 1.65, color: colors.copy, margin: '13px auto 26px', maxWidth: 320}}>
      Confirm your address, then return to Meenamma. Google sign-up returns automatically.
    </p>
    <Button>Open Meenamma</Button>
  </div>
);

const DashboardCard: React.FC<{pulse: number}> = ({pulse}) => (
  <div>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25}}>
      <div>
        <div style={{fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.15em', color: colors.goldMuted}}>DAILY KUDAM</div>
        <div style={{fontFamily: fonts.display, fontSize: 29, color: colors.cream, marginTop: 6}}>Welcome, Meena</div>
      </div>
      <div style={{width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', color: colors.obsidian, background: colors.gold, fontFamily: fonts.display, fontSize: 22}}>M</div>
    </div>
    <div style={{border: '1px solid rgba(212,175,55,0.23)', background: 'rgba(255,215,0,0.04)', padding: 22, borderRadius: 14}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        <div>
          <div style={{fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.16em', color: colors.copy}}>TODAY'S SAVING</div>
          <div style={{fontFamily: fonts.display, fontSize: 52, color: colors.cream, marginTop: 9}}>₹5</div>
        </div>
        <div style={{fontFamily: fonts.mono, fontSize: 10, color: colors.green}}>PROTECTED ✓</div>
      </div>
      <div style={{height: 7, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', marginTop: 20}}>
        <div style={{height: '100%', width: `${58 + pulse * 16}%`, borderRadius: 7, background: 'linear-gradient(90deg,#8f6d18,#ffd700)'}} />
      </div>
    </div>
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 13}}>
      {['Fresh catch', 'Referral link'].map((label) => (
        <div key={label} style={{padding: '17px 15px', borderRadius: 10, border: '1px solid rgba(212,175,55,0.16)', fontFamily: fonts.body, fontSize: 13, color: colors.copy}}>{label} <span style={{float: 'right', color: colors.gold}}>→</span></div>
      ))}
    </div>
  </div>
);

export const SignupCard: React.FC<{mode: CardMode}> = ({mode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 13, stiffness: 90}});
  const pulse = (Math.sin(frame / 10) + 1) / 2;

  return (
    <div
      style={{
        width: 465,
        minHeight: mode === 'details' ? 575 : 450,
        borderRadius: 22,
        padding: '34px 36px',
        transform: `translateY(${interpolate(enter, [0, 1], [28, 0])}px) scale(${interpolate(enter, [0, 1], [0.965, 1])})`,
        opacity: enter,
        background: 'rgba(18,14,10,0.9)',
        border: '1px solid rgba(212,175,55,0.24)',
        boxShadow: '0 36px 80px rgba(0,0,0,0.52), inset 0 1px rgba(255,215,0,0.11)',
      }}
    >
      <div style={{textAlign: 'center', marginBottom: 25}}>
        <div style={{fontFamily: fonts.display, fontSize: 28, letterSpacing: '0.09em', color: colors.cream}}>MEENAMMA</div>
        <div style={{fontFamily: fonts.mono, fontSize: 9, letterSpacing: '0.25em', color: colors.gold, marginTop: 5}}>MICRO-SAVINGS</div>
      </div>
      {mode === 'choice' ? <ChoiceCard /> : null}
      {mode === 'details' ? <DetailsCard pulse={pulse} /> : null}
      {mode === 'verify' ? <VerifyCard pulse={pulse} /> : null}
      {mode === 'dashboard' ? <DashboardCard pulse={pulse} /> : null}
    </div>
  );
};
