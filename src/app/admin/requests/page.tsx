import { prisma } from '@/lib/prisma'
import { processRequest } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function AdminRequestsPage() {
  // Fetch all PENDING requests, and pull in the User's name and Challenge's title!
  const pendingRequests = await prisma.challengeRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: true,
      challenge: true,
    },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-stone-800">Pending Requests</h2>
        <p className="text-stone-500 mt-1">Review and accept students into challenges.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingRequests.length === 0 ? (
          <p className="text-stone-500 italic bg-white p-6 rounded-md shadow-sm border border-stone-200 col-span-full">
            No pending requests at the moment.
          </p>
        ) : (
          pendingRequests.map((req) => (
            <Card key={req.id} className="border-stone-200 shadow-sm bg-white">
              <CardHeader className="pb-2 border-b border-stone-100">
                <CardTitle className="text-lg text-stone-800">
                  {req.user.name || req.user.email}
                </CardTitle>
                <CardDescription className="text-amber-700 font-medium">
                  Wants to join: {req.challenge.title}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                <form action={processRequest} className="space-y-4">
                  {/* Hidden inputs to pass the required IDs to the server action */}
                  <input type="hidden" name="requestId" value={req.id} />
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-500">
                      Message to Student (Optional)
                    </label>
                    <Input 
                      name="adminMessage" 
                      placeholder="e.g., Haribol! Happy to have you on board." 
                      className="text-sm bg-stone-50"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      name="status" 
                      value="ACCEPTED" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Accept
                    </Button>
                    <Button 
                      type="submit" 
                      name="status" 
                      value="REJECTED" 
                      variant="outline" 
                      className="w-full text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
                    >
                      Reject
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}