"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Invalid email or password");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard"); // We will build this next!
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  // 1. Sign up the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Could not create account");
  }

  // 2. Create the corresponding user profile in our Prisma database
  if (data.user) {
    await prisma.user.create({
      data: {
        id: data.user.id, // We use the same ID Supabase generates
        email: email,
        name: name,
        role: "STUDENT", // Default to student. We can manually make you Admin later.
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
