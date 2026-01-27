import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Book, Layers, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Domains', href: '/domains', icon: Book },
  { name: 'Skills', href: '/skills', icon: Layers },
  { name: 'Questions', href: '/questions', icon: FileText },
  { name: 'Publish', href: '/publish', icon: Upload },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex w-64 flex-col border-r bg-muted/10 h-screen">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Math7 Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
