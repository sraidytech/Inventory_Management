// This component is used to add a script to the head of the document
// that will check for the theme cookie and apply the dark class to the HTML element
// before the page renders. This prevents the flash of unstyled content (FOUC).

export function ThemeScriptServer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Check for theme cookie
              const cookies = document.cookie.split(';');
              let theme = null;
              for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('theme=')) {
                  theme = cookie.substring('theme='.length);
                  break;
                }
              }
              
              // If no cookie, check system preference
              if (!theme) {
                const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
                  ? 'dark'
                  : 'light';
                theme = systemPreference;
              }
              
              // Apply theme
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {
              console.error('Error applying theme:', e);
            }
          })();
        `,
      }}
    />
  );
}
