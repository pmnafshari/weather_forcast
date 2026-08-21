// Design system tokens for Weather Intelligence mobile app
export const Colors = {
  bg: '#07111F',
  surface: '#0B1728',
  surface2: '#0F1D31',
  elevated: '#13243A',
  elevated2: '#172A43',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#1E3350',
  borderLight: '#2a4570',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#A855F7',
  orange: '#F97316',
  lime: '#84CC16',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    hero: 64,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
