import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { receipt: string } }) {
  const submission = await prisma.submission.findUnique({
    where: { receiptCode: decodeURIComponent(params.receipt) },
    include: { statusLogs: { orderBy: { createdAt: "asc" } } },
  });
  if (!submission) return NextResponse.json({ error: "Permohonan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ submission: { receiptCode: submission.receiptCode, applicantName: submission.applicantName, institution: submission.institution, category: submission.category, status: submission.status, createdAt: submission.createdAt, statusLogs: submission.statusLogs } });
}
