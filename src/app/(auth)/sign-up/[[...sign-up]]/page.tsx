import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          formButtonPrimary: "bg-slate-800 hover:bg-slate-900",
          card: "shadow-none",
        },
      }}
    />
  )
}
