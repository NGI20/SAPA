"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function submitRevision(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const receiptCode = formData.get("receiptCode") as string;
  const file = formData.get("file") as File;

  if (!receiptCode || !file) throw new Error("Data tidak lengkap.");
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Dokumen harus berformat PDF.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran dokumen maksimal 5 MB.");
  }

  const submission = await prisma.submission.findUnique({ where: { receiptCode } });
  if (!submission || submission.applicantId !== user.id) throw new Error("Akses ditolak.");
  if (submission.status !== "PERLU_REVISI") throw new Error("Status surat tidak sedang dalam revisi.");

  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  const storedName = `${randomUUID()}.pdf`;
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      documentUrl: `/uploads/${storedName}`,
      documentName: file.name,
      status: "MENUNGGU",
      statusLogs: {
        create: {
          status: "MENUNGGU",
          note: "Dokumen telah direvisi oleh pemohon dan menunggu pengecekan ulang Staf.",
        }
      },
      activities: {
        create: {
          actorId: user.id,
          action: "SUBMISSION_REVISED",
          detail: `Pemohon merevisi dokumen surat ${receiptCode}.`
        }
      }
    }
  });

  revalidatePath("/riwayat-surat");
}

export async function deleteSubmission(receiptCode: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const submission = await prisma.submission.findUnique({ where: { receiptCode } });
  if (!submission || submission.applicantId !== user.id) throw new Error("Akses ditolak.");
  
  if (submission.status !== "MENUNGGU") {
    throw new Error("Hanya permohonan dengan status Menunggu yang dapat dihapus.");
  }

  // Delete all related records first
  await prisma.statusLog.deleteMany({ where: { submissionId: submission.id } });
  await prisma.activityLog.deleteMany({ where: { submissionId: submission.id } });
  
  // Then delete the submission
  await prisma.submission.delete({ where: { id: submission.id } });

  revalidatePath("/riwayat-surat");
}
