import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/submission-utils";

export default async function PrintReceiptPage({ params }: { params: { resi: string } }) {
  const receiptCode = decodeURIComponent(params.resi);
  const submission = await prisma.submission.findUnique({ where: { receiptCode } });

  if (!submission) return notFound();

  return (
    <main className="min-h-screen bg-slate-100 p-8 flex items-start justify-center print:bg-white print:p-0">
      <div className="bg-white w-full max-w-2xl p-10 border border-slate-200 shadow-xl print:shadow-none print:border-none">
        
        {/* Header */}
        <div className="flex items-center gap-6 border-b-2 border-slate-800 pb-6 mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-3xl">
            S
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">SAPA - Tanda Terima</h1>
            <p className="text-sm font-medium text-slate-600">Sistem Administrasi Permohonan Antar Instansi (BWS Bali Penida)</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center print:bg-white print:border-2 print:border-slate-800">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Kode Resi Pelacakan</p>
            <p className="text-4xl font-black text-slate-900 font-mono tracking-tight">{submission.receiptCode}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Pengajuan</p>
              <p className="text-slate-800 font-medium">{formatDate(submission.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori Surat</p>
              <p className="text-slate-800 font-medium">{submission.category}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pemohon</p>
              <p className="text-slate-800 font-medium">{submission.applicantName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Instansi</p>
              <p className="text-slate-800 font-medium">{submission.institution || "Perseorangan"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Perihal</p>
              <p className="text-slate-800 font-medium">{submission.subject}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Simpan bukti tanda terima ini. Anda dapat melacak status permohonan kapan saja melalui portal SAPA dengan memasukkan <b>Kode Resi</b> di atas.
          </p>
        </div>

        {/* Auto Print Script */}
        <script dangerouslySetInnerHTML={{ __html: "window.onload = function() { window.print(); }" }} />
      </div>
    </main>
  );
}