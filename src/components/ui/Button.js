import { cn } from '@/lib/utils';

export default function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200';
  
  const variants = {
    primary: 'bg-primary text-white hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(43,62,155,0.3)]',
    secondary: 'bg-secondary text-foreground hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(233,196,64,0.3)]',
    ghost: 'hover:text-primary transition-colors bg-transparent',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    gradient: 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 hover:shadow-lg',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 h-12 text-base',
    lg: 'px-10 h-14 text-lg',
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
