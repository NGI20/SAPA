import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie, sessionOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim(); const institution = String(body.institution || "").trim();
  const email = String(body.email || "").trim().toLowerCase(); const phone = String(body.phone || "").trim();
  const password = String(body.password || ""); const confirmPassword = String(body.confirmPassword || "");
  if (!name || !email || !phone || !password) return NextResponse.json({ error: "Lengkapi seluruh data wajib." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Format email belum valid." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Kata sandi minimal 8 karakter." }, { status: 400 });
  if (password !== confirmPassword) return NextResponse.json({ error: "Konfirmasi kata sandi tidak sama." }, { status: 400 });
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (exists) return NextResponse.json({ error: "Email atau nomor HP sudah terdaftar." }, { status: 409 });
  const user = await prisma.user.create({ data: { name, institution: institution || null, email, phone, passwordHash: await bcrypt.hash(password, 12) } });
  const response = NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 });
  response.cookies.set(sessionCookie, await createSessionToken({ userId: user.id, email: user.email }), sessionOptions);
  return response;
}
