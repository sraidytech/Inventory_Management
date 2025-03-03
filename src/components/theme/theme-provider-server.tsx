// This component is used to add the theme class to the HTML element on the server side
// It's a workaround for the fact that Next.js renders the page on the server first,
// and we need to ensure that the correct theme is applied from the start.

import { cookies, headers } from "next/headers"

export async function ThemeProviderServer() {
  // Check for a theme cookie
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get("theme")
  
  // Check for the Sec-CH-Prefers-Color-Scheme header
  const headersList = await headers()
  const prefersDark = headersList.get("Sec-CH-Prefers-Color-Scheme") === "dark"
  
  // Determine the theme
  const theme = themeCookie?.value || (prefersDark ? "dark" : "light")
  
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          document.documentElement.classList.toggle('dark', ${theme === "dark"});
        `,
      }}
    />
  )
}
