// 3D page-plane camera shared by the Skills fly-through: one set of numbers drives both the
// CSS transform and the projected screen positions, so tracking boxes stay glued to the page.
export const CYAN = "#33e1ff";

export type PlaneCam = {
  d: number; // CSS perspective (parent origin at 540, 960)
  rx: number; // deg, positive tips the far end away (floor)
  rz: number; // deg
  s: number;
  cx: number;
  cy: number;
  tz: number;
  scroll: number; // page y under the focus point
  pageW: number;
};

const rad = (d: number) => (d * Math.PI) / 180;

export const projectPt = (c: PlaneCam, px: number, py: number): [number, number] => {
  const u = (px - c.pageW / 2) * c.s;
  const v = (py - c.scroll) * c.s;
  const cz = Math.cos(rad(c.rz));
  const sz = Math.sin(rad(c.rz));
  const x1 = u * cz - v * sz;
  const y1 = u * sz + v * cz;
  const y2 = y1 * Math.cos(rad(c.rx));
  const z2 = y1 * Math.sin(rad(c.rx));
  const X = x1 + c.cx;
  const Y = y2 + c.cy;
  const Z = z2 + c.tz;
  const k = c.d / Math.max(1, c.d - Z);
  return [540 + (X - 540) * k, 960 + (Y - 960) * k];
};

export const projectRect = (c: PlaneCam, x: number, y: number, w: number, h: number): [number, number][] => [
  projectPt(c, x, y),
  projectPt(c, x + w, y),
  projectPt(c, x + w, y + h),
  projectPt(c, x, y + h),
];

export const planeTransform = (c: PlaneCam) =>
  `translate3d(${c.cx}px, ${c.cy}px, ${c.tz}px) rotateX(${c.rx}deg) rotateZ(${c.rz}deg) scale(${c.s}) translate(${-c.pageW / 2}px, ${-c.scroll}px)`;
