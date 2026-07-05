'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Trophy, BookOpen, User, Bell, Lock, Menu, X, MessageSquare
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/challenges', label: 'Challenges', icon: Trophy },
  { href: '/my-challenges', label: 'My Sadhana', icon: BookOpen },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.role === 'admin') { router.push('/admin/dashboard'); return }
          setProfile(data)
        })
      supabase.from('notifications').select('id', { count: 'exact' })
        .eq('user_id', user.id).eq('is_read', false)
        .then(({ count }) => setUnread(count || 0))
    })
  }, [router])

  useEffect(() => {
    if (pathname === '/notifications') {
      setUnread(0)
    }
  }, [pathname])

  function handleLock() {
    router.push('/login')
  }

  return (
    <div className="min-h-screen calm-gradient">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 glass-navbar border-b border-border/40 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🪷</span>
            <span className="font-bold text-primary text-sm leading-tight hidden sm:block">
              IYF Sadhana<br />
              <span className="text-xs font-normal text-muted-foreground">Guwahati</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant="ghost"
                  size="sm" className={`gap-1.5 text-sm rounded-full transition-all duration-200 ${pathname === href ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}`}>
                  <Icon size={15} className={pathname === href ? 'text-primary' : ''} />
                  {label}
                </Button>
              </Link>
            ))}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className={`gap-1.5 relative rounded-full transition-all duration-200 ${pathname === '/notifications' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}`}>
                <Bell size={15} className={pathname === '/notifications' ? 'text-primary' : ''} />
                Notifications
                {unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center lotus-gradient text-white border-0">
                    {unread}
                  </Badge>
                )}
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* <span className="hidden md:block text-sm text-muted-foreground">
              Hare Krishna, <span className="text-foreground font-medium">{profile?.full_name?.split(' ')[0]}</span>
            </span> */}
            <Button variant="ghost" size="sm" onClick={handleLock} className="hidden md:flex gap-1.5">
              <Lock size={15} /> Lock App
            </Button>
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/50 bg-white/95 px-4 py-3 flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                <Button variant="ghost"
                  size="sm" className={`w-full justify-start gap-2 rounded-xl ${pathname === href ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground'}`}>
                  <Icon size={15} />{label}
                </Button>
              </Link>
            ))}
            <Link href="/notifications" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost"
                size="sm" className={`w-full justify-start gap-2 rounded-xl ${pathname === '/notifications' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground'}`}>
                <Bell size={15} />Notifications
                {unread > 0 && <Badge className="ml-auto lotus-gradient text-white border-0 text-[10px]">{unread}</Badge>}
              </Button>
            </Link>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Hare Krishna, <span className="font-medium text-foreground">{profile?.full_name?.split(' ')[0]}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleLock} className="gap-1.5">
                <Lock size={14} />Lock App
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}