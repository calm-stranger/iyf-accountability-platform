'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { User, Save, BookOpen, Phone, MapPin, Calendar, Music2, KeyRound, LogOut } from 'lucide-react'
import PinSetupModal from '@/components/pin-setup-modal'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [occupation, setOccupation] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPinModal, setShowPinModal] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', address: '', date_of_birth: '',
    chanting_rounds: '', academic_institution: '', academic_year: '', academic_course: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setOccupation(data.occupation || '')
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          date_of_birth: data.date_of_birth || '',
          chanting_rounds: data.chanting_rounds?.toString() || '',
          academic_institution: data.academic_institution || '',
          academic_year: data.academic_year || '',
          academic_course: data.academic_course || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      address: form.address,
      occupation,
      date_of_birth: form.date_of_birth || null,
      chanting_rounds: parseInt(form.chanting_rounds) || 0,
      academic_institution: occupation === 'student' ? form.academic_institution : null,
      academic_year: occupation === 'student' ? form.academic_year : null,
      academic_course: occupation === 'student' ? form.academic_course : null,
    }).eq('id', profile.id)

    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Profile updated! 🙏', description: 'Your details have been saved.' })
    }
    setSaving(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading profile...</p></div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="text-primary" size={22} /> My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Keep your details up to date</p>
      </div>

      {/* Avatar / name card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full lotus-gradient flex items-center justify-center text-white text-xl font-bold shrink-0">
              {form.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-foreground">{form.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{occupation || 'Student'}</p>
              <p className="text-xs text-accent font-medium mt-0.5">
                🕉 {form.chanting_rounds || 0} rounds daily
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User size={13} /> Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Phone size={11} /> Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Calendar size={11} /> Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><MapPin size={11} /> Address</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="City / Area" />
          </div>
        </CardContent>
      </Card>

      {/* Sadhana */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Music2 size={13} /> Sadhana Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <Label>Minimum Rounds Chanting Daily</Label>
            <Input type="number" min={0} max={64} value={form.chanting_rounds}
              onChange={e => set('chanting_rounds', e.target.value)} placeholder="e.g. 16" />
          </div>
        </CardContent>
      </Card>

      {/* Occupation */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <BookOpen size={13} /> Occupation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <Label>Current Occupation</Label>
            <Select value={occupation} onValueChange={setOccupation}>
              <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="working">Working Professional</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {occupation === 'student' && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Academic Details</p>
              <Input placeholder="Institution name" value={form.academic_institution}
                onChange={e => set('academic_institution', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Course (e.g. B.Tech)" value={form.academic_course}
                  onChange={e => set('academic_course', e.target.value)} />
                <Input placeholder="Year (e.g. 2nd Year)" value={form.academic_year}
                  onChange={e => set('academic_year', e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Login PIN */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <KeyRound size={13} /> Quick Login PIN
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground mb-3">
            {profile?.pin_hash ? 'You have a PIN set up for quick login on this device.' : 'Set up a PIN for faster login.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowPinModal(true)}>
            {profile?.pin_hash ? 'Change PIN' : 'Set Up PIN'}
          </Button>
        </CardContent>
      </Card>
      <PinSetupModal open={showPinModal} onClose={() => setShowPinModal(false)} userId={profile?.id || ''} />

      <Button className="w-full lotus-gradient text-white border-0 mb-4" onClick={handleSave} disabled={saving}>
        <Save size={15} className="mr-2" />
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>

      <div className="pt-6 border-t border-border mt-6">
        <Button variant="ghost" className="w-full text-destructive flex items-center justify-center gap-2" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          You will have to enter your password again to login.
        </p>
      </div>
    </div>
  )
}