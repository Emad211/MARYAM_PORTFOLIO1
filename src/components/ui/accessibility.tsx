"use client";

import React from 'react';
import { useKeyboardNavigation, useReducedMotion, useHighContrast, SkipLinkProps } from '@/hooks/use-accessibility';

// Skip Link Component برای بهبود accessibility
export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-primary text-primary-foreground px-4 py-2 rounded-md
                 focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </a>
  );
};

// Loading Spinner با accessibility
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  label = 'Loading...' 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${prefersReducedMotion ? '' : 'animate-spin'}
        border-2 border-current border-t-transparent rounded-full
      `}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Focus Indicator برای بهبود keyboard navigation
export const FocusIndicator: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  const isKeyboardUser = useKeyboardNavigation();
  
  return (
    <div
      className={`
        ${className}
        ${isKeyboardUser ? 'ring-2 ring-ring ring-offset-2' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  );
};

// High Contrast Mode Support
export const ContrastModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersHighContrast = useHighContrast();
  
  return (
    <div className={prefersHighContrast ? 'contrast-more saturate-150' : ''}>
      {children}
    </div>
  );
};

// Error Boundary با accessibility
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AccessibleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by AccessibleErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent {...(this.state.error && { error: this.state.error })} />;
      }
      
      return (
        <div
          role="alert"
          className="p-4 border border-destructive bg-destructive/10 rounded-md"
          aria-live="assertive"
        >
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}