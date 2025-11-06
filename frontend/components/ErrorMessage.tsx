'use client';

import { motion } from 'framer-motion';
import { MdError, MdRefresh, MdClose } from 'react-icons/md';
import { useState } from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  onDismiss,
  variant = 'error' 
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const variants = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-500',
      button: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-500',
      button: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-500',
      button: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
    }
  };

  const style = variants[variant];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`${style.bg} ${style.border} ${style.text} border rounded-xl px-4 py-3 shadow-md`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon with pulse animation */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <MdError className={`h-5 w-5 ${style.icon} flex-shrink-0`} />
          </motion.div>
          
          <p className="text-sm font-medium flex-1">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className={`${style.button} flex items-center gap-1 text-sm font-medium transition-colors px-3 py-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/20`}
            >
              <MdRefresh className="h-4 w-4" />
              Retry
            </motion.button>
          )}
          
          {onDismiss && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              className={`${style.icon} hover:opacity-70 transition-opacity`}
              aria-label="Dismiss"
            >
              <MdClose className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
