"use client"

import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
import { Sun, Moon, Bell } from "lucide-react"
import { useUser } from "@clerk/nextjs"

export function Header() {
  const { user, isLoaded } = useUser()

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">
          {isLoaded ? `Welcome, ${user?.firstName || 'User'}` : 'Loading...'}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  )
}
