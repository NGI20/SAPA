import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptView from "../ReceiptView";

export const dynamic = "force-dynamic";

export default async function CetakResiCatchAllPage({ params }: { params: { resi: string[] } }) {
  const receiptCode = params.resi ? decodeURIComponent(params.resi.join("/")) : "";
  if (!receiptCode) return notFound();

  const submission = await prisma.submission.findUnique({
    where: { receiptCode }
  });

  if (!submission) return notFound();

  return <ReceiptView submission={submission} />;
}
