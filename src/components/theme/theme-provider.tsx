"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on component mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as Theme | null
    
    // Check for system preference if no saved theme
    if (!savedTheme) {
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      setTheme(systemPreference)
      localStorage.setItem("theme", systemPreference)
      document.documentElement.classList.toggle("dark", systemPreference === "dark")
      
      // Set a cookie for server-side rendering
      document.cookie = `theme=${systemPreference}; path=/; max-age=31536000; SameSite=Strict`
      return
    }
    
    setTheme(savedTheme)
    document.documentElement.classList.toggle("dark", savedTheme === "dark")
    
    // Set a cookie for server-side rendering
    document.cookie = `theme=${savedTheme}; path=/; max-age=31536000; SameSite=Strict`
  }, [])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      localStorage.setItem("theme", newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
      
      // Set a cookie for server-side rendering
      document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Strict`
    },
  }

  // Avoid rendering children until after client-side hydration
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
