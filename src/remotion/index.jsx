import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel.jsx';
import sample from '../../projects/sample-project.json';

const Root = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={Math.round((sample.durationSec || 18) * (sample.fps || 30))}
    fps={sample.fps || 30}
    width={sample.width || 1080}
    height={sample.height || 1920}
    defaultProps={{project: sample}}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, Math.round((props.project.durationSec || 18) * (props.project.fps || 30))),
      fps: props.project.fps || 30,
      width: props.project.width || 1080,
      height: props.project.height || 1920,
    })}
  />
);

registerRoot(Root);
