"use server";

import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";
import { loginSchema } from "@/lib/schemas/auth";
import type { AuthLoginResponse, Role } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

export type LoginActionState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
};

function homeForRole(role: Role): string {
  return role === "customer" ? "/tickets" : "/dashboard";
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  let response: AuthLoginResponse;
  try {
    response = await apiServer<AuthLoginResponse>("/auth/login", {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: "Invalid email or password" };
    }
    return { error: "Login failed. Please try again." };
  }

  await setSessionCookie(response.token);
  redirect(homeForRole(response.user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
