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
  const files = formData.getAll("files");

  if (!applicantName || !applicantEmail || !applicantPhone || !category || !subject) 
    return NextResponse.json({ error: "Lengkapi seluruh data wajib." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(applicantEmail)) 
    return NextResponse.json({ error: "Format email belum valid." }, { status: 400 });
  if (!files || files.length === 0) 
    return NextResponse.json({ error: "Dokumen PDF wajib diunggah." }, { status: 400 });

  let totalSize = 0;
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) return NextResponse.json({ error: "File tidak valid." }, { status: 400 });
    if (f.type !== "application/pdf" || !f.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Semua dokumen harus berformat PDF." }, { status: 400 });
    totalSize += f.size;
  }
  
  if (totalSize > 10 * 1024 * 1024) 
    return NextResponse.json({ error: "Total ukuran dokumen maksimal 10 MB." }, { status: 400 });

  const user = await getCurrentUser();
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  
  const savedUrls: string[] = [];
  const originalNames: string[] = [];

  for (const f of files) {
    const file = f as File;
    const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}.pdf`;
    await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));
    savedUrls.push(`/uploads/${storedName}`);
    originalNames.push(file.name);
  }

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
      receiptCode, 
      applicantId: user?.id, 
      applicantName, 
      applicantEmail, 
      applicantPhone,
      institution: institution || null, 
      category, 
      subject, 
      documentUrl: savedUrls.length === 1 ? savedUrls[0] : JSON.stringify(savedUrls), 
      documentName: originalNames.length === 1 ? originalNames[0] : originalNames.join(", "),
      statusLogs: { create: { status: "MENUNGGU", note: "Permohonan berhasil diterima dan masuk antrean Staf." } },
      activities: { create: { actorId: user?.id, action: "SUBMISSION_CREATED", detail: `Permohonan ${receiptCode} dibuat.` } },
    },
  });
  
  return NextResponse.json({ receiptCode: submission.receiptCode }, { status: 201 });
}
