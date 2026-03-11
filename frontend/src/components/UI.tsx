import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-background-dark hover:brightness-95 shadow-sm',
    secondary: 'bg-primary-dark text-white hover:bg-primary-dark/90 shadow-lg shadow-primary-dark/20',
    outline: 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50',
    ghost: 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
    dark: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-2xl',
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[1.2em]">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const hasCustomBackground = /(^|\s)(dark:)?bg-/.test(className);
  const backgroundClasses = hasCustomBackground ? '' : 'bg-white dark:bg-slate-900';

  return (
    <div className={`rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:border-slate-800 ${backgroundClasses} ${className}`}>
      {children}
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'info' }> = ({ children, variant = 'info' }) => {
  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${styles[variant]}`}>
      {children}
    </span>
  );
};
