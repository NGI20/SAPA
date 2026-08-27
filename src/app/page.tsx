import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ScrollAnimation } from "@/components/scroll-animation";

const steps = [
  ["01", "Isi permohonan", "Lengkapi formulir dan pilih kategori layanan yang dibutuhkan."],
  ["02", "Unggah dokumen", "Lampirkan dokumen pendukung dalam format PDF secara aman."],
  ["03", "Verifikasi BWS", "Petugas BWS Bali Penida memeriksa kelengkapan permohonan."],
  ["04", "Pantau hingga selesai", "Gunakan kode resi untuk melihat pembaruan status secara real-time."],
];

export default function Home() {
  return <main>
    <SiteHeader active="Beranda" />
    <ScrollAnimation>
      <section className="hero-grid"><div className="hero-copy"><span className="eyebrow">LAYANAN DIGITAL BWS BALI PENIDA</span><h1>Urus surat antar instansi, lebih mudah dan transparan.</h1><p>SAPA membantu masyarakat dan instansi mengajukan permohonan surat secara daring, tanpa proses berbelit dan tanpa kehilangan jejak status.</p><div className="hero-actions"><Link className="button button-primary" href="/ajukan-surat">Ajukan surat <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></Link><Link className="button button-ghost" href="/lacak-surat">Lacak status</Link></div><div className="hero-proof"><strong>24/7</strong><span>Layanan dapat diakses kapan saja</span><strong>Real-time</strong><span>Status selalu terbarui</span></div></div><div className="hero-visual"><div className="floating-card card-top"><span className="mini-icon green">✓</span><div><b>Dokumen diterima</b><small>Permohonan berhasil dikirim</small></div></div><div className="document-card"><div className="document-header"><span className="sapa-mark small">S</span><span>PERMOHONAN SURAT</span><i>•••</i></div><div className="doc-lines"><span></span><span></span><span></span><span></span></div><div className="doc-stamp">TERVERIFIKASI</div></div><div className="floating-card card-bottom"><span className="mini-icon gold">⌁</span><div><b>Dalam proses</b><small>Verifikasi oleh petugas BWS</small></div></div><div className="orb orb-one"/><div className="orb orb-two"/></div></section>
    </ScrollAnimation>
    <section className="section soft-section"><ScrollAnimation><div className="section-intro centered"><span className="eyebrow">KENAPA SAPA</span><h2>Administrasi surat yang terasa lebih sederhana.</h2><p>Seluruh proses dirancang jelas dari pengajuan hingga surat selesai diproses.</p></div></ScrollAnimation>        <div className="benefit-grid">
          <ScrollAnimation delay={100}>
            <article className="benefit-card">
              <span className="feature-icon blue">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>
              </span>
              <h3>Ajukan secara online</h3>
              <p>Isi data dan unggah dokumen dari mana saja tanpa harus datang ke kantor.</p>
            </article>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <article className="benefit-card">
              <span className="feature-icon gold">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <h3>Lacak status real-time</h3>
              <p>Ketahui tahapan permohonan melalui kode resi yang diterima.</p>
            </article>
          </ScrollAnimation>
          <ScrollAnimation delay={300}>
            <article className="benefit-card">
              <span className="feature-icon green">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <h3>Proses transparan</h3>
              <p>Setiap perubahan status terdokumentasi agar proses lebih akuntabel.</p>
            </article>
          </ScrollAnimation>
        </div></section>
    <section className="section workflow-section"><ScrollAnimation><div className="section-intro"><span className="eyebrow">CARA KERJA SAPA</span><h2>Empat langkah menuju permohonan selesai.</h2></div></ScrollAnimation><div className="workflow-grid">{steps.map(([number, title, description], index) => <ScrollAnimation key={number} delay={index * 150}><article className="step"><span>{number}</span><h3>{title}</h3><p>{description}</p></article></ScrollAnimation>)}</div></section>
    <ScrollAnimation direction="up"><section className="cta-section"><div><span className="eyebrow light">MULAI SEKARANG</span><h2>Siap mengajukan permohonan?</h2><p>Buat permohonan pertama Anda secara cepat dan terarah.</p></div><Link className="button button-gold" href="/ajukan-surat">Mulai ajukan surat <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></Link></section></ScrollAnimation><footer className="site-footer"><div><span className="sapa-mark small">S</span><b>SAPA</b></div><p>Sistem Administrasi Permohonan Antar Instansi · BWS Bali Penida</p></footer>
  </main>;
}
