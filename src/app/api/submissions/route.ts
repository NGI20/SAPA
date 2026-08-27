import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const applicantName = String(formData.get("name") || "").trim();
  const applicantEmail = String(formData.get("email") || "").trim().toLowerCase();
  const applicantPhone = String(formData.get("phone") || "").trim();
  const institution = String(formData.get("institution") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const file = formData.get("file");

  if (!applicantName || !applicantEmail || !applicantPhone || !category || !subject) 
    return NextResponse.json({ error: "Lengkapi seluruh data wajib." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(applicantEmail)) 
    return NextResponse.json({ error: "Format email belum valid." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) 
    return NextResponse.json({ error: "Dokumen PDF wajib diunggah." }, { status: 400 });
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) 
    return NextResponse.json({ error: "Dokumen harus berformat PDF." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) 
    return NextResponse.json({ error: "Ukuran dokumen maksimal 5 MB." }, { status: 400 });

  const user = await getCurrentUser();
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  const storedName = `${randomUUID()}.pdf`;
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));

  const year = new Date().getFullYear().toString();
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  let catCode = "UMUM";
  if (category) {
    const lower = category.toLowerCase();
    if (lower.includes("rekomendasi")) catCode = "REKOMENDASI";
    else if (lower.includes("data")) catCode = "DATA";
    else if (lower.includes("izin")) catCode = "IZIN";
    else if (lower.includes("kerja sama") || lower.includes("kerjasama")) catCode = "KERJASAMA";
  }

  const count = await prisma.submission.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`)
      }
    }
  });
  
  const seq = (count + 1).toString().padStart(3, "0");
  const receiptCode = `SAPA/${catCode}/${year}/${randomCode}/${seq}`;

  const submission = await prisma.submission.create({
    data: {
      receiptCode, applicantId: user?.id, applicantName, applicantEmail, applicantPhone,
      institution: institution || null, category, subject, documentUrl: `/uploads/${storedName}`, documentName: file.name,
      statusLogs: { create: { status: "MENUNGGU_VERIFIKASI", note: "Permohonan berhasil diterima dan menunggu verifikasi petugas BWS." } },
      activities: { create: { actorId: user?.id, action: "SUBMISSION_CREATED", detail: `Permohonan ${receiptCode} dibuat.` } },
    },
  });
  
  return NextResponse.json({ receiptCode: submission.receiptCode }, { status: 201 });
}
