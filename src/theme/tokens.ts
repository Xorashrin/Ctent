// Ctent Design System Tokens — extracted via REA from app-release.apk (Lc9/b & Lr8/g bytecode).
// Cosmic Violet-Black surfaces (#07060B -> #26222F) with 4-stop Electric Violet/Magenta neon accents.
import { Easing } from 'react-native';

export const colors = {
  // Primary Ctent Brand Accents (Lc9/b.f, g, h, i)
  indigo: '#3B1CFF',
  violet: '#8B2CF5',
  magenta: '#E21CF0',
  pink: '#FF2D95',
  cyan: '#3DDCFF',
  lime: '#9DFF6A',
  orange: '#FF8A3D',
  accentPurple: '#3B1CFF',
  accentViolet: '#8B2CF5',
  accentMagenta: '#E21CF0',
  accentPink: '#FF2D95',
  outline: 'rgba(255,255,255,0.14)',
  outlineActive: 'rgba(226,28,240,0.45)',

  // Legacy aliases mapped to Ctent Electric Violet & Magenta so shared components stay 100% Ctent-styled
  red: '#8B2CF5',
  redPressed: '#6E1FD1',
  redLight: '#E21CF0',
  blue: '#3DDCFF',

  // Cosmic Violet-Black Surfaces (Lc9/b.a, b, c, d, e)
  bg: '#07060B',
  surface0: '#0C0A12',
  surface1: '#121019',
  surface2: '#1B1824',
  surface3: '#26222F',
  surface4: '#302B3D',
  surface5: '#3D374F',
  surface6: '#4E4763',
  border: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.20)',

  // Typography Hierarchy (Lc9/b.j, k, l)
  text: '#FFFFFF',
  text90: 'rgba(255,255,255,0.92)',
  text80: 'rgba(255,255,255,0.82)',
  text70: 'rgba(255,255,255,0.72)',
  textMuted: '#B9B4C7',
  textSoft: '#C8C3D6',
  textDim: '#7D778C',
  textFaint: '#5E586E',
  link: '#E21CF0',

  // Status & Semantic Tokens (Lc9/b.m, n, o, p)
  online: '#22D37A',
  success: '#22D37A',
  warning: '#FFB020',
  danger: '#FF4D5E',
  gold: '#FFC53D',
  love: '#FF2D95',

  // Scrims & Glass
  scrim: 'rgba(7,6,11,0.58)',
  overlay: 'rgba(7,6,11,0.92)',
  glassButton: 'rgba(38,34,47,0.72)',
} as const;

export const GRADIENTS = {
  brand: ['#3B1CFF', '#8B2CF5', '#E21CF0', '#FF2D95'] as const,
  pill: ['#8B2CF5', '#E21CF0'] as const,
  pinkOrange: ['#FF2D95', '#FF8A3D'] as const,
  heroScrim: ['rgba(7,6,11,0)', 'rgba(7,6,11,0.35)', 'rgba(7,6,11,0.88)', '#07060B'] as const,
  topScrim: ['rgba(7,6,11,0.88)', 'rgba(7,6,11,0.42)', 'rgba(7,6,11,0)'] as const,
  cardScrim: ['rgba(7,6,11,0)', 'rgba(7,6,11,0.85)'] as const,
} as const;

// Lr8/g Portal & Genre Accent Palette
export const PORTAL_PALETTE = [
  '#FF6FB5', // Sakura Pink
  '#3DDCFF', // Cyber Cyan
  '#9DFF6A', // Neon Lime
  '#FF8A3D', // Solar Orange
  '#FF3D6E', // Crimson Rose
  '#8B2CF5', // Electric Violet
  '#E21CF0', // Neon Magenta
  '#22D37A', // Emerald Mint
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
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
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
  fast: 150,
  base: 220,
  slow: 300,
  slower: 420,
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
} as const;

export const layout = {
  gutter: 14,
  headerHeight: 56,
  chipRowHeight: 46,
  tabBarHeight: 62,
} as const;
