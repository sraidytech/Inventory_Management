"use client"

import { UserButton } from "@clerk/nextjs"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { NotificationDropdown } from "./notification-dropdown"
import { useClickOutside } from "@/hooks/use-click-outside"
import { useSwipe } from "@/hooks/use-swipe"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageToggle } from "@/components/language/language-toggle"
import { useLanguage } from "@/components/language/language-provider"

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { isRTL } = useLanguage()

  useClickOutside(sidebarRef, () => {
    if (showMobileMenu) {
      setShowMobileMenu(false)
    }
  })

  useSwipe({
    ref: sidebarRef,
    onSwipeLeft: () => {
      if (showMobileMenu && !isRTL) {
        setShowMobileMenu(false)
      }
    },
    onSwipeRight: () => {
      if (showMobileMenu && isRTL) {
        setShowMobileMenu(false)
      }
    }
  })

  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`md:hidden ${isRTL ? 'ml-2' : 'mr-2'}`}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
            aria-expanded={showMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
            <NotificationDropdown />
            <LanguageToggle />
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-200",
          showMobileMenu ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
        onClick={() => setShowMobileMenu(false)}
      />
      
      {/* Mobile Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 z-50 w-72 md:hidden",
          "transform transition-transform duration-300 ease-in-out",
          "touch-pan-y", // Enable vertical scrolling while preventing horizontal
          showMobileMenu ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full",
          isRTL ? "right-0" : "left-0"
        )}
      >
        <Sidebar 
          isCollapsed={false} 
          onCollapse={() => {}} 
          isMobile={true}
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10",
            isRTL ? "left-2" : "right-2"
          )}
          onClick={() => setShowMobileMenu(false)}
        >
          <span className="sr-only">Close menu</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      </div>
    </>
  )
}
