import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { TrackingPanel } from "@/components/tracking-panel";

export default function TrackPage() {
  return <main className="page-shell"><SiteHeader active="Lacak Surat"/><section className="page-heading"><span className="eyebrow">PELACAKAN PERMOHONAN</span><h1>Lacak status surat</h1><p>Masukkan kode resi yang Anda terima setelah mengirim permohonan.</p></section><section className="track-content"><Suspense fallback={<p>Memuat...</p>}><TrackingPanel /></Suspense></section></main>;
}
