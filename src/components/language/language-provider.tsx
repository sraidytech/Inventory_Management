"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Language = "en" | "ar"

type LanguageProviderProps = {
  children: React.ReactNode
}

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Load language from localStorage on component mount
  useEffect(() => {
    setMounted(true)
    const savedLanguage = localStorage.getItem("language") as Language | null
    
    if (!savedLanguage) {
      // Check for browser language preference
      const browserLanguage = navigator.language.split('-')[0]
      const newLanguage = browserLanguage === 'ar' ? 'ar' : 'en'
      setLanguage(newLanguage)
      localStorage.setItem("language", newLanguage)
      
      // Set a cookie for server-side rendering
      document.cookie = `language=${newLanguage}; path=/; max-age=31536000; SameSite=Strict`
      return
    }
    
    setLanguage(savedLanguage)
    
    // Set a cookie for server-side rendering
    document.cookie = `language=${savedLanguage}; path=/; max-age=31536000; SameSite=Strict`
    
    // Set the dir attribute on the html element
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'
  }, [])

  // Update the dir attribute when language changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    }
  }, [language, mounted])

  const value = {
    language,
    isRTL: language === 'ar',
    setLanguage: (newLanguage: Language) => {
      setLanguage(newLanguage)
      localStorage.setItem("language", newLanguage)
      
      // Set a cookie for server-side rendering
      document.cookie = `language=${newLanguage}; path=/; max-age=31536000; SameSite=Strict`
      
      // Update the dir attribute on the html element
      document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = newLanguage
      
      // Refresh the page to apply the language change
      // This is a simple approach; in a more complex app, you might want to
      // use a more sophisticated approach to avoid a full page refresh
      router.refresh()
    },
  }

  // Avoid rendering children until after client-side hydration
  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
