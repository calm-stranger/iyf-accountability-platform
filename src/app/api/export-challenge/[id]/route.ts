import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Fetch the challenge with all its daily reports and the associated user data
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        reports: {
          include: {
            user: true,
          },
          orderBy: {
            submittedAt: "desc"
          }
        },
      },
    })

    if (!challenge) {
      return new NextResponse("Challenge not found", { status: 404 })
    }

    const reports = challenge.reports

    if (reports.length === 0) {
      return new NextResponse("No responses to export yet.", { status: 404 })
    }

    // Extract all unique keys from reportData across all reports for dynamic headers
    const reportDataKeys = new Set<string>()
    reports.forEach((report: any) => {
      if (report.reportData && typeof report.reportData === 'object') {
        Object.keys(report.reportData).forEach(key => reportDataKeys.add(key))
      }
    })
    
    const dynamicHeaders = Array.from(reportDataKeys)

    // Build CSV Headers
    const headers = [
      "Response ID",
      "User Name",
      "User Email",
      "Submitted At",
      ...dynamicHeaders,
      "Admin Feedback"
    ]

    // Helper to escape CSV fields
    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""'
      const stringified = String(str)
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`
      }
      return stringified
    }

    // Build CSV Rows
    const rows = reports.map((report: any) => {
      const baseData = [
        report.id,
        report.user.name || "Unknown",
        report.user.email,
        report.submittedAt.toISOString(),
      ]

      const dynamicData = dynamicHeaders.map(header => {
        const value = (report.reportData as Record<string, any>)?.[header]
        return value !== undefined ? value : ""
      })

      const finalData = [
        ...baseData,
        ...dynamicData,
        report.adminFeedback || ""
      ]

      return finalData.map(escapeCsv).join(",")
    })

    const csvContent = [headers.join(","), ...rows].join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="challenge_${challenge.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting challenge responses:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
