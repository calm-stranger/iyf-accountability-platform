'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Challenge, DailyReport, FormField } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Flame, CheckCircle2, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ChallengeReportPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [todayReport, setTodayReport] = useState<DailyReport | null>(null)
  const [recentReports, setRecentReports] = useState<DailyReport[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [streak, setStreak] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const today = new Date().toISOString().split('T')[0]

      const [{ data: ch }, { data: reports }] = await Promise.all([
        supabase.from('challenges').select('*').eq('id', id).single(),
        supabase.from('daily_reports').select('*').eq('challenge_id', id)
          .eq('user_id', user.id).order('report_date', { ascending: false }).limit(14),
      ])

      setChallenge(ch)
      setRecentReports(reports || [])
      const todayRep = (reports || []).find((r: DailyReport) => r.report_date === today)
      setTodayReport(todayRep || null)
      if (todayRep) setAnswers(todayRep.answers as Record<string, string>)

      // Calculate streak
      let s = 0
      let check = new Date()
      for (const r of (reports || [])) {
        const d = new Date(check)
        d.setDate(d.getDate() - (s === 0 ? 0 : 1))
        if (r.report_date === d.toISOString().split('T')[0]) { s++; check = d } else break
      }
      setStreak(s)
      setLoading(false)
    }
    load()
  }, [id])

  function setAnswer(fieldId: string, value: string) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  async function handleSubmit() {
    if (!challenge) return
    const required = challenge.form_fields.filter(f => f.required)
    for (const f of required) {
      if (!answers[f.id]) {
        toast({ title: 'Please fill required fields', description: `"${f.label}" is required.`, variant: 'destructive' })
        return
      }
    }
    setSubmitting(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('daily_reports').upsert({
      challenge_id: challenge.id, user_id: userId,
      answers, report_date: today,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'challenge_id,user_id,report_date' })

    if (error) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' })
    } else {
      // Notify admin
      const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
      if (admins) {
        await supabase.from('notifications').insert(
          admins.map((a: any) => ({
            user_id: a.id, type: 'report_submitted',
            title: 'New Report Submitted',
            message: `A student submitted their report for "${challenge.title}"`,
            link: '/admin/submissions',
          }))
        )
      }
      toast({ title: 'Submitted! 🙏', description: 'Your report has been recorded.' })
      setTodayReport({ id: '', challenge_id: challenge.id, user_id: userId, answers, submitted_at: new Date().toISOString(), report_date: today })
    }
    setSubmitting(false)
  }

  function renderField(field: FormField) {
    const value = answers[field.id] || ''
    const base = "text-sm"

    if (field.type === 'yesno') return (
      <div className="grid grid-cols-2 gap-2">
        {['Yes', 'No'].map(opt => (
          <button key={opt} type="button"
            onClick={() => setAnswer(field.id, opt)}
            disabled={!!todayReport}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${value === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {opt === 'Yes' ? '✅ Yes' : '❌ No'}
          </button>
        ))}
      </div>
    )

    if (field.type === 'mcq' && field.options) return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {field.options.map(opt => (
          <button key={opt} type="button"
            onClick={() => setAnswer(field.id, opt)}
            disabled={!!todayReport}
            className={`break-words py-2 px-3 rounded-lg border text-sm text-left transition-all ${value === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {value === opt ? '◉' : '○'} {opt}
          </button>
        ))}
      </div>
    )

    if (field.type === 'select' && field.options) return (
      <Select value={value} onValueChange={v => setAnswer(field.id, v)} disabled={!!todayReport}>
        <SelectTrigger className={base}><SelectValue placeholder="Select an option" /></SelectTrigger>
        <SelectContent>{field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    )

    if (field.type === 'textarea') return (
      <Textarea className={base} placeholder={field.placeholder || 'Your answer...'}
        value={value} onChange={e => setAnswer(field.id, e.target.value)}
        disabled={!!todayReport} rows={2} />
    )

    if (field.type === 'number') return (
      <Input className={base} type="number" placeholder={field.placeholder || '0'}
        value={value} onChange={e => setAnswer(field.id, e.target.value)} disabled={!!todayReport} />
    )

    return (
      <Input className={base} type="text" placeholder={field.placeholder || 'Your answer...'}
        value={value} onChange={e => setAnswer(field.id, e.target.value)} disabled={!!todayReport} />
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div><p className="text-sm text-muted-foreground">Loading...</p></div>
    </div>
  )
  if (!challenge) return <div className="text-center py-16 text-muted-foreground">Challenge not found.</div>

  const today = new Date().toISOString().split('T')[0]
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  return (
    <div className="space-y-5 max-w-lg mx-auto animate-fade-in-up">
      <div className="flex items-start gap-2 sm:gap-3">
        <Link href="/my-challenges">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft size={16} /></Button>
        </Link>
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold text-foreground">{challenge.title}</h1>
          <p className="text-xs text-muted-foreground">{challenge.description}</p>
        </div>
      </div>

      {/* Streak + calendar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Last 7 Days</span>
            <span className="text-accent font-bold flex items-center gap-1 text-sm">
              <Flame size={14} /> {streak} day streak
            </span>
          </div>
          <div className="flex gap-1.5">
            {last7.map(date => {
              const done = recentReports.some(r => r.report_date === date)
              const isToday = date === today
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${done ? 'bg-primary text-white' : isToday ? 'border-2 border-primary/40 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {done ? '✓' : new Date(date).getDate()}
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report form */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            Today&lsquo;s Report
            {todayReport && (
              <Badge className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px]">
                <CheckCircle2 size={10} /> Submitted {new Date(todayReport.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          {today < challenge.start_date ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground text-sm font-medium">This challenge starts on {new Date(challenge.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
              <p className="text-xs text-muted-foreground">You can start submitting your reports from that day. 🙏</p>
            </div>
          ) : (
            <>
              {challenge.form_fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No fields configured for this challenge.</p>
              ) : (
                challenge.form_fields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))
              )}
              {!todayReport && challenge.form_fields.length > 0 && (
                <Button className="w-full lotus-gradient text-white border-0 mt-2"
                  onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Today\'s Report 🙏'}
                </Button>
              )}
              {todayReport && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  ✨ Today&lsquo;s report submitted. Come back tomorrow!
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
