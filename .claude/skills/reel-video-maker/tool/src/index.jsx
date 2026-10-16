import '@fontsource/anton/400.css';
import '@fontsource/luckiest-guy/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/jost/600.css';
import '@fontsource/jost/600-italic.css';
import '@fontsource/jost/700-italic.css';
import '@fontsource/jost/800.css';
import '@fontsource/jost/800-italic.css';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/archivo-black/400.css';
import '@fontsource/archivo/800.css';
import '@fontsource/unbounded/800.css';
import '@fontsource/dela-gothic-one/400.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/lilita-one/400.css';
import '@fontsource/rubik/800.css';
import '@fontsource/rubik/800-italic.css';
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ReelVideo} from './Video.jsx';
import {TimelineSchema, timelineDuration} from './schema.js';

// Props come from scripts/render.mjs or scripts/studio.mjs ({timeline, library}).
// The timeline is re-parsed here so schema defaults are always applied.
const fallback = {timeline: {scenes: [{start: 0, end: 2, layers: []}]}, library: {assets: []}};

const Root = () => <Composition
  id="Reel"
  component={ReelVideo}
  defaultProps={fallback}
  durationInFrames={60}
  fps={30}
  width={1080}
  height={1920}
  calculateMetadata={({props}) => {
    const timeline = TimelineSchema.parse(props.timeline);
    const fps = timeline.canvas.fps;
    return {
      props: {...props, timeline},
      fps,
      width: timeline.canvas.width,
      height: timeline.canvas.height,
      durationInFrames: Math.max(1, Math.ceil(timelineDuration(timeline) * fps)),
    };
  }}
/>;

registerRoot(Root);
