import { ApplicationForm } from "@/components/application-form";
import { SiteHeader } from "@/components/site-header";
export default function ApplyPage() { return <main className="page-shell"><SiteHeader active="Ajukan Surat" /><section className="page-heading"><span className="eyebrow">LAYANAN PERMOHONAN</span><h1>Ajukan permohonan surat</h1><p>Lengkapi data berikut. Pastikan dokumen yang Anda lampirkan sudah benar.</p></section><section className="form-card"><ApplicationForm /></section></main>; }
