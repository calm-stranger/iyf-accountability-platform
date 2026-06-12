'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Users, Trophy, FileText,
  MessageSquare, Bell, Lock, Menu, X, Settings
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/challenges', label: 'Challenges', icon: Trophy },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminName, setAdminName] = useState('')
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data?.role !== 'admin') { router.push('/dashboard'); return }
        setAdminName(data.full_name?.split(' ')[0] || 'Admin')
      })
      supabase.from('notifications').select('id', { count: 'exact' })
        .eq('user_id', user.id).eq('is_read', false)
        .then(({ count }) => setUnread(count || 0))
    })
  }, [router])

  useEffect(() => {
    if (pathname === '/admin/notifications') {
      setUnread(0)
    }
  }, [pathname])

  function handleLock() {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🪷</span>
            <div className="hidden sm:block">
              <span className="font-bold text-primary text-sm">IYF Admin</span>
              <span className="text-xs text-muted-foreground ml-1">Guwahati</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant={pathname.startsWith(href) ? 'secondary' : 'ghost'}
                  size="sm" className="gap-1.5 text-sm h-8">
                  <Icon size={14} />{label}
                </Button>
              </Link>
            ))}
            <Link href="/admin/notifications">
              <Button variant={pathname === '/admin/notifications' ? 'secondary' : 'ghost'}
                size="sm" className="gap-1.5 relative h-8">
                <Bell size={14} />
                {unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center lotus-gradient text-white border-0">
                    {unread}
                  </Badge>
                )}
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden md:block text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{adminName}</span>
              <Badge className="ml-2 text-[10px] lotus-gradient text-white border-0">Admin</Badge>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLock} className="hidden md:flex gap-1.5 h-8">
              <Lock size={14} /> Lock App
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <Button variant={pathname.startsWith(href) ? 'secondary' : 'ghost'}
                  size="sm" className="w-full justify-start gap-2 h-9">
                  <Icon size={14} />{label}
                </Button>
              </Link>
            ))}
            <Link href="/admin/notifications" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-9">
                <Bell size={14} />Notifications
                {unread > 0 && <Badge className="ml-auto lotus-gradient text-white border-0 text-[10px]">{unread}</Badge>}
              </Button>
            </Link>
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-sm font-medium">{adminName} <Badge className="lotus-gradient text-white border-0 text-[10px]">Admin</Badge></span>
              <Button variant="ghost" size="sm" onClick={handleLock} className="gap-1.5">
                <Lock size={14} />Lock App
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}