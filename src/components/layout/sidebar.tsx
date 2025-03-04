"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { TranslatedText } from "@/components/language/translated-text"
import { useLanguage } from "@/components/language/language-provider"

interface RouteItem {
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
  subRoutes?: RouteItem[];
}
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Tags,
  UserCircle,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const routes: RouteItem[] = [
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
    label: "Clients",
    icon: UserCircle,
    href: "/clients",
    color: "text-blue-500"
  },
  {
    label: "Transactions",
    icon: ShoppingCart,
    href: "/transactions",
    color: "text-orange-500"
  },
  {
    label: "Finance",
    icon: DollarSign,
    href: "/finance",
    color: "text-emerald-500"
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
  const pathname = usePathname();
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const { isRTL } = useLanguage();

  const toggleExpand = (label: string) => {
    setExpandedRoutes((prev: string[]) => 
      prev.includes(label) 
        ? prev.filter((item: string) => item !== label) 
        : [...prev, label]
    );
  };

  const isRouteActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className="relative space-y-4 py-4 flex flex-col h-full bg-gray-100 dark:bg-[#111827] text-gray-800 dark:text-white"
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
                <TranslatedText namespace="app" id="title" />
              </h1>
            )}
            {!isMobile && (
              <Button 
                onClick={() => onCollapse(!isCollapsed)} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-white/10"
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
                <li key={route.href + route.label}>
                  {route.subRoutes ? (
                    <div className="space-y-1">
                      <TooltipRoot>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toggleExpand(route.label)}
                            className={cn(
                              "text-sm group flex p-3 w-full font-medium cursor-pointer hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all duration-200",
                              isRouteActive(route.href) ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10" : "text-gray-600 dark:text-zinc-400",
                              isCollapsed ? "justify-center px-2" : "justify-start px-3"
                            )}
                            aria-expanded={expandedRoutes.includes(route.label)}
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
                                <>
                                  <span className={`${isRTL ? 'mr-6' : 'ml-3'} flex-1 transition-all duration-300`}>
                                    <TranslatedText namespace="common" id={route.label.toLowerCase()} />
                                  </span>
                                  <ChevronDown 
                                    className={cn(
                                      "h-4 w-4 transition-transform duration-200",
                                      expandedRoutes.includes(route.label) ? "transform rotate-180" : ""
                                    )} 
                                  />
                                </>
                              )}
                            </div>
                          </button>
                        </TooltipTrigger>
                        {isCollapsed && !isMobile && (
                          <TooltipContent side={isRTL ? "left" : "right"}>
                            <TranslatedText namespace="common" id={route.label.toLowerCase()} />
                          </TooltipContent>
                        )}
                      </TooltipRoot>
                      
                      {(!isCollapsed || (isCollapsed && isMobile)) && expandedRoutes.includes(route.label) && (
                        <ul className={`mt-1 ${isRTL ? 'pr-4' : 'pl-4'} space-y-1`}>
                          {route.subRoutes.map((subRoute) => (
                            <li key={subRoute.href}>
                              <Link
                                href={subRoute.href}
                                className={cn(
                                  "text-sm group flex p-2 w-full font-medium cursor-pointer hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all duration-200",
                                  pathname === subRoute.href ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10" : "text-gray-600 dark:text-zinc-400",
                                )}
                                aria-current={pathname === subRoute.href ? "page" : undefined}
                              >
                                <div className="flex items-center">
                                  <subRoute.icon 
                                    className={cn("h-4 w-4", subRoute.color)} 
                                    aria-hidden="true"
                                  />
                                  <span className={`${isRTL ? 'mr-6' : 'ml-3'}`}>
                                    {subRoute.label}
                                  </span>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <Link
                          href={route.href}
                          className={cn(
                            "text-sm group flex p-3 w-full font-medium cursor-pointer hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all duration-200",
                            pathname === route.href ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10" : "text-gray-600 dark:text-zinc-400",
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
                              <span className={`${isRTL ? 'mr-6' : 'ml-3'} transition-all duration-300`}>
                                <TranslatedText namespace="common" id={route.label.toLowerCase()} />
                              </span>
                            )}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && !isMobile && (
                        <TooltipContent side={isRTL ? "left" : "right"}>
                          <TranslatedText namespace="common" id={route.label.toLowerCase()} />
                        </TooltipContent>
                      )}
                    </TooltipRoot>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </TooltipProvider>
  )
}
