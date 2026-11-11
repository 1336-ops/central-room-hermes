import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Shell } from "@/components/layout/shell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hermes Dashboard",
  description: "Hermes AI Agent Command Center",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}

