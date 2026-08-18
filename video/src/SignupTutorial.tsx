import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import manifest from '../tutorial-manifest.json';
import {BrandBackground} from './components/BrandBackground';
import {BrandMark} from './components/BrandMark';
import {SignupCard} from './components/SignupCard';
import {colors, fonts} from './theme';

const FPS = 30;

const sceneOpacity = (frame: number, duration: number) =>
  interpolate(frame, [0, 16, duration - 16, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const Scene: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: sceneOpacity(frame, duration)}}>{children}</AbsoluteFill>;
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 14, stiffness: 80}});
  const lineWidth = interpolate(frame, [24, 76], [0, 420], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <Scene duration={120}>
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 175px'}}>
        <div style={{opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px)`}}>
          <BrandMark />
          <div style={{width: lineWidth, height: 1, background: 'linear-gradient(90deg,#ffd700,transparent)', margin: '48px 0 38px'}} />
          <div style={{fontFamily: fonts.mono, fontSize: 14, letterSpacing: '0.26em', color: colors.gold, marginBottom: 22}}>30-SECOND GUIDE</div>
          <h1 style={{fontFamily: fonts.display, fontSize: 92, lineHeight: 0.98, fontWeight: 500, letterSpacing: '-0.035em', color: colors.cream, margin: 0, maxWidth: 1120}}>
            Create your account.<br /><span style={{color: colors.goldMuted}}>Unlock your dashboard.</span>
          </h1>
          <p style={{fontFamily: fonts.body, fontSize: 24, lineHeight: 1.55, color: colors.copy, marginTop: 30, maxWidth: 880}}>
            Four simple steps. Email or Google. Your Daily Kudam stays protected until you sign in.
          </p>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const StepBadge: React.FC<{step: number; total: number}> = ({step, total}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: fonts.mono}}>
    <div style={{width: 49, height: 49, borderRadius: '50%', display: 'grid', placeItems: 'center', background: colors.gold, color: colors.obsidian, fontWeight: 900, fontSize: 17}}>{step}</div>
    <div style={{fontSize: 11, color: colors.copy, letterSpacing: '0.2em'}}>STEP {step} / {total}</div>
  </div>
);

const Progress: React.FC<{step: number}> = ({step}) => (
  <div style={{position: 'absolute', left: 92, right: 92, bottom: 54, display: 'flex', alignItems: 'center', gap: 11}}>
    {manifest.steps.map((item) => (
      <div key={item.number} style={{height: 4, flex: 1, borderRadius: 4, background: item.number <= step ? colors.gold : 'rgba(255,255,255,0.09)', boxShadow: item.number === step ? '0 0 12px rgba(255,215,0,0.4)' : 'none'}} />
    ))}
  </div>
);

type StepSceneProps = {
  stepIndex: number;
  mode: 'choice' | 'details' | 'verify' | 'dashboard';
  duration: number;
  note: string;
};

const StepScene: React.FC<StepSceneProps> = ({stepIndex, mode, duration, note}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const step = manifest.steps[stepIndex];
  const copyEnter = spring({frame: frame - 6, fps, config: {damping: 13, stiffness: 88}});

  return (
    <Scene duration={duration}>
      <AbsoluteFill style={{padding: '72px 92px 82px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 560px', gap: 90, alignItems: 'center'}}>
        <div style={{minWidth: 0, opacity: copyEnter, transform: `translateX(${interpolate(copyEnter, [0, 1], [-35, 0])}px)`}}>
          <BrandMark compact />
          <div style={{marginTop: 72}}><StepBadge step={step.number} total={manifest.steps.length} /></div>
          <div style={{fontFamily: fonts.mono, fontSize: 13, letterSpacing: '0.22em', color: colors.goldMuted, textTransform: 'uppercase', marginTop: 38}}>{step.eyebrow}</div>
          <h2 style={{fontFamily: fonts.display, fontSize: stepIndex === 3 ? 66 : 74, lineHeight: 1.02, fontWeight: 500, color: colors.cream, margin: '16px 0 25px', maxWidth: 800}}>{step.title}</h2>
          <p style={{fontFamily: fonts.body, fontSize: 24, lineHeight: 1.56, color: colors.copy, maxWidth: 770, margin: 0}}>{step.description}</p>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 34, padding: '13px 18px', borderRadius: 999, border: '1px solid rgba(212,175,55,0.22)', color: 'rgba(245,242,235,0.72)', fontFamily: fonts.body, fontSize: 14, background: 'rgba(255,215,0,0.04)'}}>
            <span style={{color: colors.gold}}>✦</span> {note}
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'center'}}><SignupCard mode={mode} /></div>
      </AbsoluteFill>
      <Progress step={step.number} />
    </Scene>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 13, stiffness: 82}});
  return (
    <Scene duration={75}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <div style={{opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.94, 1])})`}}>
          <div style={{fontFamily: fonts.mono, fontSize: 13, letterSpacing: '0.26em', color: colors.gold, marginBottom: 24}}>READY WHEN YOU ARE</div>
          <h2 style={{fontFamily: fonts.display, fontSize: 88, fontWeight: 500, color: colors.cream, margin: 0}}>Sign up. Sign in. Start saving.</h2>
          <div style={{display: 'inline-flex', alignItems: 'center', marginTop: 38, height: 58, padding: '0 34px', borderRadius: 10, background: 'linear-gradient(135deg,#ffd700,#c59b27)', color: colors.obsidian, fontFamily: fonts.mono, fontSize: 13, fontWeight: 900, letterSpacing: '0.2em'}}>CREATE YOUR ACCOUNT →</div>
          <p style={{fontFamily: fonts.body, fontSize: 17, color: colors.copy, marginTop: 24}}>meenamma.org/register</p>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

export const SignupTutorial: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.obsidian}}>
      <BrandBackground />
      <Sequence from={0} durationInFrames={120}><Intro /></Sequence>
      <Sequence from={105} durationInFrames={210}><StepScene stepIndex={0} mode="choice" duration={210} note="Use the same account for every Meenamma service." /></Sequence>
      <Sequence from={300} durationInFrames={210}><StepScene stepIndex={1} mode="details" duration={210} note="Use at least eight characters and one number." /></Sequence>
      <Sequence from={495} durationInFrames={180}><StepScene stepIndex={2} mode="verify" duration={180} note="Referral codes remain attached through verification." /></Sequence>
      <Sequence from={660} durationInFrames={180}><StepScene stepIndex={3} mode="dashboard" duration={180} note="Only signed-in members can open Daily Kudam." /></Sequence>
      <Sequence from={825} durationInFrames={75}><Outro /></Sequence>
    </AbsoluteFill>
  );
};

export const signupTutorialConfig = {
  id: 'SignupTutorialRemotion',
  durationInFrames: 900,
  fps: FPS,
  width: 1920,
  height: 1080,
};
