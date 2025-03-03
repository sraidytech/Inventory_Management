"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language/language-provider"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isRTL } = useLanguage()

  return (
    <div className="h-full relative">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80]",
        "transition-all duration-300 ease-in-out transform",
        isCollapsed ? "md:w-16" : "md:w-72",
        isRTL ? "md:right-0" : "md:left-0"
      )}>
        <Sidebar 
          isCollapsed={isCollapsed} 
          onCollapse={setIsCollapsed}
          isMobile={false}
        />
      </div>
      <main className={cn(
        "h-full transition-all duration-300 ease-in-out",
        isRTL 
          ? isCollapsed ? "md:pr-16" : "md:pr-72" 
          : isCollapsed ? "md:pl-16" : "md:pl-72"
      )}>
        <Header />
        <div className="p-8 h-[calc(100%-4rem)] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
