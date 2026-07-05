'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Search, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminMessagesPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAdminId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
      setStudents(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(students.filter(s => s.full_name?.toLowerCase().includes(q)))
  }, [search, students])

  async function loadMessages(student: any) {
    setSelected(student)
    const supabase = createClient()
    const { data } = await supabase.from('messages')
      .select('*, from_profile:from_id(full_name), to_profile:to_id(full_name)')
      .or(`and(from_id.eq.${adminId},to_id.eq.${student.id}),and(from_id.eq.${student.id},to_id.eq.${adminId})`)
      .is('challenge_id', null)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected) return
    setSending(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('messages').insert({
      from_id: adminId, to_id: selected.id, content: newMsg,
    }).select().single()
    if (!error && data) {
      await supabase.from('notifications').insert({
        user_id: selected.id, type: 'feedback',
        title: 'New message from Admin 🪷',
        message: newMsg.slice(0, 80) + (newMsg.length > 80 ? '...' : ''),
        link: `/messages?admin=${adminId}`,
      })
      setMessages(prev => [...prev, data])
      setNewMsg('')
      toast({ title: 'Message sent! 🙏' })
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading...</p></div>
    </div>
  )

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="text-primary" size={22} />Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Send encouragement and feedback to students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)] md:h-[600px]">
        {/* Student list */}
        <div className="md:col-span-1 flex flex-col gap-2 overflow-hidden">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8 h-9 text-sm" placeholder="Search student..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filtered.map(s => (
              <button key={s.id} onClick={() => loadMessages(s)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === s.id ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20 bg-white'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full lotus-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.full_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{s.occupation || 'Student'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare size={36} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Select a student to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="h-9 w-9 rounded-full lotus-gradient flex items-center justify-center text-white font-bold">
                  {selected.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selected.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selected.phone || selected.address || 'Student'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No messages yet. Send the first message!
                  </div>
                ) : messages.map(m => {
                  const isAdmin = m.from_id === adminId
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isAdmin ? 'lotus-gradient text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                        <p className="leading-relaxed">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2">
                <Textarea className="text-sm resize-none flex-1 min-h-[38px] max-h-24"
                  placeholder={`Message ${selected.full_name}...`} rows={1}
                  value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
                <Button size="icon" className="lotus-gradient text-white border-0 shrink-0 h-10 w-10"
                  onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                  <Send size={15} />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
