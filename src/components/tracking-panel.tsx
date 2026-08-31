"use client";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { STATUS_LABELS, formatDate } from "@/lib/submission-utils";
import { FileEdit, ArrowRight, FileClock, Check, FileText, ChevronUp, ChevronDown, Mail } from "lucide-react";

type TrackingData = { 
  receiptCode: string; 
  applicantName: string; 
  institution: string | null; 
  category: string; 
  status: string; 
  createdAt: string; 
  statusLogs: { status: string; note: string | null; createdAt: string }[] 
};

export function TrackingPanel() { 
  const searchParams = useSearchParams(); 
  const [receipt, setReceipt] = useState(searchParams.get("resi") || ""); 
  const [result, setResult] = useState<TrackingData | null>(null); 
  const [message, setMessage] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  async function track(event: FormEvent) { 
    event.preventDefault(); 
    setResult(null); 
    setMessage(""); 
    if (!receipt.trim()) return setMessage("Masukkan kode resi terlebih dahulu."); 
    setLoading(true); 
    const response = await fetch(`/api/submissions/${encodeURIComponent(receipt.trim())}`); 
    const data = await response.json(); 
    setLoading(false); 
    if (!response.ok) return setMessage(data.error || "Permohonan tidak ditemukan. Periksa kembali kode resi Anda."); 
    setResult(data.submission); 
  }

  // Map backend status to stepper index (0-3)
  const getStepIndex = (status: string) => {
    if (status === "MENUNGGU" || status === "PERLU_REVISI") return 1; // Proses Verifikasi
    if (status === "DITERUSKAN") return 2; // Proses Tindak Lanjut
    if (status === "DISETUJUI" || status === "DITOLAK") return 3; // Selesai
    return 1;
  };

  const currentStep = result ? getStepIndex(result.status) : 0;

  return (
    <>
      <form onSubmit={track} className="mb-10 text-left">
        <label className="block text-sm font-semibold text-slate-800 mb-2">Kode Resi</label>
        <div className="flex gap-4">
          <input 
            value={receipt} 
            onChange={e => setReceipt(e.target.value)} 
            className="flex-1 h-12 px-4 border border-slate-400 rounded-md focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-800" 
            placeholder="BWS/2026/2408/01" 
          />
          <button 
            type="submit"
            disabled={loading}
            className="h-12 px-8 bg-[#0868a9] text-white font-bold rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Mencari..." : "Lacak Status"}
          </button>
        </div>
        {message && <p className="text-red-500 mt-2 text-sm font-medium">{message}</p>}
      </form>

      {result && (
        <article className="bg-white border border-slate-700 rounded-lg overflow-hidden text-left shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 tracking-wide uppercase">
              HASIL PELACAKAN / STATUS SAAT INI
            </h2>
          </div>
          
          <div className="p-6 md:p-8">
            <p className="text-slate-900 font-semibold mb-3 text-lg">Nomor Resi : {result.receiptCode}</p>
            <p className="text-slate-900 font-semibold mb-6 text-lg">Tanggal Pengajuan : {formatDate(result.createdAt).split(' ')[0]} {formatDate(result.createdAt).split(' ')[1]} {formatDate(result.createdAt).split(' ')[2]}</p>
            
            <hr className="border-slate-300 mb-6" />
            
            <div className="mb-6">
              <div className="mb-3 text-slate-800">
                <FileText className="w-12 h-12 stroke-[1.5]" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">
                {STATUS_LABELS[result.status] || result.status} 
                {result.status === "MENUNGGU" && " (Staff TU)"}
                {result.status === "DITERUSKAN" && " (Pimpinan)"}
              </h3>
            </div>

            <div className="border border-slate-300 rounded-xl mb-10 overflow-hidden shadow-sm">
               <button 
                 onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                 className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
               >
                 <div className="flex items-center gap-3 text-slate-800 font-bold text-[15px]">
                   <FileClock className="w-5 h-5 text-[#0868a9]" />
                   Riwayat Status ({result.statusLogs.length + 1})
                 </div>
                 <div className="text-slate-500">
                   {isTimelineOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                 </div>
               </button>
               
               {isTimelineOpen && (
                 <div className="p-5 pt-2">
                   <div className="relative border-l-2 border-slate-200 ml-3 pl-8 space-y-8 mt-2 pb-2">
                     {/* First Node: Submitted */}
                     <div className="relative">
                       <span className="absolute -left-[45px] top-0 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600">
                         <Mail className="w-5 h-5" />
                       </span>
                       <div>
                         <b className="block text-slate-900 text-[15px]">Surat Terkirim</b>
                         <small className="text-slate-500 text-sm">{formatDate(result.createdAt)}</small>
                       </div>
                     </div>

                     {/* Other Logs */}
                     {result.statusLogs.map((log, idx) => (
                       <div className="relative" key={idx}>
                         <span className="absolute -left-[45px] top-0 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600">
                           <FileClock className="w-5 h-5" />
                         </span>
                         <div>
                           <b className="block text-slate-900 text-[15px]">{STATUS_LABELS[log.status] || log.status}</b>
                           <small className="text-slate-500 text-sm">{formatDate(log.createdAt)}</small>
                           {log.note && (
                             <div className="mt-2 p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
                               <b>Catatan:</b> {log.note}
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>

            <h4 className="font-bold text-slate-900 mb-8 text-xl">Proses Status</h4>
            <div className="flex justify-between relative max-w-3xl mx-auto">
               {/* Stepper Lines */}
               <div className="absolute top-7 left-[12%] right-[12%] h-[3px] bg-slate-200 z-0"></div>
               <div 
                 className="absolute top-7 left-[12%] h-[3px] bg-amber-400 z-0 transition-all duration-500" 
                 style={{ width: `calc(${currentStep * 33.33}% - 8%)` }}
               ></div>
               
               {/* Step 1 */}
               <div className="relative z-10 flex flex-col items-center gap-4 w-1/4">
                 <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#facc15] text-slate-800 shadow-sm border-4 border-white">
                   <FileEdit className="w-6 h-6" />
                 </div>
                 <span className="text-sm font-bold text-slate-800 text-center leading-tight">Tulis Surat</span>
               </div>

               {/* Step 2 */}
               <div className="relative z-10 flex flex-col items-center gap-4 w-1/4">
                 <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border-4 border-white transition-colors duration-500 ${currentStep >= 1 ? "bg-[#facc15] text-slate-800" : "bg-slate-200 text-slate-400"}`}>
                   <ArrowRight className="w-6 h-6" />
                 </div>
                 <span className={`text-sm font-bold text-center leading-tight ${currentStep >= 1 ? "text-slate-800" : "text-slate-400"}`}>Proses Verifikasi</span>
               </div>

               {/* Step 3 */}
               <div className="relative z-10 flex flex-col items-center gap-4 w-1/4">
                 <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border-4 border-white transition-colors duration-500 ${currentStep >= 2 ? "bg-[#facc15] text-slate-800" : "bg-slate-200 text-slate-400"}`}>
                   <FileClock className="w-6 h-6" />
                 </div>
                 <span className={`text-sm font-bold text-center leading-tight ${currentStep >= 2 ? "text-slate-800" : "text-slate-400"}`}>Proses Tindak Lanjut</span>
               </div>

               {/* Step 4 */}
               <div className="relative z-10 flex flex-col items-center gap-4 w-1/4">
                 <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border-4 border-white transition-colors duration-500 ${currentStep >= 3 ? "bg-[#facc15] text-slate-800" : "bg-slate-200 text-slate-400"}`}>
                   <Check className="w-6 h-6 stroke-[3]" />
                 </div>
                 <span className={`text-sm font-bold text-center leading-tight ${currentStep >= 3 ? "text-slate-800" : "text-slate-400"}`}>Selesai</span>
               </div>
            </div>
          </div>
        </article>
      )}
    </>
  );
}
