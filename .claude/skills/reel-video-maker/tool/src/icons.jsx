// Simple bold icons (24 x 24 grid) for icon badges and stat cards. Each draws in `color`.
import React from 'react';

const svg = (size, children) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible'}}>{children}</svg>;
const S = (color) => ({fill: 'none', stroke: color, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round'});

export const ICONS = {
  dumbbell: ({size, color}) => svg(size, <g fill={color}>
    <rect x={1} y={8.5} width={2.4} height={7} rx={1}/><rect x={3.8} y={6} width={3.2} height={12} rx={1.2}/>
    <rect x={7} y={10.6} width={10} height={2.8} rx={1}/>
    <rect x={17} y={6} width={3.2} height={12} rx={1.2}/><rect x={20.6} y={8.5} width={2.4} height={7} rx={1}/></g>),
  clock: ({size, color}) => svg(size, <g {...S(color)}><circle cx={12} cy={12} r={9.5}/><path d="M12 6.5V12l3.8 2.4"/></g>),
  timer: ({size, color}) => svg(size, <g {...S(color)}><circle cx={12} cy={13.5} r={8.5}/><path d="M12 9v4.5l3 2M9.5 2.5h5M12 2.5V5M19 6l1.6-1.6"/></g>),
  fire: ({size, color}) => svg(size, <path fill={color} d="M12 1.8c.6 3.4 4.2 5.4 5.6 8.6 1.9 4.4-.7 10.4-5.6 10.4S4.6 17.6 5.6 13.4c.6-2.5 2.4-3.6 2.8-6 1.3 1.2 1.6 2.9 1.4 4.4 1.9-2.4 2.8-6.5 2.2-10zM12 20c1.9 0 3.2-1.5 3-3.4-.2-1.6-1.5-2.4-2-4-1 1.4-1.4 2.3-2.3 3-.6-.6-.8-1.2-.8-1.8-1 .9-1.3 1.9-1.1 3 .3 1.8 1.6 3.2 3.2 3.2z"/>),
  water: ({size, color}) => svg(size, <path fill={color} d="M12 2c3.2 4.4 7 8.6 7 12.6A7 7 0 0 1 5 14.6C5 10.6 8.8 6.4 12 2zm-3.6 12.4a.9.9 0 0 0-1.8.1 5.4 5.4 0 0 0 4.6 5.1.9.9 0 0 0 .3-1.8 3.6 3.6 0 0 1-3.1-3.4z"/>),
  calendar: ({size, color}) => svg(size, <g {...S(color)}><rect x={3} y={4.5} width={18} height={16.5} rx={2.5}/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>
    <path d="M8.5 15l2.4 2.4 4.6-4.8"/></g>),
  heart: ({size, color}) => svg(size, <path fill={color} d="M12 21s-8.5-5.3-8.5-11.4A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 8.5 3C20.5 15.7 12 21 12 21z"/>),
  bolt: ({size, color}) => svg(size, <path fill={color} d="M13.5 1.5 4 13.5h6.5l-1.5 9 9.5-12h-6.5z"/>),
  trophy: ({size, color}) => svg(size, <g><path fill={color} d="M7 2.5h10v6.5a5 5 0 0 1-10 0z"/><path {...S(color)} d="M7 4.5H3.5v1.5A3.5 3.5 0 0 0 7 9.5M17 4.5h3.5v1.5A3.5 3.5 0 0 1 17 9.5M12 14v4M8 21.5h8M9 18h6"/></g>),
  check: ({size, color}) => svg(size, <path {...S(color)} strokeWidth={3.4} d="M4 12.5l5 5L20 6.5"/>),
  cross: ({size, color}) => svg(size, <path {...S(color)} strokeWidth={3.4} d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>),
  apple: ({size, color}) => svg(size, <g><path fill={color} d="M12 7.5c-1.5-1-5.5-1.6-7 1.8-1.6 3.6.6 9.9 3.5 11.6 1.3.8 2.4.2 3.5.2s2.2.6 3.5-.2c2.9-1.7 5.1-8 3.5-11.6-1.5-3.4-5.5-2.8-7-1.8z"/>
    <path {...S(color)} d="M12 7.5c0-2.2 1-3.8 3-5"/></g>),
  moon: ({size, color}) => svg(size, <path fill={color} d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>),
  scale: ({size, color}) => svg(size, <g {...S(color)}><rect x={3} y={3} width={18} height={18} rx={4}/><path d="M8 9a5 5 0 0 1 8 0l-2.2 2.2a2 2 0 0 0-3.6 0z"/></g>),
  phone: ({size, color}) => svg(size, <g {...S(color)}><rect x={6} y={1.8} width={12} height={20.4} rx={2.6}/><path d="M10.5 18.5h3"/></g>),
  warning: ({size, color}) => svg(size, <g><path fill={color} d="M12 2.5 22.5 20.5h-21z"/><path stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" d="M12 9v5.5M12 17.6v.1"/></g>),
  arrowUp: ({size, color}) => svg(size, <path {...S(color)} strokeWidth={3.2} d="M12 20.5V4M5 10.5 12 3.5l7 7"/>),
  arrowDown: ({size, color}) => svg(size, <path {...S(color)} strokeWidth={3.2} d="M12 3.5V20M5 13.5l7 7 7-7"/>),
  thumbsUp: ({size, color}) => svg(size, <g {...S(color)} strokeWidth={2}><path d="M7 10.5v10H3.5v-10z"/><path d="M7 10.5 11 3c1.6 0 2.6 1.2 2.2 2.8l-.8 3.2h5.8a2 2 0 0 1 2 2.4l-1.5 7.4a2 2 0 0 1-2 1.7H7"/></g>),
  muscle: ({size, color}) => svg(size, <path fill={color} d="M3 18.5c1.2-4.4 2.6-8.8 5-12.6.8-1.3 2.4-1.8 3.6-1l1.6 1.1c.8.6.8 1.8 0 2.4l-1.8 1.4c-.6.5-.4 1.4.3 1.7 1.6.6 3.3.4 4.8-.4 2.3-1.2 5-.2 5.4 2.6.6 4.2-3.1 7.2-7.6 7.2H4.4A1.4 1.4 0 0 1 3 18.5z"/>),
  steps: ({size, color}) => svg(size, <path fill={color} d="M2.5 20.5v-4.5h5v-4.5h5V7h4.5V2.5h4.5v18z"/>),
  brain: ({size, color}) => svg(size, <g {...S(color)}><path d="M12 4.5a3 3 0 0 0-5.6-1A3.5 3.5 0 0 0 3.5 8a3.5 3.5 0 0 0 .4 6.2A3.5 3.5 0 0 0 8 19.5a3 3 0 0 0 4 1V4.5z"/>
    <path d="M12 4.5a3 3 0 0 1 5.6-1A3.5 3.5 0 0 1 20.5 8a3.5 3.5 0 0 1-.4 6.2A3.5 3.5 0 0 1 16 19.5a3 3 0 0 1-4 1"/></g>),
  bed: ({size, color}) => svg(size, <g {...S(color)}><path d="M2.5 19.5v-12M2.5 15.5h19v4M21.5 15.5v-3a3 3 0 0 0-3-3h-7v6"/><circle cx={7} cy={11.5} r={1.8}/></g>),
};
export const ICON_NAMES = Object.keys(ICONS);
