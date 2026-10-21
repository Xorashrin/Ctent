// MythTube Design System Tokens — "Aurora Slate & Mint-Cyan" Edition
// Clean, breathable deep midnight-slate surfaces (#060A10 -> #1E2C42) with
// Aurora Mint (#00E5B0), Glacier Cyan (#0EA5E9), and Solar Amber (#F59E0B) accents.
import { Easing } from 'react-native';

export const colors = {
  // Primary MythTube Aurora Brand Accents
  mint: '#00E5B0',
  cyan: '#0EA5E9',
  sapphire: '#3B82F6',
  amber: '#F59E0B',
  coral: '#F43F5E',
  rose: '#F43F5E',
  lime: '#10B981',
  emerald: '#10B981',
  orange: '#F97316',

  // Semantic aliases used across shared components (mapped to Aurora Mint & Glacier Cyan)
  indigo: '#0EA5E9',
  violet: '#00E5B0',
  magenta: '#00E5B0',
  pink: '#0EA5E9',
  accentPurple: '#0EA5E9',
  accentViolet: '#00E5B0',
  accentMagenta: '#00E5B0',
  accentPink: '#F43F5E',
  red: '#00E5B0',
  redPressed: '#00B88D',
  redLight: '#38BDF8',
  blue: '#0EA5E9',

  // Deep Midnight-Slate Surfaces (clean, high-contrast, easy on eyes)
  bg: '#060A10',
  surface0: '#090F18',
  surface1: '#0D1522',
  surface2: '#131E30',
  surface3: '#1A2940',
  surface4: '#223552',
  surface5: '#2C4263',
  surface6: '#385278',
  border: 'rgba(148, 163, 184, 0.14)',
  borderStrong: 'rgba(148, 163, 184, 0.32)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  outline: 'rgba(148, 163, 184, 0.14)',
  outlineActive: 'rgba(0, 229, 176, 0.48)',

  // Crisp Slate Typography Hierarchy
  text: '#F8FAFC',
  text90: 'rgba(248, 250, 252, 0.92)',
  text80: 'rgba(248, 250, 252, 0.82)',
  text70: 'rgba(248, 250, 252, 0.72)',
  textMuted: '#94A3B8',
  textSoft: '#CBD5E1',
  textDim: '#64748B',
  textFaint: '#475569',
  link: '#00E5B0',

  // Status & Semantic Tokens
  online: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  gold: '#FBBF24',
  love: '#F43F5E',

  // Scrims & Frosted Glass
  scrim: 'rgba(6, 10, 16, 0.62)',
  overlay: 'rgba(6, 10, 16, 0.92)',
  glassButton: 'rgba(19, 30, 48, 0.78)',
} as const;

export const GRADIENTS = {
  brand: ['#00E5B0', '#0EA5E9', '#3B82F6'] as const,
  pill: ['#00E5B0', '#0EA5E9'] as const,
  pinkOrange: ['#F59E0B', '#F97316'] as const,
  heroScrim: ['rgba(6,10,16,0)', 'rgba(6,10,16,0.38)', 'rgba(6,10,16,0.90)', '#060A10'] as const,
  topScrim: ['rgba(6,10,16,0.90)', 'rgba(6,10,16,0.45)', 'rgba(6,10,16,0)'] as const,
  cardScrim: ['rgba(6,10,16,0)', 'rgba(6,10,16,0.88)'] as const,
} as const;

// Clean Aurora & Ocean Portal Accent Palette
export const PORTAL_PALETTE = [
  '#00E5B0', // Aurora Mint
  '#0EA5E9', // Glacier Cyan
  '#3B82F6', // Royal Sapphire
  '#F59E0B', // Solar Amber
  '#10B981', // Emerald
  '#06B6D4', // Teal Cyan
  '#6366F1', // Indigo Slate
  '#F97316', // Warm Coral
] as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  pill: 999,
} as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_700Bold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_700Bold',
  black: 'Inter_700Bold',
  display: 'Inter_700Bold',
} as const;

export type FontWeight = keyof typeof font;

export const textSize = {
  micro: 10,
  caption: 12,
  small: 13,
  body: 14,
  bodyLarge: 16,
  title: 18,
  heading: 20,
  display: 24,
} as const;

export const motion = {
  fast: 160,
  base: 240,
  slow: 340,
  slower: 480,
  standard: Easing.bezier(0.22, 1, 0.36, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
} as const;

export const layout = {
  gutter: 16,
  headerHeight: 58,
  chipRowHeight: 48,
  tabBarHeight: 64,
} as const;
