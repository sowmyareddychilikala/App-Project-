export const Theme = {
  colors: {
    // Dark Futuristic Canvas
    background: '#070A13',
    cardBackground: '#111726',
    border: '#1F293D',
    
    // Core Accent Colors
    primary: '#0D9488',     // Vibrant Teal
    primaryDark: '#0F766E', // Darker Teal
    primaryLight: '#2DD4BF',// Cyan/Teal glow
    secondary: '#3B82F6',   // Soft Tech Blue
    
    // Text Hierarchy
    textPrimary: '#F8FAFC',  // Slate 50 (Pure Off-white)
    textSecondary: '#94A3B8',// Slate 400 (Muted gray)
    textMuted: '#64748B',    // Slate 500 (Deep muted gray)
    
    // Status Semantic Indicators
    trusted: '#10B981',       // Emerald Green
    needsVerify: '#F59E0B',   // Warm Amber
    highRisk: '#EF4444',      // Intense Coral Red
    
    // Accent overlay
    white: '#FFFFFF',
    overlay: 'rgba(7, 10, 19, 0.75)',
    glassOverlay: 'rgba(17, 23, 38, 0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      huge: 32,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 5,
    },
    glowTeal: {
      shadowColor: '#0D9488',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 10,
    },
    glowRed: {
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 10,
    },
  },
};
