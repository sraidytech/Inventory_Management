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
  ChevronRight,
  Tags
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
    label: "Categories",
    icon: Tags,
    href: "/categories",
    color: "text-green-500"
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
  isMobile?: boolean;
}

export function Sidebar({ isCollapsed, onCollapse, isMobile = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className="relative space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white"
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="px-3 py-2 flex-1">
          <div className={cn(
            "flex items-center mb-14",
            isCollapsed ? "justify-center px-2" : "justify-between px-3"
          )}>
            {!isCollapsed && (
              <h1 className="font-bold text-2xl">
                Inventory Management
              </h1>
            )}
            {!isMobile && (
              <Button 
                onClick={() => onCollapse(!isCollapsed)} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 p-0 hover:bg-white/10"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <nav>
            <ul className="space-y-1" role="list">
              {routes.map((route) => (
                <li key={route.href}>
                  <TooltipRoot>
                    <TooltipTrigger asChild>
                      <Link
                        href={route.href}
                        className={cn(
                          "text-sm group flex p-3 w-full font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200",
                          pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                          isCollapsed ? "justify-center px-2" : "justify-start px-3"
                        )}
                        aria-current={pathname === route.href ? "page" : undefined}
                      >
                        <div className={cn(
                          "flex items-center",
                          isCollapsed ? "justify-center" : "justify-start w-full"
                        )}>
                          <route.icon 
                            className={cn("h-5 w-5 transition-all duration-300", route.color)} 
                            aria-hidden="true"
                          />
                          {!isCollapsed && (
                            <span className="ml-3 transition-all duration-300">
                              {route.label}
                            </span>
                          )}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && !isMobile && (
                      <TooltipContent side="right">
                        {route.label}
                      </TooltipContent>
                    )}
                  </TooltipRoot>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </TooltipProvider>
  )
}
