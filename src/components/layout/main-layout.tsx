"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="h-full relative">
      <div className={cn(
        "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-72"
      )}>
        <Sidebar isCollapsed={isCollapsed} onCollapse={setIsCollapsed} />
      </div>
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "md:pl-16" : "md:pl-72"
      )}>
        <Header />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
