import { formatDate, STATUS_LABELS } from "@/lib/submission-utils";
import QRCode from "qrcode";
import Link from "next/link";

interface ReceiptViewProps {
  submission: {
    id: string;
    receiptCode: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    institution: string | null;
    category: string;
    subject: string;
    responseNomor?: string | null;
    responseDocUrl?: string | null;
    responseDocName?: string | null;
    status: string;
    createdAt: Date;
  };
}

export default async function ReceiptView({ submission }: ReceiptViewProps) {
  // Generate high quality QR code containing official verification URL
  const verificationUrl = `https://sapa.bwsbalipenida.go.id/lacak-surat?resi=${encodeURIComponent(submission.receiptCode)}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: "#084f86",
      light: "#ffffff"
    }
  });

  const isApproved = submission.status === "DISETUJUI";

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center justify-start print:bg-white print:p-0">
      
      {/* Action bar (Hidden when printing) */}
      <div className="w-full max-w-3xl mb-6 flex items-center justify-between print:hidden">
        <Link 
          href="/riwayat-surat"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke Riwayat
        </Link>
        <button 
          id="print-btn"
          className="inline-flex items-center gap-2 bg-[#0868a9] hover:bg-[#084f86] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Cetak Dokumen (Print / PDF)
        </button>
      </div>

      {/* Official Document Sheet */}
      <div className="bg-white w-full max-w-3xl p-8 sm:p-12 border border-slate-200 shadow-xl rounded-2xl print:rounded-none print:shadow-none print:border-none print:p-0">
        
        {/* Official Kop BWS Bali Penida */}
        <div className="flex items-center justify-between border-b-4 border-[#0868a9] pb-5 mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#f4b81a] text-[#084f86] rounded-tl-[16px] rounded-br-[16px] rounded-tr-[4px] rounded-bl-[4px] flex items-center justify-center font-serif font-black text-3xl shrink-0 shadow-xs border border-amber-300">
              S
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">KEMENTERIAN PEKERJAAN UMUM</p>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">BALAI WILAYAH SUNGAI BALI - PENIDA</h1>
              <p className="text-xs text-slate-600">Sistem Administrasi Permohonan Antar Instansi (SAPA)</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="inline-block px-3 py-1 bg-blue-50 text-[#0868a9] font-bold text-xs rounded-full border border-blue-200">
              LEMBAR RESMI
            </span>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-wide">
            {isApproved ? "BUKTI PENETAPAN & KEPUTUSAN PERMOHONAN" : "TANDA TERIMA PENGAJUAN SURAT ELEKTRONIK"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Dokumen verifikasi digital yang sah dan terdaftar dalam pangkalan data SAPA</p>
        </div>

        {/* Resi Box */}
        <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-5 text-center mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-slate-800 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
            Nomor Resi Pelacakan
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-wider mb-1">
            {submission.receiptCode}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Status Permohonan:</span>
            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold ${
              submission.status === "DISETUJUI" ? "bg-emerald-100 text-emerald-800" :
              submission.status === "DITOLAK" ? "bg-red-100 text-red-800" :
              submission.status === "PERLU_REVISI" ? "bg-amber-100 text-amber-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {STATUS_LABELS[submission.status] || submission.status}
            </span>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="space-y-5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal Registrasi</p>
              <p className="text-slate-800 font-semibold">{formatDate(submission.createdAt.toISOString())}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kategori Permohonan</p>
              <p className="text-slate-800 font-semibold">{submission.category}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nama Pemohon</p>
              <p className="text-slate-800 font-semibold">{submission.applicantName}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Instansi Pengirim</p>
              <p className="text-slate-800 font-semibold">{submission.institution || "Perseorangan / Umum"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Kontak</p>
              <p className="text-slate-800 font-semibold">{submission.applicantEmail}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">No. HP / WhatsApp</p>
              <p className="text-slate-800 font-semibold">{submission.applicantPhone}</p>
            </div>
          </div>

          <div className="border-b border-slate-100 pb-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Maksud / Perihal Surat</p>
            <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {submission.subject}
            </p>
          </div>

          {/* Decision Box if Approved */}
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Hasil Keputusan Balai</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">DISETUJUI RESMI</span>
              </div>
              {submission.responseNomor && (
                <div>
                  <p className="text-xs text-emerald-700 font-medium">Nomor Surat Balasan / Rekomendasi Resmi:</p>
                  <p className="text-sm font-black text-emerald-950 font-mono">{submission.responseNomor}</p>
                </div>
              )}
              {submission.responseDocUrl && (
                <div className="pt-1">
                  <a 
                    href={submission.responseDocUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Unduh Lampiran Surat Balasan Resmi ({submission.responseDocName || "PDF"})
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Code & Digital Validation */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code Verifikasi SAPA" 
              className="w-28 h-28 object-contain"
            />
            <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Scan untuk Validasi Keaslian</span>
          </div>
          
          <div className="sm:col-span-2 text-xs text-slate-500 space-y-1.5">
            <p className="font-bold text-slate-700 uppercase">Ketentuan dan Validasi Digital:</p>
            <p className="leading-relaxed">
              1. Tanda terima ini dicetak secara otomatis oleh Sistem Administrasi Permohonan Antar Instansi (SAPA) BWS Bali Penida.
            </p>
            <p className="leading-relaxed">
              2. Kode QR di samping memuat tautan enkripsi langsung ke pangkalan data resmi untuk membuktikan keaslian dan status terkini dari permohonan surat ini.
            </p>
            <p className="leading-relaxed">
              3. Simpan lembar ini sebagai bukti tanda serah berkas digital yang sah.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[10px] text-slate-400">
          Dicetak dari Portal SAPA BWS Bali Penida &bull; Jl. Kapten Cok Agung Tresna No. 9, Denpasar, Bali
        </div>

      </div>

      {/* Client Print script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `
        }}
      />
    </main>
  );
}
