"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme/theme-provider"
import { useTranslations } from "next-intl"

interface ThemeToggleProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ThemeToggle({ 
  variant = "ghost", 
  size = "icon", 
  className 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations("common")

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={`${t("theme")}: ${theme === 'light' ? t("dark") : t("light")}`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}
