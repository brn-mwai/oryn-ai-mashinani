// Stub for culori color conversion library

export type Color = {
  r: number;
  g: number;
  b: number;
  alpha?: number;
};

export function oklch(color: string): Color | undefined {
  // Parse hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16) / 255,
        g: parseInt(hex[1] + hex[1], 16) / 255,
        b: parseInt(hex[2] + hex[2], 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
      };
    }
  }
  // Return a default gray for any other format
  return { r: 0.5, g: 0.5, b: 0.5 };
}

export function rgb(color: Color | undefined): Color | undefined {
  return color;
}

export function parse(color: string): Color | undefined {
  return oklch(color);
}
