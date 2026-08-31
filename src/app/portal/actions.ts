"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function submitDecision(receiptCode: string, decision: string, note?: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) throw new Error("Unauthorized");

  const submission = await prisma.submission.findUnique({ where: { receiptCode } });
  if (!submission) throw new Error("Permohonan tidak ditemukan.");

  // Validation
  if (user.role === "STAFF" && !["DITERUSKAN", "PERLU_REVISI", "DITOLAK"].includes(decision)) {
    throw new Error("Keputusan staf tidak valid.");
  }
  if (user.role === "ADMIN" && !["DISETUJUI", "DITOLAK"].includes(decision)) {
    throw new Error("Keputusan admin tidak valid.");
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: decision,
      statusLogs: {
        create: {
          status: decision,
          note: note || null,
        }
      },
      activities: {
        create: {
          actorId: user.id,
          action: `DECISION_${decision}`,
          detail: `${user.role === "STAFF" ? "Staf" : "Admin"} memutuskan: ${decision} untuk surat ${receiptCode}.`
        }
      }
    }
  });

  revalidatePath("/portal");
}

export async function addInternalUser(data: { name: string, email: string, password: string, role: string }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email sudah digunakan.");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role,
    }
  });

  revalidatePath("/portal");
}

export async function updateUserRole(userId: string, newRole: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Tidak dapat mengubah role sendiri.");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "PEMOHON") throw new Error("Tidak dapat mengubah role akun publik.");

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  revalidatePath("/portal");
}

export async function blockUser(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Tidak dapat memblokir diri sendiri.");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "ADMIN") throw new Error("Tidak dapat memblokir Admin lain.");

  await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: true }
  });

  revalidatePath("/portal");
}

export async function updateProfile(data: { name: string, email: string, phone: string, password?: string, institution?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, string> = {
    name: data.name,
    email: data.email,
    phone: data.phone
  };

  if (data.institution !== undefined) {
    updateData.institution = data.institution;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });

  // Revalidate both just in case
  revalidatePath("/portal");
  revalidatePath("/");
}
export async function unblockUser(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false }
  });
  revalidatePath("/portal");
}

export async function deleteUser(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Tidak dapat menghapus diri sendiri.");
  await prisma.user.delete({
    where: { id: userId }
  });
  revalidatePath("/portal");
}
