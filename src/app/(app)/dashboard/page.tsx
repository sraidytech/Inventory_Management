import { Card } from "@/components/ui/card"
import { Package, ShoppingCart, Users, AlertTriangle } from "lucide-react"
import { auth } from "@clerk/nextjs/server"

const stats = [
  {
    title: "Total Products",
    value: "2,345",
    icon: Package,
    description: "Active products in inventory"
  },
  {
    title: "Total Suppliers",
    value: "45",
    icon: Users,
    description: "Active suppliers"
  },
  {
    title: "Recent Transactions",
    value: "128",
    icon: ShoppingCart,
    description: "Last 30 days"
  },
  {
    title: "Low Stock Alerts",
    value: "12",
    icon: AlertTriangle,
    description: "Items need attention"
  }
]

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory system</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h2 className="text-2xl font-bold">{stat.value}</h2>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div className="rounded-full bg-secondary p-2">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
