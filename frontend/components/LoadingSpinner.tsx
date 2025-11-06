'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner({ 
  size = 'md',
  text
}: { 
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: 'linear' as const,
        repeat: Infinity,
      }
    }
  };

  const dotVariants = {
    animate: (i: number) => ({
      opacity: [0.4, 1, 0.4],
      scale: [0.8, 1, 0.8],
      transition: {
        duration: 1,
        ease: 'easeInOut' as const,
        repeat: Infinity,
        delay: i * 0.15,
      }
    })
  };

  return (
    <motion.div 
      className="flex flex-col justify-center items-center gap-4"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Circular Spinner */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 dark:border-gray-700`}
        style={{
          borderTopColor: 'var(--color-primary-500)',
          borderRightColor: 'var(--color-primary-300)',
        }}
        variants={spinnerVariants}
        animate="animate"
      />

      {/* Optional Loading Text */}
      {text && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {text}
          </span>
          {/* Animated Dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                custom={i}
                variants={dotVariants}
                animate="animate"
                className="w-1 h-1 rounded-full bg-gray-600 dark:bg-gray-400"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
