'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function StudentMessagesPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<any[]>([])
  const [allMessages, setAllMessages] = useState<any[]>([])
  const [admins, setAdmins] = useState<Partial<Profile>[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState('')
  const [admin, setAdmin] = useState<Partial<Profile> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      const requestedAdminId = new URLSearchParams(window.location.search).get('admin')

      const [{ data: msgData }, { data: adminProfiles }] = await Promise.all([
        supabase.from('messages')
        .select('*')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .is('challenge_id', null)
        .order('created_at', { ascending: true }),
        supabase.from('profiles').select('id, full_name, role').eq('role', 'admin').order('full_name'),
      ])

      const msgs = msgData || []
      const adminById = new Map<string, Partial<Profile>>()
      ;(adminProfiles || []).forEach(a => adminById.set(a.id, a))
      msgs.forEach(m => {
        const otherId = m.from_id === user.id ? m.to_id : m.from_id
        if (otherId && !adminById.has(otherId)) {
          adminById.set(otherId, { id: otherId, full_name: 'Admin', role: 'admin' })
        }
      })
      if (requestedAdminId && !adminById.has(requestedAdminId)) {
        adminById.set(requestedAdminId, { id: requestedAdminId, full_name: 'Admin', role: 'admin' })
      }

      const adminList = Array.from(adminById.values())
      const lastMessage = msgs[msgs.length - 1]
      const lastMessageAdminId = lastMessage
        ? (lastMessage.from_id === user.id ? lastMessage.to_id : lastMessage.from_id)
        : null
      const selectedAdmin =
        (requestedAdminId && adminById.get(requestedAdminId)) ||
        (lastMessageAdminId && adminById.get(lastMessageAdminId)) ||
        adminList[0] ||
        null

      setAllMessages(msgs)
      setAdmins(adminList)
      setAdmin(selectedAdmin)
      setMessages(selectedAdmin?.id
        ? msgs.filter(m => m.from_id === selectedAdmin.id || m.to_id === selectedAdmin.id)
        : []
      )
      setLoading(false)
    }
    load()
  }, [])

  function selectAdmin(nextAdmin: Partial<Profile>) {
    setAdmin(nextAdmin)
    setMessages(allMessages.filter(m => m.from_id === nextAdmin.id || m.to_id === nextAdmin.id))
  }

  async function sendMessage() {
    if (!newMsg.trim() || !admin?.id) return
    setSending(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('messages').insert({
      from_id: userId, to_id: admin.id, content: newMsg,
    }).select().single()
    
    if (!error && data) {
      await supabase.from('notifications').insert({
        user_id: admin.id, type: 'message',
        title: 'New message from student 🪷',
        message: newMsg.slice(0, 80) + (newMsg.length > 80 ? '...' : ''),
        link: '/admin/messages',
      })
      setAllMessages(prev => [...prev, data])
      setMessages(prev => [...prev, data])
      setNewMsg('')
      toast({ title: 'Message sent! 🙏' })
    } else if (error) {
      toast({ title: 'Could not send message', description: error.message, variant: 'destructive' })
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="text-primary" size={22} />Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Chat with the Admin for guidance and support</p>
      </div>

      <Card className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] border-border/60 shadow-[0_10px_40px_hsl(35_22%_50%/0.08)]">
        {!admin ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare size={36} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No admin conversation is available yet.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-3 sm:p-4 border-b bg-primary/5 space-y-3">
              {admins.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {admins.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAdmin(a)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${admin.id === a.id ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-white text-muted-foreground'}`}
                    >
                      {a.full_name || 'Admin'}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full lotus-gradient flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {(admin.full_name || 'Admin').charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{admin.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Always here to help</p>
              </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center">
                  <MessageSquare size={32} className="text-muted-foreground/30 mb-3" />
                  No messages yet. Say Hare Krishna! 🙏
                </div>
              ) : messages.map(m => {
                const isMe = m.from_id === userId
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] break-words px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'lotus-gradient text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm border border-border/40'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white flex gap-2 items-end">
              <Textarea className="text-sm resize-none flex-1 min-h-[44px] max-h-32 rounded-xl focus-visible:ring-primary/30"
                placeholder="Type your message..." rows={1}
                value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
              <Button size="icon" className="lotus-gradient text-white border-0 shrink-0 h-11 w-11 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-px transition-all"
                onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
