'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { FileText, Search, Eye, Calendar, Send } from 'lucide-react'

export default function AdminSubmissionsPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [challengeFilter, setChallengeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [adminId, setAdminId] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
      const [{ data: reps }, { data: ch }] = await Promise.all([
        supabase.from('daily_reports').select('*, profiles(full_name, phone), challenges(title, form_fields, created_by)')
          .order('submitted_at', { ascending: false }).limit(200),
        supabase.from('challenges').select('id, title').order('title'),
      ])
      setReports(reps || [])
      setFiltered(reps || [])
      setChallenges(ch || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let res = [...reports]
    if (search) {
      const q = search.toLowerCase()
      res = res.filter(r => r.profiles?.full_name?.toLowerCase().includes(q))
    }
    if (challengeFilter !== 'all') res = res.filter(r => r.challenge_id === challengeFilter)
    if (dateFilter) res = res.filter(r => r.report_date === dateFilter)
    setFiltered(res)
  }, [search, challengeFilter, dateFilter, reports])

  function openReport(report: any) {
    setSelected(report)
    setFeedback('')
  }

  async function sendFeedback() {
    if (!selected || !feedback.trim() || !adminId) return
    setSendingFeedback(true)
    const supabase = createClient()
    const content = `Feedback on "${selected.challenges?.title}" (${new Date(selected.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}):\n\n${feedback.trim()}`
    const { error } = await supabase.from('messages').insert({
      from_id: adminId,
      to_id: selected.user_id,
      challenge_id: selected.challenge_id,
      content,
    })

    if (error) {
      toast({ title: 'Could not send feedback', description: error.message, variant: 'destructive' })
    } else {
      await supabase.from('notifications').insert({
        user_id: selected.user_id,
        type: 'feedback',
        title: 'Admin replied to your submission',
        message: feedback.trim().slice(0, 90) + (feedback.trim().length > 90 ? '...' : ''),
        link: `/my-challenges/${selected.challenge_id}`,
      })
      toast({ title: 'Feedback sent' })
      setFeedback('')
    }
    setSendingFeedback(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading submissions...</p></div>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-primary" size={22} />Submissions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Search student..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={challengeFilter} onValueChange={setChallengeFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All challenges" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Challenges</SelectItem>
            {challenges.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-40 h-9 text-sm" value={dateFilter}
          onChange={e => setDateFilter(e.target.value)} />
        {(search || challengeFilter !== 'all' || dateFilter) && (
          <Button variant="ghost" size="sm" className="h-9 text-xs"
            onClick={() => { setSearch(''); setChallengeFilter('all'); setDateFilter('') }}>
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No submissions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-[0_10px_30px_hsl(35_22%_50%/0.12)] transition-all duration-300 border-border/60 hover:-translate-y-px">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-full lotus-gradient flex items-center justify-center text-white font-bold shrink-0 text-sm">
                      {r.profiles?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{r.profiles?.full_name}</p>
                        <Badge variant="outline" className="text-[10px]">{r.challenges?.title}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {new Date(r.report_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(r.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                    onClick={() => openReport(r)}>
                    <Eye size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Report Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <div className="h-10 w-10 rounded-full lotus-gradient flex items-center justify-center text-white font-bold">
                  {selected.profiles?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selected.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selected.challenges?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                    <span>Date: {new Date(selected.report_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>Submitted: {new Date(selected.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {(selected.challenges?.form_fields || []).map((field: any) => (
                  <div key={field.id} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</p>
                    <p className="text-sm font-medium text-foreground bg-muted/30 rounded-lg px-3 py-2">
                      {selected.answers?.[field.id] || <span className="text-muted-foreground italic">Not answered</span>}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-semibold text-foreground">Encourage this student</p>
                <Textarea
                  className="min-h-24 resize-none text-sm"
                  placeholder="Write a short reply, encouragement, or practical guidance..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
                <Button
                  className="w-full lotus-gradient text-white border-0 gap-2"
                  onClick={sendFeedback}
                  disabled={sendingFeedback || !feedback.trim()}
                >
                  <Send size={14} />{sendingFeedback ? 'Sending...' : 'Send Feedback'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
