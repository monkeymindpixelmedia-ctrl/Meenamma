import React from 'react';
import {Composition} from 'remotion';
import {SignupTutorial, signupTutorialConfig} from './SignupTutorial';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={signupTutorialConfig.id}
      component={SignupTutorial}
      durationInFrames={signupTutorialConfig.durationInFrames}
      fps={signupTutorialConfig.fps}
      width={signupTutorialConfig.width}
      height={signupTutorialConfig.height}
      defaultProps={{}}
    />
  );
};
