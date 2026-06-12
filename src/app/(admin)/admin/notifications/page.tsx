'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, FileText, Trophy, MessageSquare } from 'lucide-react'
import Link from 'next/link'

function NotifIcon({ type }: { type: string }) {
  if (type === 'report_submitted') return <FileText size={15} className="text-green-500" />
  if (type === 'join_request') return <Trophy size={15} className="text-primary" />
  return <MessageSquare size={15} className="text-blue-500" />
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('notifications').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
      setNotifications(data || [])
      await supabase.from('notifications').update({ is_read: true })
        .eq('user_id', user.id).eq('is_read', false)
      setLoading(false)
    }
    load()
  }, [])

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifications.filter(n => !n.is_read).length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading...</p></div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="text-primary" size={22} />Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
            <CheckCheck size={13} />Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Bell size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={`transition-all hover:shadow-[0_10px_30px_hsl(35_22%_50%/0.12)] hover:-translate-y-px ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex gap-3 items-start">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.is_read && <Badge className="lotus-gradient text-white border-0 text-[9px] h-4 px-1.5">New</Badge>}
                    </div>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {n.link && (
                      <Link href={n.link}>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-0 mt-1">View →</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}