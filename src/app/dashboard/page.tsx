import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitDailyReport } from './actions'
import { Checkbox } from '@/components/ui/checkbox'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Fetch user profile
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  // 2. Fetch their ACCEPTED challenges
  const activeEnrollments = await prisma.challengeRequest.findMany({
    where: { 
      userId: user.id,
      status: 'ACCEPTED'
    },
    include: { challenge: true }
  })

  // 3. Fetch today's reports to see if they already submitted
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const todaysReports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      submittedAt: { gte: startOfToday }
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* WELCOME HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-stone-800">
          Hare Krishna, {dbUser?.name || 'Devotee'}!
        </h2>
        <p className="text-stone-500 mt-2 text-lg">
          Every day is a fresh opportunity to connect.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* MAIN WIDGET: Daily Reports */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-stone-800">Today's Check-in</h3>

          {activeEnrollments.length === 0 ? (
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-stone-600 italic">
                  You are not enrolled in any active challenges yet. Go to the Challenges tab to join one!
                </p>
              </CardContent>
            </Card>
          ) : (
            activeEnrollments.map((enrollment: any) => {
              const challenge = enrollment.challenge;
              // Check if a report for THIS challenge was already submitted today
              const isSubmittedToday = todaysReports.some((report: any) => report.challengeId === challenge.id)

              return (
                <Card key={challenge.id} className="border-stone-200 shadow-sm bg-white">
                  <CardHeader className="bg-stone-50/50 border-b border-stone-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-amber-700">{challenge.title}</CardTitle>
                        <CardDescription className="mt-1">Task: {challenge.criteria}</CardDescription>
                      </div>
                      {isSubmittedToday && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                          ✓ Done Today
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {isSubmittedToday ? (
                      <div className="text-center py-4 space-y-2">
                        <p className="text-stone-600 font-medium">Haribol! Your sadhana is recorded.</p>
                        <p className="text-sm text-stone-500">Rest well and see you tomorrow.</p>
                      </div>
                    ) : (
                      <form action={submitDailyReport} className="space-y-4">
                        <input type="hidden" name="challengeId" value={challenge.id} />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rounds">Rounds Chanted</Label>
                            <Input id="rounds" name="rounds" type="number" min="0" required placeholder="e.g., 16" className="bg-stone-50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reading">Reading (Mins)</Label>
                            <Input id="reading" name="reading" type="number" min="0" required placeholder="e.g., 20" className="bg-stone-50" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="realization">Short Realization / Note (Optional)</Label>
                          <Input id="realization" name="realization" placeholder="Any thoughts from today's reading?" className="bg-stone-50" />
                        </div>

                        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                          Submit Today's Report
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* SIDE WIDGET: Profile Summary (Unchanged) */}
        <Card className="border-stone-200 shadow-sm h-fit">
          <CardHeader className="bg-stone-50/50 border-b border-stone-100 pb-4">
            <CardTitle className="text-stone-700">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex justify-between">
                <span className="font-medium">Role:</span> 
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                  {dbUser?.role}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="font-medium">Target Rounds:</span> 
                <span>{dbUser?.minRounds || 0}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}