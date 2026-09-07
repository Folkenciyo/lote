import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, BACKEND_URL } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const body = await backendResponse.json().catch(() => ({ detail: "Error de login" }));
    return NextResponse.json(body, { status: backendResponse.status });
  }

  const { access_token: accessToken } = await backendResponse.json();
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
