// Renders one sprite frame as crisp SVG pixels.
import { useMemo } from 'preact/hooks';
import { FRAMES, PALETTE, type FrameName } from './sprite-frames';

export function PixelCat({ frame, flip = false, size = 64 }: { frame: FrameName; flip?: boolean; size?: number }) {
  const rects = useMemo(
    () =>
      FRAMES[frame].flatMap((row, y) =>
        [...row].flatMap((ch, x) => (PALETTE[ch] ? [<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[ch]} />] : [])),
      ),
    [frame],
  );
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shape-rendering="crispEdges"
      role="img"
      aria-label="Kitty the cat"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      {rects}
    </svg>
  );
}
