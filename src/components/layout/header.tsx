"use client"

import { UserButton } from "@clerk/nextjs"
import { Bell, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { useClickOutside } from "@/hooks/use-click-outside"
import { useSwipe } from "@/hooks/use-swipe"

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useClickOutside(sidebarRef, () => {
    if (showMobileMenu) {
      setShowMobileMenu(false)
    }
  })

  useSwipe({
    ref: sidebarRef,
    onSwipeLeft: () => {
      if (showMobileMenu) {
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
            className="md:hidden mr-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
            aria-expanded={showMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Sun className="h-5 w-5" />
            </Button>
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
          "fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 md:hidden",
          "transform transition-transform duration-300 ease-in-out",
          "touch-pan-y", // Enable vertical scrolling while preventing horizontal
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
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
          className="absolute right-2 top-2 text-white hover:bg-white/10"
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
