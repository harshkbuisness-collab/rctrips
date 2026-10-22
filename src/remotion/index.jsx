import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/anton/400.css';
import '@fontsource/oswald/700.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/caveat/700.css';
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel.jsx';
import sample from '../../projects/sample-project.json';

const Root = () => {
  const fps = sample.fps || 30;
  return <Composition
    id="Reel"
    component={Reel}
    durationInFrames={Math.round((sample.durationSec || 18) * fps)}
    fps={fps}
    width={sample.width || 1080}
    height={sample.height || 1920}
    defaultProps={{project: sample}}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.round((props.project.durationSec || 18) * (props.project.fps || 30)),
      fps: props.project.fps || 30,
      width: props.project.width || 1080,
      height: props.project.height || 1920,
    })}
  />;
};

registerRoot(Root);
