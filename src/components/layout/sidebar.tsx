"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500"
  },
  {
    label: "Inventory",
    icon: Package,
    href: "/inventory",
    color: "text-violet-500"
  },
  {
    label: "Suppliers",
    icon: Users,
    href: "/suppliers",
    color: "text-pink-500"
  },
  {
    label: "Transactions",
    icon: ShoppingCart,
    href: "/transactions",
    color: "text-orange-500"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500"
  }
]

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
        <div className="px-3 py-2 flex-1">
          <div className="flex items-center justify-between mb-14 pl-3">
            <div className={cn(
              "flex items-center transition-all duration-300 ease-in-out",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            )}>
              <h1 className="font-bold text-2xl">
                Inventory Management
              </h1>
            </div>
            <Button 
              onClick={() => onCollapse(!isCollapsed)} 
              variant="ghost" 
              className="h-auto p-2 hover:bg-white/10"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <TooltipRoot key={route.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={route.href}
                    className={cn(
                      "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200",
                      pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <div className="flex items-center">
                      <route.icon className={cn("h-5 w-5 transition-all duration-300", route.color)} />
                      {!isCollapsed && (
                        <span className="ml-3 transition-all duration-300">
                          {route.label}
                        </span>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex items-center">
                    {route.label}
                  </TooltipContent>
                )}
              </TooltipRoot>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
