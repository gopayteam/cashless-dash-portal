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
  },

  // SALTY SUPPORTERS CLUB — LIME GREEN + BLACK BRAND
  GS000007: {
    light: {
      '--primary-color': '#2D5016',        // deep forest green — readable on white
      '--primary-color-dark': '#1E3A0E',   // darker for hover states
      '--primary-hover': '#3D6B1F',        // slightly lighter for hover
      '--secondary-color': '#8AB833',      // muted lime — accent without harshness
      '--secondary-color-dark': '#6E9A22', // deeper lime for dark accents
      '--bg-sidebar': '#F4F8EE',           // very light green tint, almost white
      '--bg-topbar': '#EBF2DC'             // slightly deeper tint for topbar
    },
    dark: {
      '--primary-color': '#A8CC2E',        // lime that reads well on dark bg
      '--primary-hover': '#BADA3A',        // brighter on hover
      '--primary-active': '#8FAF22',       // pressed state
      '--secondary-color': '#6B9E1F',      // muted green accent
      '--bg-sidebar': '#141F0A',           // very deep forest
      '--bg-topbar': '#141F0A'
    }
  }
};
