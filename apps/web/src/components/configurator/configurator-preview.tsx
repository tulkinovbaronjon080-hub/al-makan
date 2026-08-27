import type { OpeningDirection } from "@al-makan/types";

interface ConfiguratorPreviewProps {
  widthMm: number;
  heightMm: number;
  sections: number;
  openingDirection: OpeningDirection;
}

const VIEW_SIZE = 400;
const FRAME_COLOR = "#5C697A";
const GLASS_FILL = "#DCEAF7";
const GLASS_STROKE = "#9DBEDB";
const SASH_LINE = "#9AA3B2";

/**
 * Proves out width/height/section-count/opening-direction layout — not
 * photorealistic color matching (Phase 3's Color has no hex value; see the
 * Phase 4 plan for why that's a deliberate, deferred simplification).
 */
export function ConfiguratorPreview({ widthMm, heightMm, sections, openingDirection }: ConfiguratorPreviewProps) {
  const aspect = widthMm / heightMm;
  const viewW = aspect >= 1 ? VIEW_SIZE : VIEW_SIZE * aspect;
  const viewH = aspect >= 1 ? VIEW_SIZE / aspect : VIEW_SIZE;
  const frame = Math.max(6, Math.min(viewW, viewH) * 0.035);

  const innerX = frame;
  const innerY = frame;
  const innerW = viewW - frame * 2;
  const innerH = viewH - frame * 2;
  const paneCount = Math.max(1, sections);
  const gap = frame * 0.6;
  const paneW = (innerW - gap * (paneCount - 1)) / paneCount;

  const panes = Array.from({ length: paneCount }, (_, i) => ({
    x: innerX + i * (paneW + gap),
    y: innerY,
    w: paneW,
    h: innerH,
  }));

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-full w-full" role="img" aria-label="Product preview">
      <rect x={0} y={0} width={viewW} height={viewH} fill="none" stroke={FRAME_COLOR} strokeWidth={frame} />
      {panes.map((pane, i) => (
        <g key={i}>
          <rect x={pane.x} y={pane.y} width={pane.w} height={pane.h} fill={GLASS_FILL} stroke={GLASS_STROKE} strokeWidth={2} />
          <OpeningIndicator pane={pane} direction={openingDirection} />
        </g>
      ))}
    </svg>
  );
}

function OpeningIndicator({
  pane,
  direction,
}: {
  pane: { x: number; y: number; w: number; h: number };
  direction: OpeningDirection;
}) {
  const inset = Math.min(pane.w, pane.h) * 0.12;
  const x1 = pane.x + inset;
  const y1 = pane.y + inset;
  const x2 = pane.x + pane.w - inset;
  const y2 = pane.y + pane.h - inset;

  if (direction === "FIXED") return null;

  if (direction === "TILT_TURN") {
    return (
      <>
        <line x1={x1} y1={y2} x2={(x1 + x2) / 2} y2={y1} stroke={SASH_LINE} strokeWidth={1.5} />
        <line x1={x2} y1={y2} x2={(x1 + x2) / 2} y2={y1} stroke={SASH_LINE} strokeWidth={1.5} />
        <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={SASH_LINE} strokeWidth={1.5} />
      </>
    );
  }

  // Diagonal points toward the hinge side (architectural window-schedule convention).
  const [hingeX, farX] = direction === "LEFT_HINGED" ? [x1, x2] : [x2, x1];
  return (
    <>
      <line x1={farX} y1={y1} x2={hingeX} y2={(y1 + y2) / 2} stroke={SASH_LINE} strokeWidth={1.5} />
      <line x1={farX} y1={y2} x2={hingeX} y2={(y1 + y2) / 2} stroke={SASH_LINE} strokeWidth={1.5} />
    </>
  );
}
