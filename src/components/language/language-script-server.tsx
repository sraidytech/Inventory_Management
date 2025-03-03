// This component is used to add a script to the head of the document
// that will check for the language cookie and apply the RTL direction to the HTML element
// before the page renders. This prevents the flash of unstyled content (FOUC).

export function LanguageScriptServer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Check for language cookie
              const cookies = document.cookie.split(';');
              let language = null;
              for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('language=')) {
                  language = cookie.substring('language='.length);
                  break;
                }
              }
              
              // If no cookie, check browser language
              if (!language) {
                const browserLanguage = navigator.language.split('-')[0];
                language = browserLanguage === 'ar' ? 'ar' : 'en';
              }
              
              // Apply language and direction
              document.documentElement.lang = language;
              if (language === 'ar') {
                document.documentElement.dir = 'rtl';
              } else {
                document.documentElement.dir = 'ltr';
              }
            } catch (e) {
              console.error('Error applying language:', e);
            }
          })();
        `,
      }}
    />
  );
}
