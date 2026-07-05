import { createChallenge } from '../actions'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

export default async function AdminChallengesPage() {
  // Fetch all existing challenges from the database
  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      
      <div className="mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Challenge Management</h1>
          <p className="text-stone-500">Create and oversee sadhana challenges.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* LEFT: CREATE CHALLENGE FORM */}
        <Card className="border-stone-200 shadow-sm bg-white h-fit">
          <CardHeader>
            <CardTitle className="text-stone-700">New Challenge</CardTitle>
            <CardDescription>Inspire the youth with a new spiritual goal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createChallenge} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Challenge Title</Label>
                <Input id="title" name="title" required placeholder="e.g., Kartik Month 16 Rounds" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description & Inspiration</Label>
                <Textarea id="description" name="description" required placeholder="What is the spiritual benefit of this challenge?" className="min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="criteria">Daily Criteria (What do they need to report?)</Label>
                <Textarea id="criteria" name="criteria" required placeholder="e.g., Minimum 4 rounds + 10 mins reading" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-4">
                Launch Challenge
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* RIGHT: LIST OF ACTIVE CHALLENGES */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Active Challenges</h2>
          
          {challenges.length === 0 ? (
            <p className="text-stone-500 italic">No challenges created yet. Launch your first one!</p>
          ) : (
            challenges.map((challenge) => (
              <Card key={challenge.id} className="border-stone-200 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-amber-700">{challenge.title}</CardTitle>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      {challenge.status}
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    {challenge.startDate.toLocaleDateString()} — {challenge.endDate.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600 mb-4 line-clamp-2">{challenge.description}</p>
                  <p className="text-xs font-medium text-stone-500 bg-stone-100 p-2 rounded mb-4">
                    Criteria: {challenge.criteria}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/api/export-challenge/${challenge.id}`} target="_blank" prefetch={false}>
                      <Button variant="secondary" size="sm">Export Responses (CSV)</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  )
}