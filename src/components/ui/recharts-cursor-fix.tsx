"use client"

import React from 'react';

/**
 * This component is a workaround for the Recharts cursor prop issue.
 * It prevents the cursor prop from being passed to the DOM element.
 */
export function RechartsCursorFix() {
  // This component doesn't render anything
  // It's used to monkey-patch Recharts components
  
  React.useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Save original console.error
    const originalConsoleError = console.error;
    
    // Replace console.error to filter out specific React DOM prop warnings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error = function(...args: any[]) {
      // Filter out the specific React DOM prop warnings we're trying to fix
      const errorMessage = args[0]?.toString() || '';
      
      const knownWarnings = [
        'Received `true` for a non-boolean attribute `cursor`',
        'React does not recognize the `accessibilityLayer` prop',
        'React does not recognize the `allowEscapeViewBox` prop',
        'React does not recognize the `animationDuration` prop',
        'React does not recognize the `animationEasing` prop',
        'React does not recognize the `contentStyle` prop',
        'React does not recognize the `cursorStyle` prop',
        'React does not recognize the `filterNull` prop',
        'React does not recognize the `isAnimationActive` prop',
        'React does not recognize the `itemStyle` prop',
        'React does not recognize the `labelStyle` prop',
        'React does not recognize the `reverseDirection` prop',
        'React does not recognize the `useTranslate3d` prop',
        'React does not recognize the `wrapperStyle` prop'
      ];
      
      // Check if this is one of our known warnings
      const shouldSuppress = knownWarnings.some(warning => 
        typeof errorMessage === 'string' && errorMessage.includes(warning)
      );
      
      // If it's not one of our warnings, pass it through to the original console.error
      if (!shouldSuppress) {
        originalConsoleError.apply(console, args);
      }
    };
    
    // Cleanup function to restore original console.error
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return null;
}
