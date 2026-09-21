import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateSuratMasukExcelBuffer } from "@/lib/excel-export";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { startDate, endDate } = body;

  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      receiptCode: true,
      applicantName: true,
      institution: true,
      category: true,
      subject: true,
      status: true,
      createdAt: true
    }
  });

  const formattedSubmissions = submissions.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString()
  }));

  const buffer = await generateSuratMasukExcelBuffer(formattedSubmissions);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Surat Masuk 2025.xlsx"'
    }
  });
}
