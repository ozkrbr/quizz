import type { Metadata } from 'next'
import Link from 'next/link'
import { Brand } from '@/components/Brand'

export const metadata: Metadata = {
  title: 'Quizz — Host',
  description: 'A fast, fun, real-time multiplayer quiz game.',
}

const menuItems: {
  label: string
  href: string
  icon: React.ReactNode
}[] = [
  {
    label: 'Home',
    href: '/host/dashboard',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    label: 'How to Play',
    href: '/host/dashboard/how-to',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    ),
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 px-5 backdrop-blur-md">
        <Brand />
        <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 sm:block">
          Painel do apresentador
        </span>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <nav className="hidden w-56 shrink-0 md:block">
          <ul className="glass sticky top-20 space-y-1 rounded-2xl p-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  href={item.href}
                >
                  <span className="text-brand-300">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-grow">{children}</main>
      </div>
    </div>
  )
}
