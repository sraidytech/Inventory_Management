import Link from "next/link"
import { LucideIcon, LayoutDashboard, Package, Users, ShoppingCart, Settings } from "lucide-react"

interface SidebarLink {
  title: string
  href: string
  icon: LucideIcon
}

const links: SidebarLink[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Users
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: ShoppingCart
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings
  }
]

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-lg font-semibold">Inventory Management</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
