import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Phone } from "lucide-react"

const suppliers = [
  {
    id: "1",
    name: "Supplier Co Ltd",
    contact: "John Doe",
    email: "john@supplierco.com",
    phone: "+1 234 567 890",
    status: "Active",
    products: 15
  },
  {
    id: "2",
    name: "Tech Supplies Inc",
    contact: "Jane Smith",
    email: "jane@techsupplies.com",
    phone: "+1 234 567 891",
    status: "Active",
    products: 8
  },
  // Add more sample suppliers as needed
]

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your suppliers and vendor relationships</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{supplier.name}</h3>
                  <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {supplier.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{supplier.phone}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Products</span>
                  <span className="font-medium">{supplier.products}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="w-full">View Details</Button>
                <Button variant="outline" size="sm" className="w-full">Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
