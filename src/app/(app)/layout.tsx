import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <MainLayout>{children}</MainLayout>
}
