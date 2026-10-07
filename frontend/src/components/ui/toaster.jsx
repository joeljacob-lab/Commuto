/* eslint-disable react-refresh/only-export-components */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-card border-border text-foreground',
  success: 'bg-card border-emerald-600/50 shadow-emerald-500/10',
  error: 'bg-card border-destructive/50 shadow-rose-500/10',
  warning: 'bg-card border-amber-600/50 shadow-amber-500/10',
};

const titleColor = {
  default: 'text-foreground',
  success: 'text-emerald-700 dark:text-emerald-400',
  error: 'text-destructive',
  warning: 'text-amber-700 dark:text-amber-400',
};

const iconColor = {
  default: 'text-muted-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
};

const variantIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const toastAnimation = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

/**
 * Render custom 21st.dev toast element
 */
export const renderCustomToast = ({
  id,
  title,
  message,
  variant = 'default',
  actions,
  onDismiss,
  highlightTitle,
}) => {
  const Icon = variantIcons[variant] || variantIcons.default;

  return (
    <motion.div
      variants={toastAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'flex items-center justify-between w-full max-w-sm sm:max-w-md p-3.5 rounded-xl border shadow-lg backdrop-blur-md font-sans text-left',
        variantStyles[variant] || variantStyles.default
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', iconColor[variant] || iconColor.default)} />
        <div className="space-y-0.5 pr-2">
          {title && (
            <h3
              className={cn(
                'text-xs font-semibold leading-none',
                titleColor[variant] || titleColor.default,
                highlightTitle && titleColor.success
              )}
            >
              {title}
            </h3>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions?.label && (
          <Button
            variant={actions.variant || 'outline'}
            size="sm"
            onClick={() => {
              actions.onClick();
              sonnerToast.dismiss(id);
            }}
            className={cn(
              'cursor-pointer text-xs h-7 px-2.5 rounded-lg',
              variant === 'success'
                ? 'text-emerald-700 border-emerald-600 hover:bg-emerald-600/10'
                : variant === 'error'
                ? 'text-destructive border-destructive hover:bg-destructive/10'
                : variant === 'warning'
                ? 'text-amber-700 border-amber-600 hover:bg-amber-600/10'
                : 'text-foreground border-border hover:bg-muted/10'
            )}
          >
            {actions.label}
          </Button>
        )}

        <button
          onClick={() => {
            sonnerToast.dismiss(id);
            onDismiss?.();
          }}
          className="rounded-full p-1 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Global helper to trigger 21st.dev top-center toast
 */
export const showToast = ({
  title,
  message,
  variant = 'default',
  duration = 4000,
  position = 'top-center',
  actions,
  onDismiss,
  highlightTitle,
}) => {
  return sonnerToast.custom(
    (toastId) =>
      renderCustomToast({
        id: toastId,
        title,
        message,
        variant,
        actions,
        onDismiss,
        highlightTitle,
      }),
    { duration, position }
  );
};

/**
 * Convenient toast dispatcher usable anywhere:
 * toast.success('Ride confirmed!')
 * toast.error('Payment failed')
 * toast.warning('Roster locks in 15m')
 * toast.info('New message')
 */
export const toast = Object.assign(
  (props) => {
    if (typeof props === 'string') {
      return showToast({ message: props, variant: 'default' });
    }
    return showToast(props);
  },
  {
    success: (message, options = {}) =>
      showToast({
        message,
        variant: 'success',
        title: options.title || 'Success',
        ...options,
      }),
    error: (message, options = {}) =>
      showToast({
        message,
        variant: 'error',
        title: options.title || 'Attention',
        ...options,
      }),
    warning: (message, options = {}) =>
      showToast({
        message,
        variant: 'warning',
        title: options.title || 'Notice',
        ...options,
      }),
    info: (message, options = {}) =>
      showToast({
        message,
        variant: 'default',
        title: options.title || 'Information',
        ...options,
      }),
    dismiss: sonnerToast.dismiss,
  }
);

/**
 * 21st.dev Toaster Component
 * Always centered at the top as requested.
 */
export const Toaster = forwardRef(
  ({ defaultPosition = 'top-center' }, ref) => {
    const toastReference = useRef(null);

    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = 'default',
        duration = 4000,
        position = defaultPosition,
        actions,
        onDismiss,
        highlightTitle,
      }) {
        toastReference.current = showToast({
          title,
          message,
          variant,
          duration,
          position,
          actions,
          onDismiss,
          highlightTitle,
        });
      },
    }));

    return (
      <SonnerToaster
        position={defaultPosition}
        toastOptions={{
          unstyled: true,
          className: 'flex justify-center w-full pointer-events-auto',
        }}
      />
    );
  }
);

Toaster.displayName = 'Toaster';

export default Toaster;
