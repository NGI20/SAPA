import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Masukkan email." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, we always return success to prevent email enumeration.
    // In production, generate a reset token, store it, and send an email.
    if (user) {
      console.log(`[SAPA] Password reset requested for: ${user.email}`);
      // TODO: Generate reset token and send email
    }

    return NextResponse.json({
      message: "Jika email terdaftar, tautan reset telah dikirim.",
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
