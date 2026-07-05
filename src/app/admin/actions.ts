"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createChallenge(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const criteria = formData.get("criteria") as string;
  // We use standard HTML date inputs which pass strings like "2026-06-12"
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  await prisma.challenge.create({
    data: {
      title,
      description,
      criteria,
      startDate,
      endDate,
      status: "ACTIVE", // Automatically making it active to save time
    },
  });

  // Refresh the page so the new challenge appears instantly
  revalidatePath("/admin/challenges");
}
