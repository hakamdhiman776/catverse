export type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function placeCat(anchorX: number, anchorY: number, aspectRatio: number): Placement {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const margin = clamp(Math.min(viewportWidth, viewportHeight) * 0.035, 14, 30);
  const maxWidth = Math.max(viewportWidth - margin * 2, 1);
  const maxHeight = Math.max(viewportHeight - margin * 2, 1);

  const preferredWidth = Math.min(viewportWidth * 0.52, viewportHeight * 0.46);
  const width = clamp(
    Math.min(preferredWidth, 520, maxWidth, maxHeight * aspectRatio),
    1,
    maxWidth,
  );
  const height = Math.min(width / aspectRatio, maxHeight);

  const maxX = Math.max(viewportWidth - width - margin, margin);
  const maxY = Math.max(viewportHeight - height - margin, margin);

  const x = clamp(anchorX - width / 2, margin, maxX);
  const y = clamp(anchorY - height / 2, margin, maxY);

  return { x, y, width, height };
}
