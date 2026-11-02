// Renders one frame of Kitty's sprite sheet.
import { ANIMATIONS, CELL, SHEET_COLS, SHEET_ROWS, SHEET_URL, type Frame } from './sprite-sheet';

export function PixelCat({ frame, flip = false, size = CELL }: { frame: Frame; flip?: boolean; size?: number }) {
  const scale = size / CELL;
  const { row } = ANIMATIONS[frame.anim];
  return (
    <div
      class="sprite"
      role="img"
      aria-label="Kitty the cat"
      data-frame={`${frame.anim}-${frame.index}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${SHEET_URL})`,
        backgroundSize: `${SHEET_COLS * size}px ${SHEET_ROWS * size}px`,
        backgroundPosition: `-${frame.index * CELL * scale}px -${row * CELL * scale}px`,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}
