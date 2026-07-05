"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processRequest(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  const status = formData.get("status") as "ACCEPTED" | "REJECTED";
  const adminMessage = formData.get("adminMessage") as string;

  await prisma.challengeRequest.update({
    where: { id: requestId },
    data: {
      status: status,
      adminMessage: adminMessage || null, // Save message if provided
    },
  });

  // Refresh the page so the request disappears from the pending list
  revalidatePath("/admin/requests");
}
