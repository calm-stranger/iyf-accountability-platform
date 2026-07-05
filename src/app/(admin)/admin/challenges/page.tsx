'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Challenge, FormField, ChallengeParticipant, ChallengeStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Trophy, Plus, Pencil, Trash2, GripVertical, X,
  CheckCircle2, Clock, XCircle, Eye, Users, Calendar, Archive, RotateCcw
} from 'lucide-react'

const FIELD_TYPES = [
  { value: 'yesno', label: '✅ Yes / No' },
  { value: 'mcq', label: '◉ Multiple Choice' },
  { value: 'select', label: '▾ Dropdown' },
  { value: 'number', label: '# Number' },
  { value: 'text', label: 'Aa Short Text' },
  { value: 'textarea', label: '📝 Long Text' },
]

const emptyField = (): FormField => ({
  id: Math.random().toString(36).slice(2, 8),
  label: '', type: 'yesno', required: true, options: [], placeholder: '',
})

const emptyChallenge: {
  title: string; description: string; details: string; criteria: string;
  audience: string; start_date: string; end_date: string; status: ChallengeStatus;
} = {
  title: '', description: '', details: '', criteria: '',
  audience: 'all', start_date: '', end_date: '', status: 'active',
}


export default function AdminChallengesPage() {
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Challenge | null>(null)
  const [form, setForm] = useState(emptyChallenge)
  const [fields, setFields] = useState<FormField[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminId, setAdminId] = useState('')
  // Requests modal
  const [requestsChallenge, setRequestsChallenge] = useState<Challenge | null>(null)
  const [requests, setRequests] = useState<ChallengeParticipant[]>([])
  const [adminMsgs, setAdminMsgs] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
      const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false })
      setChallenges(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyChallenge)
    setFields([])
    setShowForm(true)
  }

  function openEdit(c: Challenge) {
    setEditing(c)
    setForm({
      title: c.title, description: c.description || '',
      details: c.details || '', criteria: c.criteria || '',
      audience: c.audience, start_date: c.start_date,
      end_date: c.end_date, status: c.status,
    })
    setFields(c.form_fields || [])
    setShowForm(true)
  }

  async function openRequests(c: Challenge) {
    setRequestsChallenge(c)
    const supabase = createClient()
    const { data } = await supabase.from('challenge_participants')
      .select('*, profiles(*)').eq('challenge_id', c.id)
      .order('joined_at', { ascending: false })
    setRequests(data || [])
  }

  async function handleSave() {
    if (!form.title || !form.start_date || !form.end_date) {
      toast({ title: 'Please fill required fields', variant: 'destructive' }); return
    }
    setSaving(true)
    const supabase = createClient()
    const payload = { ...form, form_fields: fields, created_by: adminId }

    if (editing) {
      const { error } = await supabase.from('challenges').update(payload).eq('id', editing.id)
      if (!error) {
        setChallenges(prev => prev.map(c => c.id === editing.id ? { ...c, ...payload } : c))
        toast({ title: 'Challenge updated! 🙏' })
        // Notify students if newly active
        if (payload.status === 'active' && editing.status !== 'active') {
          const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student')
          if (students) {
            await supabase.from('notifications').insert(students.map((s: any) => ({
              user_id: s.id, type: 'new_challenge',
              title: 'New Challenge Available! 🏆',
              message: `"${form.title}" is now active. Check it out!`,
              link: '/challenges',
            })))
          }
        }
      }
    } else {
      const { data, error } = await supabase.from('challenges').insert(payload).select().single()
      if (!error && data) {
        setChallenges(prev => [data, ...prev])
        toast({ title: 'Challenge created! 🙏' })
        // Notify all students
        if (payload.status === 'active') {
          const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student')
          if (students) {
            await supabase.from('notifications').insert(students.map((s: any) => ({
              user_id: s.id, type: 'new_challenge',
              title: 'New Challenge Available! 🏆',
              message: `"${form.title}" is now active. Join now!`,
              link: '/challenges',
            })))
          }
        }
      }
    }
    setSaving(false)
    setShowForm(false)
  }

  async function deleteChallenge(id: string) {
    if (!confirm('Delete this challenge? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('challenges').delete().eq('id', id)
    setChallenges(prev => prev.filter(c => c.id !== id))
    toast({ title: 'Challenge deleted.' })
  }

  async function updateChallengeStatus(challenge: Challenge, status: ChallengeStatus) {
    const supabase = createClient()
    const { error } = await supabase.from('challenges').update({ status }).eq('id', challenge.id)
    if (error) {
      toast({ title: 'Could not update challenge', description: error.message, variant: 'destructive' })
      return
    }
    setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, status } : c))
    toast({ title: status === 'active' ? 'Challenge activated' : 'Challenge archived' })
  }

  async function handleRequest(participantId: string, userId: string, status: 'approved' | 'rejected') {
    const supabase = createClient()
    const msg = adminMsgs[participantId] || ''
    await supabase.from('challenge_participants').update({ status, admin_message: msg }).eq('id', participantId)
    await supabase.from('notifications').insert({
      user_id: userId,
      type: status === 'approved' ? 'challenge_approved' : 'challenge_rejected',
      title: status === 'approved' ? '🎉 Challenge Request Approved!' : 'Challenge Request Update',
      message: status === 'approved'
        ? `You have been approved to join "${requestsChallenge?.title}"!${msg ? ` Admin says: ${msg}` : ''}`
        : `Your request for "${requestsChallenge?.title}" was not approved.${msg ? ` Reason: ${msg}` : ''}`,
      link: status === 'approved' ? '/my-challenges' : '/challenges',
    })
    setRequests(prev => prev.map(r => r.id === participantId ? { ...r, status, admin_message: msg } : r))
    toast({ title: status === 'approved' ? 'Approved! 🙏' : 'Request updated.' })
  }

  // Form field helpers
  function addField() { setFields(prev => [...prev, emptyField()]) }
  function removeField(id: string) { setFields(prev => prev.filter(f => f.id !== id)) }
  function updateField(id: string, key: keyof FormField, value: any) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f))
  }
  function updateOptions(id: string, raw: string) {
    updateField(id, 'options', raw.split('\n').map(s => s.trim()).filter(Boolean))
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-green-50 text-green-700 border-green-200'
    if (s === 'draft') return 'bg-secondary text-secondary-foreground border-border'
    if (s === 'completed') return 'bg-accent/10 text-accent border-accent/20'
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading challenges...</p></div>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-primary" size={22} />Challenges
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{challenges.length} total challenges</p>
        </div>
        <Button className="lotus-gradient text-white border-0 gap-2" onClick={openNew}>
          <Plus size={15} />New Challenge
        </Button>
      </div>

      {challenges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Trophy size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No challenges yet.</p>
            <Button size="sm" className="mt-3 lotus-gradient text-white border-0" onClick={openNew}>
              Create First Challenge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {challenges.map(c => (
            <Card key={c.id} className="hover:shadow-[0_10px_30px_hsl(35_22%_50%/0.12)] transition-all duration-300 border-border/60 hover:-translate-y-1">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold">{c.title}</h3>
                      <Badge className={`text-[10px] ${statusColor(c.status)}`}>{c.status}</Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <GripVertical size={9} />{c.form_fields?.length || 0} fields
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(c.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(c.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      {c.audience !== 'all' && (
                        <span className="flex items-center gap-1"><Users size={10} />For: {c.audience}</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-1.5 shrink-0 w-full sm:flex sm:w-auto mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs min-w-0"
                      onClick={() => openRequests(c)}>
                      <Users size={12} />People
                    </Button>
                    {c.status === 'active' ? (
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                        onClick={() => updateChallengeStatus(c, 'archived')}>
                        <Archive size={12} />Archive
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                        onClick={() => updateChallengeStatus(c, 'active')}>
                        <RotateCcw size={12} />Activate
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteChallenge(c.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Challenge Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none overflow-y-auto rounded-2xl p-4 sm:h-auto sm:max-h-[92vh] sm:w-full sm:max-w-3xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {editing ? 'Edit Challenge' : 'Create New Challenge'} 🏆
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details">
            <TabsList className="w-full grid grid-cols-2 h-auto rounded-xl">
              <TabsTrigger value="details" className="text-xs sm:text-sm py-2">Challenge Details</TabsTrigger>
              <TabsTrigger value="form" className="text-xs sm:text-sm py-2">Report Form Builder</TabsTrigger>
            </TabsList>

            {/* Details tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="e.g. 21-Day Japa Challenge" value={form.title}
                  onChange={e => set('title', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Short Description</Label>
                <Input placeholder="One line summary..." value={form.description}
                  onChange={e => set('description', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Full Details</Label>
                <Textarea placeholder="Explain the challenge in detail — what to do, how, why..."
                  value={form.details} onChange={e => set('details', e.target.value)}
                  rows={4} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label>Participation Criteria</Label>
                <Textarea placeholder="Who can join? Any prerequisites?"
                  value={form.criteria} onChange={e => set('criteria', e.target.value)}
                  rows={2} className="resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Date *</Label>
                  <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date *</Label>
                  <Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Audience</Label>
                  <Input placeholder="e.g. All, College Students, Working..."
                    value={form.audience} onChange={e => set('audience', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Form builder tab */}
            <TabsContent value="form" className="space-y-4 mt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Daily Report Fields</p>
                  <p className="text-xs text-muted-foreground">These are what students fill in every day</p>
                </div>
                <Button size="sm" variant="outline" className="w-full gap-1.5 sm:w-auto" onClick={addField}>
                  <Plus size={13} />Add Field
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl py-12 text-center">
                  <p className="text-muted-foreground text-sm">No fields yet.</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={addField}>
                    <Plus size={13} />Add First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <Card key={field.id} className="border-border/70">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="hidden text-muted-foreground mt-2 shrink-0 cursor-grab sm:block">
                            <GripVertical size={15} />
                          </div>
                          <div className="flex-1 space-y-2.5">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input className="text-sm flex-1 w-full" placeholder={`Field ${idx + 1} label...`}
                                value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} />
                              <Select value={field.type} onValueChange={v => updateField(field.id, 'type', v)}>
                                <SelectTrigger className="w-full sm:w-44 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {(field.type === 'mcq' || field.type === 'select') && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Options (one per line)</p>
                                <Textarea className="text-sm resize-none" rows={3}
                                  placeholder={"Option 1\nOption 2\nOption 3"}
                                  value={(field.options || []).join('\n')}
                                  onChange={e => updateOptions(field.id, e.target.value)} />
                              </div>
                            )}

                            {(field.type === 'text' || field.type === 'number' || field.type === 'textarea') && (
                              <Input className="text-sm" placeholder="Placeholder text (optional)"
                                value={field.placeholder || ''}
                                onChange={e => updateField(field.id, 'placeholder', e.target.value)} />
                            )}

                            <div className="flex items-center gap-2">
                              <button type="button"
                                onClick={() => updateField(field.id, 'required', !field.required)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${field.required ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground border-border'}`}>
                                {field.required ? '✓ Required' : 'Optional'}
                              </button>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeField(field.id)}>
                            <X size={13} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Preview */}
              {fields.length > 0 && (
                <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
                    <Eye size={11} />Student Preview
                  </p>
                  {fields.map(f => (
                    <div key={f.id} className="space-y-1">
                      <p className="text-xs font-medium">{f.label || '(untitled field)'}{f.required && <span className="text-destructive ml-0.5">*</span>}</p>
                      {f.type === 'yesno' && (
                        <div className="flex gap-2">
                          <div className="flex-1 py-1.5 rounded border border-border text-center text-xs text-muted-foreground">✅ Yes</div>
                          <div className="flex-1 py-1.5 rounded border border-border text-center text-xs text-muted-foreground">❌ No</div>
                        </div>
                      )}
                      {(f.type === 'mcq') && (
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {(f.options || ['Option 1', 'Option 2']).map(o => (
                            <div key={o} className="break-words py-1.5 px-2 rounded border border-border text-xs text-muted-foreground">○ {o}</div>
                          ))}
                        </div>
                      )}
                      {(f.type === 'select') && (
                        <div className="py-1.5 px-2 rounded border border-border text-xs text-muted-foreground">▾ Select an option</div>
                      )}
                      {(f.type === 'text' || f.type === 'number') && (
                        <div className="py-1.5 px-2 rounded border border-border text-xs text-muted-foreground">{f.placeholder || 'Short answer...'}</div>
                      )}
                      {f.type === 'textarea' && (
                        <div className="py-3 px-2 rounded border border-border text-xs text-muted-foreground">{f.placeholder || 'Long answer...'}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="flex-1 lotus-gradient text-white border-0" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Challenge' : 'Create Challenge 🙏'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Requests Dialog */}
      <Dialog open={!!requestsChallenge} onOpenChange={() => setRequestsChallenge(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{requestsChallenge?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{requests.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="rounded-xl border bg-accent/5 p-3 text-center">
                <p className="text-lg font-bold text-accent">{requests.filter(r => r.status === 'pending').length}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-xl border bg-green-50 p-3 text-center">
                <p className="text-lg font-bold text-green-700">{requests.filter(r => r.status === 'approved').length}</p>
                <p className="text-[10px] text-muted-foreground">Approved</p>
              </div>
            </div>
            {requests.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No students have requested this challenge yet.</p>
              : (
                <div className="space-y-5">
                  {(['pending', 'approved', 'rejected'] as const).map(status => {
                    const group = requests.filter(r => r.status === status)
                    if (group.length === 0) return null
                    return (
                      <div key={status} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {status === 'pending' ? 'Pending requests' : status === 'approved' ? 'Participants' : 'Not approved'}
                        </p>
                        {group.map(r => (
                          <Card key={r.id} className="border-border/70">
                            <CardContent className="pt-3 pb-3">
                              <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <div className="h-9 w-9 rounded-full lotus-gradient flex items-center justify-center text-white font-bold shrink-0 text-sm">
                                    {(r.profiles as any)?.full_name?.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm truncate">{(r.profiles as any)?.full_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(r.profiles as any)?.occupation} ·{' '}
                                      {(r.profiles as any)?.phone || 'No phone'}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={
                                  r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                    r.status === 'pending' ? 'bg-accent/10 text-accent border-accent/20' :
                                      'bg-red-50 text-red-700 border-red-200'
                                }>{r.status}</Badge>
                              </div>
                              {r.status === 'pending' && (
                                <div className="space-y-2 mt-2">
                                  <Input className="text-xs h-8" placeholder="Optional message to student..."
                                    value={adminMsgs[r.id] || ''}
                                    onChange={e => setAdminMsgs(prev => ({ ...prev, [r.id]: e.target.value }))} />
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 h-8 gap-1.5 text-xs"
                                      onClick={() => handleRequest(r.id, r.user_id, 'approved')}>
                                      <CheckCircle2 size={12} />Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/30 h-8 gap-1.5 text-xs"
                                      onClick={() => handleRequest(r.id, r.user_id, 'rejected')}>
                                      <XCircle size={12} />Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {r.admin_message && r.status !== 'pending' && (
                                <p className="text-xs text-muted-foreground italic mt-1 bg-muted/50 rounded px-2 py-1">
                                  "{r.admin_message}"
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
