export const THEMES: Record<string, any> = {
  default: {
    light: {
      '--primary-color': '#0e2c5a',
      '--primary-color-dark': '#093170',
      '--primary-hover': '#1a3f7a',
      '--secondary-color': '#c82333',
      '--secondary-color-dark': '#7f0000',
    },
    dark: {
      '--primary-color': '#4f83ff',
      '--primary-hover': '#6b97ff',
      '--primary-active': '#3b6ae6',
      '--secondary-color': '#ff5c5c',
    }
  },

  // SAME BRANDING AS DEFAULT
  GS000002: {
    light: {
      '--primary-color': '#0e2c5a',
      '--primary-color-dark': '#093170',
      '--primary-hover': '#1a3f7a',
      '--secondary-color': '#c82333',
      '--secondary-color-dark': '#7f0000',
    },
    dark: {
      '--primary-color': '#4f83ff',
      '--primary-hover': '#6b97ff',
      '--primary-active': '#3b6ae6',
      '--secondary-color': '#ff5c5c',
    }
  },

  // GREEN + ORANGE BRAND
  GS000006: {
    light: {
      '--primary-color': '#2E7D32',
      '--primary-color-dark': '#1B5E20',
      '--primary-hover': '#43A047',
      '--secondary-color': '#FB8C00',
      '--secondary-color-dark': '#EF6C00',
      '--bg-sidebar': '#E8F5E9',
      '--bg-topbar': '#C8E6C9'
    },
    dark: {
      '--primary-color': '#66BB6A',
      '--primary-hover': '#81C784',
      '--primary-active': '#4CAF50',
      '--secondary-color': '#FFB74D',
      '--bg-sidebar': '#1B2A1F',
      '--bg-topbar': '#1B2A1F'
    }
  }
};
