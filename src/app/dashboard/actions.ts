"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function submitDailyReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  const challengeId = formData.get("challengeId") as string;

  // Checkboxes send the value "on" if they are checked, otherwise they are null
  const wokeUpEarly = formData.get("wokeUpEarly") === "on";
  const chanted8Rounds = formData.get("chanted8Rounds") === "on";
  const readBG = formData.get("readBG") === "on";
  const realization = formData.get("realization") as string;

  // Store the exact checklist results in our flexible JSON field!
  const reportData = {
    wokeUpEarly,
    chanted8Rounds,
    readBG,
    realization: realization || "None",
  };

  await prisma.dailyReport.create({
    data: {
      userId: user.id,
      challengeId: challengeId,
      reportData: reportData,
    },
  });

  // Refresh the dashboard
  revalidatePath("/dashboard");
}
