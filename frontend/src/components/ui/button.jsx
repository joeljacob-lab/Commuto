import React from 'react';

export const Button = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  children,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none rounded-[var(--radius)]';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-[#832323] active:bg-[#6e1e1e] shadow-xs',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-[#f8e7bf] border border-[#ecdab4]',
    outline: 'border border-border bg-card text-foreground hover:bg-muted hover:border-[#ebd8be]',
    ghost: 'text-foreground hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-[#851515]',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
    accent: 'bg-accent text-accent-foreground hover:bg-[#fae6a6] border border-[#f5db88]'
  };

  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-6 text-base',
    icon: 'h-9 w-9 p-0'
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.default;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
