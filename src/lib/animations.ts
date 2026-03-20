/**
 * Professional Animation Utilities
 * Subtle, polished animations that make the UI feel alive without being distracting
 * RTL-safe and accessible
 */

export const AnimationClasses = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',

  // Slide animations
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',

  // Zoom animations
  zoomIn: 'animate-in zoom-in-95 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-200',

  // Scale animations
  scaleUp: 'transition-transform duration-200 hover:scale-105',
  scaleHover: 'transition-all duration-200 hover:scale-102',

  // Color transitions
  colorTransition: 'transition-colors duration-200',
  shadowTransition: 'transition-shadow duration-200',
  allTransition: 'transition-all duration-200',

  // Bounce animations
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',

  // Smooth transitions
  smoothTransition: 'transition ease-in-out duration-300',
};

/**
 * CSS for subtle, professional animations
 * Add this to your global CSS or Tailwind config
 */
export const AnimationStyles = `
  /* Smooth page transitions */
  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Smooth focus for RTL */
  input:focus,
  textarea:focus,
  select:focus {
    @apply outline-none ring-2 ring-primary ring-offset-2;
  }

  /* Smooth button interactions */
  button {
    @apply transition-all duration-200;
  }

  button:active:not(:disabled) {
    @apply scale-95;
  }

  /* Smooth card hover */
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:scale-102;
  }

  /* Loading skeleton animation */
  .skeleton {
    @apply animate-pulse bg-muted rounded;
  }

  /* Smooth scroll behavior */
  html {
    scroll-behavior: smooth;
  }
`;

/**
 * Tailwind configuration for animations
 * Add to your tailwind.config.ts extend section
 */
export const TailwindAnimationConfig = {
  extend: {
    keyframes: {
      slideInFromRight: {
        '0%': { opacity: '0', transform: 'translateX(10px)' },
        '100%': { opacity: '1', transform: 'translateX(0)' },
      },
      slideInFromLeft: {
        '0%': { opacity: '0', transform: 'translateX(-10px)' },
        '100%': { opacity: '1', transform: 'translateX(0)' },
      },
      slideInFromTop: {
        '0%': { opacity: '0', transform: 'translateY(-10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      slideInFromBottom: {
        '0%': { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      scaleIn: {
        '0%': { opacity: '0', transform: 'scale(0.95)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
    },
    animation: {
      slideInFromRight: 'slideInFromRight 0.3s ease-out',
      slideInFromLeft: 'slideInFromLeft 0.3s ease-out',
      slideInFromTop: 'slideInFromTop 0.3s ease-out',
      slideInFromBottom: 'slideInFromBottom 0.3s ease-out',
      scaleIn: 'scaleIn 0.2s ease-out',
    },
  },
};

/**
 * React hook for applying animations programmatically
 */
export function useAnimation(animationType: keyof typeof AnimationClasses) {
  const animationClass = AnimationClasses[animationType];
  return animationClass;
}
