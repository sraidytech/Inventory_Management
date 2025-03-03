"use client"

import { useLanguage } from "@/components/language/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FloatingLanguageToggle() {
  const { language, setLanguage } = useLanguage()
  
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en")
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={toggleLanguage}
        className={cn(
          "rounded-full w-12 h-12 shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "flex items-center justify-center text-lg font-bold"
        )}
        aria-label={`Switch to ${language === "en" ? "Arabic" : "English"}`}
      >
        {language === "en" ? "ع" : "En"}
      </Button>
    </div>
  )
}
