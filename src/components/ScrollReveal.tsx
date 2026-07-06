import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  duration = 0.6,
  className = ""
}) => {
  const getInitialDirection = () => {
    switch (direction) {
      case 'up': return { y: 35, opacity: 0 };
      case 'down': return { y: -35, opacity: 0 };
      case 'left': return { x: 35, opacity: 0 };
      case 'right': return { x: -35, opacity: 0 };
      default: return { scale: 0.96, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialDirection()}
      whileInView={{ y: 0, x: 0, scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ 
        duration: duration, 
        delay: delay, 
        ease: [0.16, 1, 0.3, 1] // smooth ease-out curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
