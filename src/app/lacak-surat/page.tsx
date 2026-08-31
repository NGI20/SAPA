import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { TrackingPanel } from "@/components/tracking-panel";

export default function TrackPage() {
  return (
    <main className="page-shell bg-slate-50 min-h-screen">
      <SiteHeader active="Lacak Surat"/>
      <section className="max-w-3xl mx-auto pt-16 px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Lacak Status Surat & Hasil Pelacakan</h1>
        <p className="text-slate-600">Gunakan Kode Resi yang anda terima untuk melacak status permohonan</p>
      </section>
      <section className="max-w-3xl mx-auto px-4 pb-24 mt-10">
        <Suspense fallback={<p className="text-center text-slate-500">Memuat...</p>}>
          <TrackingPanel />
        </Suspense>
      </section>
    </main>
  );
}
