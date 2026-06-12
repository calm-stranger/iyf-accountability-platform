'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, ChevronRight, Music2, BookOpen, Briefcase } from 'lucide-react'

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('*')
        .eq('role', 'student').order('full_name')
      setStudents(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(students.filter(s =>
      s.full_name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.academic_institution?.toLowerCase().includes(q)
    ))
  }, [search, students])

  const OccupationIcon = ({ occ }: { occ?: string }) => {
    if (occ === 'student') return <BookOpen size={11} className="text-blue-500" />
    if (occ === 'working') return <Briefcase size={11} className="text-green-500" />
    return <Users size={11} className="text-muted-foreground" />
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🪷</div>
        <p className="text-sm text-muted-foreground">Loading students...</p></div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-primary" size={22} />Students
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{students.length} registered members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, phone, institution..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No students found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/students/${s.id}`)}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full lotus-gradient flex items-center justify-center text-white font-bold shrink-0">
                    {s.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{s.full_name}</p>
                      <Badge variant="outline" className="text-[10px] gap-1 py-0 h-4">
                        <OccupationIcon occ={s.occupation} />
                        <span className="capitalize">{s.occupation || 'N/A'}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {s.phone && <span className="text-xs text-muted-foreground">{s.phone}</span>}
                      {s.address && <span className="text-xs text-muted-foreground">{s.address}</span>}
                      {s.chanting_rounds ? (
                        <span className="text-xs text-accent flex items-center gap-1">
                          <Music2 size={10} />{s.chanting_rounds} rounds
                        </span>
                      ) : null}
                    </div>
                    {s.occupation === 'student' && s.academic_institution && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.academic_course && `${s.academic_course} · `}{s.academic_institution}
                        {s.academic_year && ` · ${s.academic_year}`}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}