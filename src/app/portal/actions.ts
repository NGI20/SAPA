"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";

export async function submitDecision(
  receiptCode: string,
  decision: string,
  note?: string,
  internalNote?: string,
  responseNomor?: string,
  responseDocUrl?: string,
  responseDocName?: string
) {
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

  const updateData: Prisma.SubmissionUpdateInput = {
    status: decision,
    statusLogs: {
      create: {
        status: decision,
        note: note || null,
      }
    },
    activities: {
      create: {
        actor: { connect: { id: user.id } },
        action: `DECISION_${decision}`,
        detail: `${user.role === "STAFF" ? "Staf TU" : "Admin BWS"} memutuskan: ${decision} untuk surat ${receiptCode}.${internalNote ? " (Dengan Catatan Internal)" : ""}`
      }
    }
  };

  if (internalNote !== undefined) {
    updateData.internalNote = internalNote;
  }
  if (responseNomor !== undefined) {
    updateData.responseNomor = responseNomor;
  }
  if (responseDocUrl !== undefined) {
    updateData.responseDocUrl = responseDocUrl;
  }
  if (responseDocName !== undefined) {
    updateData.responseDocName = responseDocName;
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: updateData
  });

  revalidatePath("/portal");
  revalidatePath("/riwayat-surat");
  revalidatePath("/lacak-surat");
}

export async function uploadResponseFile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("File tidak ditemukan.");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "balasan");
  await mkdir(uploadDir, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/balasan/${safeName}`,
    name: file.name
  };
}

export async function saveGeneratedResponsePdf(receiptCode: string, pdfBase64: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  const commaIndex = pdfBase64.indexOf(",");
  const cleanBase64 = commaIndex !== -1 ? pdfBase64.slice(commaIndex + 1) : pdfBase64;
  const buffer = Buffer.from(cleanBase64, "base64");

  const uploadDir = path.join(process.cwd(), "public", "uploads", "balasan");
  await mkdir(uploadDir, { recursive: true });

  const safeReceipt = receiptCode.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Surat_Balasan_${safeReceipt}_${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/balasan/${fileName}`,
    name: `Surat Balasan Resmi (${receiptCode.replace(/\//g, "-")}).pdf`
  };
}



export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("File tidak ditemukan.");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "png";
  const safeName = `avatar-${user.id}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, safeName);
  await writeFile(filePath, buffer);

  const avatarUrl = `/uploads/avatars/${safeName}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl }
  });

  revalidatePath("/portal");
  revalidatePath("/riwayat-surat");
  revalidatePath("/");

  return { url: avatarUrl };
}

export async function uploadAvatarBase64(base64Data: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Image, "base64");

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const safeName = `avatar-${user.id}-${Date.now()}.jpg`;
  const filePath = path.join(uploadDir, safeName);
  await writeFile(filePath, buffer);

  const avatarUrl = `/uploads/avatars/${safeName}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl }
  });

  revalidatePath("/portal");
  revalidatePath("/riwayat-surat");
  revalidatePath("/");

  return { url: avatarUrl };
}

export async function addInternalUser(data: { name: string, email: string, password: string, role: string, nip?: string, phone?: string }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email sudah digunakan.");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      nip: data.nip || null,
      institution: data.role === "ADMIN" ? "BWS Bali Penida" : "Tata Usaha BWS Bali Penida",
      passwordHash: hashedPassword,
      role: data.role,
      activities: {
        create: {
          action: "USER_CREATED",
          detail: `Admin (${user.name}) menambahkan pengguna baru: ${data.name} (${data.role})`
        }
      }
    }
  });

  revalidatePath("/portal");
}

export async function updateUserRole(userId: string, newRole: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Tidak dapat mengubah role sendiri.");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  await prisma.user.update({
    where: { id: userId },
    data: { 
      role: newRole,
      activities: {
        create: {
          action: "ROLE_CHANGED",
          detail: `Admin (${user.name}) mengubah role ${target.name} dari ${target.role} ke ${newRole}.${reason ? ` Alasan: ${reason}` : ""}`
        }
      }
    }
  });

  revalidatePath("/portal");
}

export async function blockUser(userId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Tidak dapat memblokir diri sendiri.");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "ADMIN") throw new Error("Tidak dapat memblokir Admin lain.");
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  await prisma.user.update({
    where: { id: userId },
    data: { 
      isBlocked: true,
      activities: {
        create: {
          action: "USER_BLOCKED",
          detail: `Admin (${user.name}) memblokir akun ${target.name}.${reason ? ` Alasan: ${reason}` : ""}`
        }
      }
    }
  });

  revalidatePath("/portal");
}

export async function unblockUser(userId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  await prisma.user.update({
    where: { id: userId },
    data: { 
      isBlocked: false,
      activities: {
        create: {
          action: "USER_UNBLOCKED",
          detail: `Admin (${user.name}) membuka blokir akun ${target.name}.${reason ? ` Alasan: ${reason}` : ""}`
        }
      }
    }
  });

  revalidatePath("/portal");
}

export async function deleteUser(userId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Tidak dapat menghapus diri sendiri.");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Pengguna tidak ditemukan.");

  await prisma.activityLog.create({
    data: {
      actorId: user.id,
      action: "USER_DELETED",
      detail: `Admin (${user.name}) menghapus akun ${target.name} (${target.email}).${reason ? ` Alasan: ${reason}` : ""}`
    }
  });

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/portal");
}

export async function updateProfile(data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  institution?: string;
  nip?: string;
  avatarUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Prisma.UserUpdateInput = {
    name: data.name,
    email: data.email,
    phone: data.phone || null
  };

  if (data.institution !== undefined) {
    updateData.institution = data.institution;
  }

  if (data.nip !== undefined) {
    updateData.nip = data.nip;
  }

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }

  if (data.password && data.password.trim().length > 0) {
    if (data.password.length < 6) {
      throw new Error("Kata sandi minimal 6 karakter.");
    }
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });

  revalidatePath("/portal");
  revalidatePath("/riwayat-surat");
  revalidatePath("/");
}
