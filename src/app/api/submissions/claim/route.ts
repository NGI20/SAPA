import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const receiptCode = String((await request.json()).receiptCode || "").trim();
  if (!receiptCode) return NextResponse.json({ error: "Masukkan kode resi." }, { status: 400 });
  const submission = await prisma.submission.findUnique({ where: { receiptCode } });
  if (!submission) return NextResponse.json({ error: "Kode resi tidak ditemukan." }, { status: 404 });
  if (submission.applicantId) return NextResponse.json({ error: "Pengajuan ini sudah terhubung ke akun." }, { status: 409 });
  if (submission.applicantEmail.toLowerCase() !== user.email.toLowerCase()) return NextResponse.json({ error: "Email akun harus sama dengan email saat pengajuan." }, { status: 403 });
  await prisma.submission.update({ where: { id: submission.id }, data: { applicantId: user.id, activities: { create: { actorId: user.id, action: "SUBMISSION_CLAIMED", detail: `Permohonan ${receiptCode} ditambahkan ke riwayat akun.` } } } });
  return NextResponse.json({ ok: true });
}
