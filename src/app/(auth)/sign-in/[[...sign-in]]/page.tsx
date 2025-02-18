import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: "bg-slate-800 hover:bg-slate-900",
          card: "shadow-none",
        },
      }}
    />
  )
}
