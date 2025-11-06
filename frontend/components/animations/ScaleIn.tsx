'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface ScaleInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
}

export default function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  initialScale = 0.8,
  ...props
}: ScaleInProps) {
  return (
    <motion.div
      initial={{
        scale: initialScale,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
