"use client"

import { useEffect } from "react"

// This component is used to prevent the flash of unstyled content (FOUC)
// when the page loads. It runs a script that checks the theme in localStorage
// and applies the dark class to the HTML element before the page renders.
export function ThemeScript() {
  useEffect(() => {
    // This script runs on the client side only
    const script = `
      (function() {
        try {
          const theme = localStorage.getItem('theme');
          const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          
          const resolvedTheme = theme || systemPreference;
          
          if (resolvedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          // Set a cookie for server-side rendering
          document.cookie = "theme=" + resolvedTheme + "; path=/; max-age=31536000; SameSite=Strict";
        } catch (e) {
          console.error('Error applying theme:', e);
        }
      })();
    `;

    // Create a script element and append it to the head
    const scriptElement = document.createElement("script");
    scriptElement.innerHTML = script;
    document.head.appendChild(scriptElement);

    // Clean up
    return () => {
      document.head.removeChild(scriptElement);
    };
  }, []);

  // Return an empty fragment as a valid JSX element
  return <></>;
}
