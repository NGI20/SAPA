import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie, sessionOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json(); const identifier = String(body.identifier || "").trim(); const password = String(body.password || "");
  if (!identifier || !password) return NextResponse.json({ error: "Masukkan email/nomor HP dan kata sandi." }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Email/nomor HP atau kata sandi tidak sesuai." }, { status: 401 });
  if (user.isBlocked) return NextResponse.json({ error: "Akun Anda telah dinonaktifkan." }, { status: 403 });
  const remember = Boolean(body.remember);
  const options = { ...sessionOptions };
  if (remember) {
    options.maxAge = 60 * 60 * 24 * 30; // 30 days
  }

  const response = NextResponse.json({ user: { name: user.name, email: user.email } });
  response.cookies.set(sessionCookie, await createSessionToken({ userId: user.id, email: user.email }), options);
  return response;
}
