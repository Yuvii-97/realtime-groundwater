import { scale, verticalScale } from "@/utils/styling";

// Light Theme Colors
export const lightColors = {
  primary: "#0ea5e9",       // bright blue
  primaryLight: "#7dd3fc",  // lighter blue
  primaryDark: "#0369a1",   // deep blue
  secondary: "#16a34a",     // green
  secondaryLight: "#bbf7d0", // light green
  secondaryDark: "#15803d", // deep green
  background: "#F0FFFE",    // light background
  surface: "#FFFFFF",       // card/surface background
  surfaceSecondary: "#f8fafc", // secondary surface
  text: "#1f2937",          // primary text
  textSecondary: "#6b7280", // secondary text
  textLight: "#9ca3af",     // light text
  border: "#e5e7eb",        // borders
  borderLight: "#f3f4f6",   // light borders
  white: "#ffffff",
  black: "#000000",
  hero: "#075a7dff",        // hero section
  danger: "#ef4444",        // for alerts
  warning: "#f59e0b",       // warnings
  success: "#10b981",       // success
  info: "#3b82f6",          // info
};

// Dark Theme Colors
export const darkColors = {
  primary: "#3b82f6",       // bright blue for dark
  primaryLight: "#60a5fa",  // lighter blue for dark
  primaryDark: "#1d4ed8",   // deep blue for dark
  secondary: "#10b981",     // green for dark
  secondaryLight: "#34d399", // light green for dark
  secondaryDark: "#059669", // deep green for dark
  background: "#0f172a",    // dark background
  surface: "#1e293b",       // card/surface background dark
  surfaceSecondary: "#334155", // secondary surface dark
  text: "#f8fafc",          // primary text dark
  textSecondary: "#cbd5e1", // secondary text dark
  textLight: "#94a3b8",     // light text dark
  border: "#475569",        // borders dark
  borderLight: "#64748b",   // light borders dark
  white: "#ffffff",
  black: "#000000",
  hero: "#1e40af",          // hero section dark
  danger: "#f87171",        // for alerts dark
  warning: "#fbbf24",       // warnings dark
  success: "#34d399",       // success dark
  info: "#60a5fa",          // info dark
};

// Legacy colors for backward compatibility
export const colors = lightColors;


export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
};

export const spacingY = {
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
};
