/**
 * Color utility functions and constants for the application
 * Dark theme specific colors
 */

// Color palette
export const colors = {
  // Primary colors
  primary: {
    DEFAULT: 'rgb(255, 115, 179)',
    light: 'rgb(255, 166, 209)',
    dark: 'rgb(204, 51, 128)',
    50: 'rgb(255, 240, 247)',
    100: 'rgb(255, 226, 240)',
    200: 'rgb(255, 196, 224)',
    300: 'rgb(255, 166, 209)',
    400: 'rgb(255, 140, 194)',
    500: 'rgb(255, 115, 179)',
    600: 'rgb(230, 92, 153)',
    700: 'rgb(204, 51, 128)',
    800: 'rgb(179, 26, 102)',
    900: 'rgb(153, 0, 77)',
  },
  
  // Secondary colors
  secondary: {
    DEFAULT: 'rgb(130, 71, 229)',
    light: 'rgb(161, 119, 234)',
    dark: 'rgb(98, 43, 187)',
    50: 'rgb(242, 237, 253)',
    100: 'rgb(230, 219, 250)',
    200: 'rgb(204, 184, 246)',
    300: 'rgb(179, 148, 241)',
    400: 'rgb(161, 119, 234)',
    500: 'rgb(130, 71, 229)',
    600: 'rgb(114, 55, 212)',
    700: 'rgb(98, 43, 187)',
    800: 'rgb(81, 30, 161)',
    900: 'rgb(65, 18, 136)',
  },
  
  // Accent colors
  accent: {
    DEFAULT: 'rgb(0, 204, 136)',
    light: 'rgb(77, 224, 173)',
    dark: 'rgb(0, 153, 102)',
    50: 'rgb(236, 253, 246)',
    100: 'rgb(217, 251, 238)',
    200: 'rgb(179, 247, 221)',
    300: 'rgb(128, 240, 199)',
    400: 'rgb(77, 224, 173)',
    500: 'rgb(0, 204, 136)',
    600: 'rgb(0, 179, 119)',
    700: 'rgb(0, 153, 102)',
    800: 'rgb(0, 128, 85)',
    900: 'rgb(0, 102, 68)',
  },
  
  // Dark theme specific colors
  background: 'rgb(17, 24, 39)',
  foreground: 'rgb(250, 250, 250)',
  card: 'rgb(31, 41, 55)',
  cardForeground: 'rgb(250, 250, 250)',
  popover: 'rgb(31, 41, 55)',
  popoverForeground: 'rgb(250, 250, 250)',
  muted: 'rgb(156, 163, 175)',
  mutedForeground: 'rgb(156, 163, 175)',
  border: 'rgb(55, 65, 81)',
  input: 'rgb(55, 65, 81)',
  
  // Feedback colors
  success: 'rgb(34, 197, 94)',
  warning: 'rgb(234, 179, 8)',
  error: 'rgb(239, 68, 68)',
  info: 'rgb(59, 130, 246)',
};

/**
 * Converts a hex color to RGB format
 * @param hex Hex color code (e.g., #FF73B3)
 * @returns RGB values as an object { r, g, b }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB values to a hex color code
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Hex color code (e.g., #FF73B3)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Adjusts the brightness of a color
 * @param color Hex color code
 * @param amount Amount to adjust (-1 to 1, negative darkens, positive lightens)
 * @returns Adjusted hex color
 */
export function adjustBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const { r, g, b } = rgb;
  
  const newR = Math.max(0, Math.min(255, r + amount * 255));
  const newG = Math.max(0, Math.min(255, g + amount * 255));
  const newB = Math.max(0, Math.min(255, b + amount * 255));
  
  return rgbToHex(Math.round(newR), Math.round(newG), Math.round(newB));
}

/**
 * Creates a CSS variable value for RGB
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns CSS variable value (e.g., "255 115 179")
 */
export function rgbToCssVar(r: number, g: number, b: number): string {
  return `${r} ${g} ${b}`;
}

