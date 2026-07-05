"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function requestToJoin(challengeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  // Create a pending request in the database
  await prisma.challengeRequest.create({
    data: {
      userId: user.id,
      challengeId: challengeId,
      status: "PENDING",
    },
  });

  // Refresh the page so the button instantly changes to "Pending"
  revalidatePath("/dashboard/challenges");
}
