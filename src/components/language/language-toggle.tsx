"use client"

import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language/language-provider"
import { TranslatedText } from "@/components/language/translated-text"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LanguageToggleProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function LanguageToggle({ 
  variant = "ghost", 
  size = "icon", 
  className 
}: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label="Select language"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLanguage("en")}
          className={language === "en" ? "bg-accent" : ""}
        >
          <TranslatedText namespace="common" id="english" />
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage("ar")}
          className={language === "ar" ? "bg-accent" : ""}
        >
          <TranslatedText namespace="common" id="arabic" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
