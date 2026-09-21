import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptView from "./ReceiptView";

export const dynamic = "force-dynamic";

export default async function CetakResiQueryPage({ searchParams }: { searchParams: { resi?: string } }) {
  const receiptCode = searchParams.resi ? decodeURIComponent(searchParams.resi) : "";
  if (!receiptCode) return notFound();

  const submission = await prisma.submission.findUnique({
    where: { receiptCode }
  });

  if (!submission) return notFound();

  return <ReceiptView submission={submission} />;
}
