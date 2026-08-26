import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function createReceiptCode() {
  const now = new Date();
  const year = now.getFullYear();
  const datePart = `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `BWS/${year}/${datePart}/`;
  const count = await prisma.submission.count({ where: { receiptCode: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const applicantName = String(formData.get("name") || "").trim();
  const applicantEmail = String(formData.get("email") || "").trim().toLowerCase();
  const applicantPhone = String(formData.get("phone") || "").trim();
  const institution = String(formData.get("institution") || "").trim();
  const jobTitle = String(formData.get("jobTitle") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const file = formData.get("file");
  if (!applicantName || !applicantEmail || !applicantPhone || !category || !subject) return NextResponse.json({ error: "Lengkapi seluruh data wajib." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(applicantEmail)) return NextResponse.json({ error: "Format email belum valid." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Dokumen PDF wajib diunggah." }, { status: 400 });
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Dokumen harus berformat PDF." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Ukuran dokumen maksimal 5 MB." }, { status: 400 });
  const user = await getCurrentUser();
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  const storedName = `${randomUUID()}.pdf`;
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));
  const receiptCode = await createReceiptCode();
  const submission = await prisma.submission.create({
    data: {
      receiptCode, applicantId: user?.id, applicantName, applicantEmail, applicantPhone,
      institution: institution || null, jobTitle: jobTitle || null, address: address || null,
      category, subject, documentUrl: `/uploads/${storedName}`, documentName: file.name,
      statusLogs: { create: { status: "MENUNGGU_VERIFIKASI", note: "Permohonan berhasil diterima dan menunggu verifikasi petugas BWS." } },
      activities: { create: { actorId: user?.id, action: "SUBMISSION_CREATED", detail: `Permohonan ${receiptCode} dibuat.` } },
    },
  });
  return NextResponse.json({ receiptCode: submission.receiptCode }, { status: 201 });
}
