
import { useRef, useEffect, RefObject } from 'react';

interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableEscapeKey?: boolean;
  onEscape?: () => void;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    enableArrowKeys = false,
    enableTabNavigation = false,
    enableEscapeKey = false,
    onEscape
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);

      if (enableEscapeKey && event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (enableArrowKeys) {
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % focusableArray.length;
            focusableArray[nextIndex]?.focus();
            break;
          case 'ArrowUp':
          case 'ArrowLeft':
            event.preventDefault();
            const prevIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
            focusableArray[prevIndex]?.focus();
            break;
        }
      }

      if (enableTabNavigation) {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (currentIndex === 0) {
              event.preventDefault();
              focusableArray[focusableArray.length - 1]?.focus();
            }
          } else {
            if (currentIndex === focusableArray.length - 1) {
              event.preventDefault();
              focusableArray[0]?.focus();
            }
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [enableArrowKeys, enableTabNavigation, enableEscapeKey, onEscape]);

  return { containerRef };
};

// Skip Link component for accessibility
export const SkipLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
  >
    {children}
  </a>
);
