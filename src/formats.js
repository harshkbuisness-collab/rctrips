export const VIDEO_FORMATS = [
  {
    id: 'portrait',
    label: 'Portrait 9:16',
    shortLabel: '9:16',
    description: 'Full-screen vertical reel',
    width: 1080,
    height: 1920,
    designWidth: 1080,
    designHeight: 1920,
    mode: 'full',
  },
  {
    id: 'landscape',
    label: 'Landscape 16:9',
    shortLabel: '16:9',
    description: 'Full-screen horizontal video',
    width: 1920,
    height: 1080,
    designWidth: 1920,
    designHeight: 1080,
    mode: 'full',
  },
  {
    id: 'landscape-in-portrait',
    label: '9:16 Canvas + 16:9 Reel',
    shortLabel: '9:16 / 16:9',
    description: 'Vertical canvas with a centered landscape reel area',
    width: 1080,
    height: 1920,
    designWidth: 1920,
    designHeight: 1080,
    mode: 'window',
  },
];

const BY_ID = Object.fromEntries(VIDEO_FORMATS.map((f) => [f.id, f]));

export function inferFormatId(project = {}) {
  if (project.videoFormat && BY_ID[project.videoFormat]) return project.videoFormat;
  if (project.width === 1920 && project.height === 1080) return 'landscape';
  if (project.format === '16:9') return 'landscape';
  if (project.format === '9:16/16:9' || project.format === 'landscape-in-portrait') return 'landscape-in-portrait';
  return 'portrait';
}

export function getFormat(id = 'portrait') {
  return BY_ID[id] || BY_ID.portrait;
}

export function applyFormat(project, id) {
  const f = getFormat(id);
  return {
    ...project,
    videoFormat: f.id,
    format: f.id === 'portrait' ? '9:16' : f.id === 'landscape' ? '16:9' : '9:16/16:9',
    width: f.width,
    height: f.height,
  };
}

export function getActiveViewport(project = {}) {
  const f = getFormat(inferFormatId(project));
  if (f.mode === 'window') {
    const scale = Math.min(f.width / f.designWidth, f.height / f.designHeight);
    const width = f.designWidth * scale;
    const height = f.designHeight * scale;
    return {
      ...f,
      scale,
      activeWidth: width,
      activeHeight: height,
      offsetX: (f.width - width) / 2,
      offsetY: (f.height - height) / 2,
    };
  }
  return {
    ...f,
    scale: 1,
    activeWidth: f.width,
    activeHeight: f.height,
    offsetX: 0,
    offsetY: 0,
  };
}

export function getLayoutProfile(project = {}) {
  const viewport = getActiveViewport(project);
  const landscape = viewport.designWidth > viewport.designHeight;
  if (landscape) {
    return {
      ...viewport,
      orientation: 'landscape',
      safe: {left: 118, right: 118, top: 92, bottom: 92},
      contentMaxWidth: 1680,
      splitTextWidth: 720,
      splitVisualWidth: 720,
      splitGap: 82,
      textOnlyWidth: 1500,
      textMinHeight: 650,
      visualScaleBoost: 1.25,
      footerBottom: 55,
      footerWidth: 260,
      footerHeight: 5,
      maxTextOffsetX: 320,
      maxTextOffsetY: 230,
      maxVisualOffsetX: 320,
      maxVisualOffsetY: 230,
    };
  }
  return {
    ...viewport,
    orientation: 'portrait',
    safe: {left: 72, right: 72, top: 220, bottom: 240},
    contentMaxWidth: 950,
    splitTextWidth: 430,
    splitVisualWidth: 460,
    splitGap: 34,
    textOnlyWidth: 820,
    textMinHeight: 380,
    visualScaleBoost: 1,
    footerBottom: 170,
    footerWidth: 210,
    footerHeight: 6,
    maxTextOffsetX: 220,
    maxTextOffsetY: 360,
    maxVisualOffsetX: 220,
    maxVisualOffsetY: 360,
  };
}
