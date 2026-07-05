import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PrintButton } from '@/components/print-button'
import { Button } from '@/components/ui/button'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ challengeId?: string; userId?: string }>
}) {
  const params = await searchParams
  const challengeId = params.challengeId || ''
  const userId = params.userId || ''

  // 1. Fetch all challenges for the dropdown
  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // 2. If a challenge is selected, fetch students who have reports for this challenge
  let users: any[] = []
  if (challengeId) {
    const reportsForChallenge = await prisma.dailyReport.findMany({
      where: { challengeId },
      select: { user: true },
      distinct: ['userId']
    })
    users = reportsForChallenge.map((r: any) => r.user)
  }

  // 3. Fetch reports based on selection
  let reports: any[] = []
  let reportKeys = new Set<string>()

  if (challengeId) {
    reports = await prisma.dailyReport.findMany({
      where: {
        challengeId,
        ...(userId ? { userId } : {})
      },
      include: {
        user: true,
        challenge: true
      },
      orderBy: { submittedAt: 'desc' }
    })

    // Extract all unique keys from reportData for table headers
    reports.forEach(report => {
      if (report.reportData && typeof report.reportData === 'object') {
        Object.keys(report.reportData).forEach(key => reportKeys.add(key))
      }
    })
  }

  const dynamicHeaders = Array.from(reportKeys)

  return (
    <div className="min-h-screen bg-stone-50 p-6 print:bg-white print:p-0">
      
      {/* Header and Print Button */}
      <div className="mb-8 flex justify-between items-center max-w-6xl mx-auto print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Printable Reports</h1>
          <p className="text-stone-500">View and print student challenge responses.</p>
        </div>
        {reports.length > 0 && <PrintButton />}
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center">
          {challengeId ? challenges.find((c: any) => c.id === challengeId)?.title : 'Challenge Reports'}
        </h1>
        {userId && (
          <h2 className="text-lg text-center mt-2">
            Student: {users.find((u: any) => u.id === userId)?.name || 'Unknown'}
          </h2>
        )}
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Filters Form */}
        <Card className="border-stone-200 shadow-sm bg-white print:hidden">
          <CardHeader>
            <CardTitle className="text-stone-700">Filter Reports</CardTitle>
            <CardDescription>Select a challenge and optionally a student to view their responses.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="GET" className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label htmlFor="challengeId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Select Challenge
                </label>
                <select
                  id="challengeId"
                  name="challengeId"
                  defaultValue={challengeId}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => {
                    // Reset user selection when challenge changes
                    const form = e.target.form;
                    if (form) {
                      const userSelect = form.elements.namedItem('userId') as HTMLSelectElement;
                      if (userSelect) userSelect.value = '';
                      form.submit();
                    }
                  }}
                >
                  <option value="">-- Choose a Challenge --</option>
                  {challenges.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 flex-1">
                <label htmlFor="userId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Select Student (Optional)
                </label>
                <select
                  id="userId"
                  name="userId"
                  defaultValue={userId}
                  disabled={!challengeId}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => e.target.form?.submit()}
                >
                  <option value="">-- All Students --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white md:w-32">
                Filter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Table */}
        {challengeId ? (
          <Card className="border-stone-200 shadow-sm bg-white print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-stone-700 uppercase bg-stone-100 print:bg-stone-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    {dynamicHeaders.map((header: any) => (
                      <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={2 + dynamicHeaders.length} className="px-4 py-8 text-center text-stone-500">
                        No responses found for this selection.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report: any) => (
                      <tr key={report.id} className="border-b hover:bg-stone-50 print:hover:bg-transparent">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {report.submittedAt.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {report.user.name || report.user.email}
                        </td>
                        {dynamicHeaders.map((header: any) => {
                          const val = (report.reportData as Record<string, any>)?.[header]
                          return (
                            <td key={header} className="px-4 py-3">
                              {typeof val === 'boolean' ? (val ? '✅ Yes' : '❌ No') : (val || '-')}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="text-center py-12 text-stone-500 bg-white rounded-lg border border-stone-200 border-dashed print:hidden">
            Please select a challenge to view reports.
          </div>
        )}

      </div>
    </div>
  )
}
