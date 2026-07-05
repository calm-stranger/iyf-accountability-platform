import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { requestToJoin } from './actions'

export default async function StudentChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Fetch all active challenges
  const activeChallenges = await prisma.challenge.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' }
  })

  // 2. Fetch the challenges this specific student has already requested/joined
  const userRequests = await prisma.challengeRequest.findMany({
    where: { userId: user.id }
  })

  // Helper function to check the status of a specific challenge
  const getRequestStatus = (challengeId: string) => {
    const request = userRequests.find((req: any) => req.challengeId === challengeId)
    return request ? request.status : null // Returns 'PENDING', 'ACCEPTED', 'REJECTED', or null
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div>
        <h2 className="text-3xl font-bold text-stone-800">Available Challenges</h2>
        <p className="text-stone-500 mt-1">
          Browse active sadhana programs and request to participate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeChallenges.length === 0 ? (
          <p className="text-stone-500 italic">No active challenges right now. Check back soon!</p>
        ) : (
          activeChallenges.map((challenge: any) => {
            const status = getRequestStatus(challenge.id)

            return (
              <Card key={challenge.id} className="border-stone-200 shadow-sm flex flex-col">
                <CardHeader>
                  <CardTitle className="text-amber-700">{challenge.title}</CardTitle>
                  <CardDescription>
                    {challenge.startDate.toLocaleDateString()} to {challenge.endDate.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <p className="text-sm text-stone-600 mb-4">{challenge.description}</p>
                  <div className="bg-stone-50 p-3 rounded-md border border-stone-100">
                    <p className="text-xs font-semibold text-stone-500 mb-1">Daily Task:</p>
                    <p className="text-sm text-stone-700">{challenge.criteria}</p>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-stone-100">
                  {/* DYNAMIC BUTTON BASED ON STATUS */}
                  {!status && (
                    <form action={requestToJoin.bind(null, challenge.id)} className="w-full">
                      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                        Request to Join
                      </Button>
                    </form>
                  )}

                  {status === 'PENDING' && (
                    <Button disabled variant="outline" className="w-full text-stone-500 border-stone-300">
                      Request Pending...
                    </Button>
                  )}

                  {status === 'ACCEPTED' && (
                    <Button disabled variant="outline" className="w-full bg-green-50 text-green-700 border-green-200">
                      Already Enrolled
                    </Button>
                  )}

                  {status === 'REJECTED' && (
                    <Button disabled variant="outline" className="w-full bg-red-50 text-red-700 border-red-200">
                      Request Declined
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}