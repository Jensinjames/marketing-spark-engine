
import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableEscapeKey?: boolean;
  focusOnMount?: boolean;
  trapFocus?: boolean;
  onEscape?: () => void;
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    enableArrowKeys = true,
    enableTabNavigation = true,
    enableEscapeKey = true,
    focusOnMount = false,
    trapFocus = false,
    onEscape,
    onArrowKey,
  } = options;

  const containerRef = useRef<HTMLElement>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Escape':
        if (enableEscapeKey && onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      case 'Tab':
        if (enableTabNavigation && trapFocus && focusableElements.length > 0) {
          event.preventDefault();
          const nextIndex = event.shiftKey 
            ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
            : (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex]?.focus();
        }
        break;

      case 'ArrowUp':
        if (enableArrowKeys) {
          event.preventDefault();
          if (onArrowKey) {
            onArrowKey('up');
          } else if (currentIndex > 0) {
            focusableElements[currentIndex - 1]?.focus();
          }
        }
        break;

      case 'ArrowDown':
        if (enableArrowKeys) {
          event.preventDefault();
          if (onArrowKey) {
            onArrowKey('down');
          } else if (currentIndex < focusableElements.length - 1) {
            focusableElements[currentIndex + 1]?.focus();
          }
        }
        break;

      case 'ArrowLeft':
        if (enableArrowKeys && onArrowKey) {
          event.preventDefault();
          onArrowKey('left');
        }
        break;

      case 'ArrowRight':
        if (enableArrowKeys && onArrowKey) {
          event.preventDefault();
          onArrowKey('right');
        }
        break;
    }
  }, [enableArrowKeys, enableTabNavigation, enableEscapeKey, trapFocus, onEscape, onArrowKey, getFocusableElements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    
    if (focusOnMount) {
      const focusableElements = getFocusableElements();
      focusableElements[0]?.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, focusOnMount, getFocusableElements]);

  return {
    containerRef,
    getFocusableElements,
  };
};

// Skip link component for better accessibility
export const SkipLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium z-50 focus-visible"
    tabIndex={0}
  >
    {children}
  </a>
);
