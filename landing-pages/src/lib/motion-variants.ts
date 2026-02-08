/**
 * Motion Variants Library for Questerix Landing Pages
 * Centralized animation configurations using Framer Motion
 */

import type { Variants } from 'framer-motion';

/**
 * Fade In Animation
 * Gradually appears from transparent to opaque
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide Up Animation
 * Enters from below while fading in
 */
export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1], // Custom easing curve
    },
  },
};

/**
 * Slide Down Animation
 * Enters from above while fading in
 */
export const slideDown: Variants = {
  hidden: {
    opacity: 0,
    y: -40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide Left Animation
 * Enters from the right while fading in
 */
export const slideLeft: Variants = {
  hidden: {
    opacity: 0,
    x: 60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

/**
 * Slide Right Animation
 * Enters from the left while fading in
 */
export const slideRight: Variants = {
  hidden: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

/**
 * Scale In Animation
 * Grows from smaller size while fading in
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/**
 * Scale Up Animation (larger initial state)
 * Useful for emphasis
 */
export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
    },
  },
};

/**
 * Stagger Container
 * Use for parent elements that contain multiple children
 * Children will animate in sequence
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // 150ms delay between each child
      delayChildren: 0.2, // Wait 200ms before animating children
    },
  },
};

/**
 * Stagger Item
 * Use for children within a staggerContainer
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/**
 * Pulse Animation
 * Subtle continuous scale animation for CTAs
 */
export const pulse: Variants = {
visible: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Bounce In Animation
 * Playful entrance with bounce effect
 */
export const bounceIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 10,
      duration: 0.8,
    },
  },
};

/**
 * Rotate In Animation
 * Combines rotation with fade
 */
export const rotateIn: Variants = {
  hidden: {
    opacity: 0,
    rotate: -10,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Hero Gradient Animation
 * Specific for hero section backgrounds
 */
export const heroGradient: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.1,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Card Hover Animation
 * Use with whileHover prop
 */
export const cardHover = {
  scale: 1.03,
  y: -8,
  transition: {
    duration: 0.3,
    ease: 'easeOut',
  },
};

/**
 * Button Hover Animation
 * Use with whileHover prop
 */
export const buttonHover = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
};

/**
 * Button Tap Animation
 * Use with whileTap prop
 */
export const buttonTap = {
  scale: 0.95,
  transition: {
    duration: 0.1,
  },
};

/**
 * Viewport Animation Config
 * Standard viewport detection for triggering animations
 */
export const viewportConfig = {
  once: true, // Animate only once when entering viewport
  amount: 0.3, // Trigger when 30% of element is visible
  margin: '-50px', // Trigger 50px before element enters viewport
};

/**
 * Reduced Motion Variants
 * Accessibility-friendly alternatives with minimal motion
 */
export const reducedMotionFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

/**
 * Utility function to detect reduced motion preference
 */
export const shouldReduceMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate variant based on motion preference
 */
export const getMotionVariant = (
  standard: Variants,
  reduced: Variants = reducedMotionFadeIn
): Variants => {
  return shouldReduceMotion() ? reduced : standard;
};
