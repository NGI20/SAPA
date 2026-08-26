"use client";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { STATUS_LABELS, formatDate, statusClass } from "@/lib/submission-utils";

export type HistorySubmission = { id: string; receiptCode: string; applicantName: string; applicantEmail: string; applicantPhone: string; institution: string | null; jobTitle: string | null; address: string | null; category: string; subject: string; documentName: string | null; documentUrl: string | null; status: string; createdAt: string; statusLogs: { id: string; status: string; note: string | null; createdAt: string }[] };
const statusOptions = ["", "MENUNGGU_VERIFIKASI", "DIPROSES", "DISETUJUI", "DITOLAK", "SELESAI"];
export function HistoryTable({ submissions }: { submissions: HistorySubmission[] }) { const [query, setQuery] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1); const [selected, setSelected] = useState<HistorySubmission | null>(null); const perPage = 5; const filtered = useMemo(() => submissions.filter(item => `${item.receiptCode} ${item.institution || ""}`.toLowerCase().includes(query.toLowerCase()) && (!status || item.status === status)), [submissions, query, status]); const pages = Math.max(1, Math.ceil(filtered.length / perPage)); const visible = filtered.slice((page - 1) * perPage, page * perPage); function changeFilter(value: string) { setStatus(value); setPage(1); }
  return <><div className="history-card"><div className="table-tools"><div><h2>Riwayat permohonan</h2><p>Data ini hanya menampilkan permohonan yang terhubung dengan akun Anda.</p></div><div className="table-filters"><input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} aria-label="Cari riwayat surat" placeholder="Cari kode resi atau instansi" /><select aria-label="Filter status" value={status} onChange={e => changeFilter(e.target.value)}>{statusOptions.map(option => <option value={option} key={option}>{option ? STATUS_LABELS[option] : "Semua status"}</option>)}</select></div></div>{visible.length ? <><div className="table-wrap"><table><thead><tr><th>Kode resi</th><th>Instansi tujuan</th><th>Kategori</th><th>Tanggal pengajuan</th><th>Status</th><th></th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td>{item.receiptCode}</td><td>{item.institution || "Pemohon perseorangan"}</td><td>{item.category}</td><td>{formatDate(item.createdAt)}</td><td><span className={`status ${statusClass(item.status)}`}>{STATUS_LABELS[item.status]}</span></td><td><button className="table-link" onClick={() => setSelected(item)}>Detail</button></td></tr>)}</tbody></table></div><div className="table-footer"><span>Menampilkan {visible.length} dari {filtered.length} permohonan</span><div><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>‹</button>{Array.from({ length: pages }, (_, index) => <button onClick={() => setPage(index + 1)} className={page === index + 1 ? "current" : ""} key={index}>{index + 1}</button>)}<button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>›</button></div></div></> : <div className="empty-state"><span>⌁</span><h3>{submissions.length ? "Tidak ada permohonan yang sesuai" : "Belum ada riwayat permohonan"}</h3><p>{submissions.length ? "Coba ubah kata kunci atau filter status Anda." : "Ajukan surat melalui SAPA, atau tambahkan pengajuan tamu menggunakan kode resi."}</p>{!submissions.length && <Link className="button button-primary" href="/ajukan-surat">Ajukan surat</Link>}</div>}</div>{selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}</>; }

function DetailModal({ item, onClose }: { item: HistorySubmission; onClose: () => void }) { 
  const isRejected = item.status === "DITOLAK";
  const rejectReason = isRejected ? item.statusLogs.at(-1)?.note || "Tidak ada alasan spesifik." : null;

  return (
    <div className="modal-backdrop">
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-title">
          <div><span className="eyebrow">DETAIL PERMOHONAN</span><h2 id="detail-title">{item.receiptCode}</h2></div>
          <button className="close-modal" onClick={onClose} aria-label="Tutup detail">×</button>
        </div>
        <span className={`status ${statusClass(item.status)}`}>{STATUS_LABELS[item.status]}</span>
        
        {isRejected && (
          <div className="rejected-reason-box">
            <b>Alasan Penolakan:</b>
            <p>{rejectReason}</p>
          </div>
        )}

        <div className="detail-grid">
          <div><small>Nama pemohon</small><b>{item.applicantName}</b></div>
          <div><small>Email</small><b>{item.applicantEmail}</b></div>
          <div><small>Nomor HP / WhatsApp</small><b>{item.applicantPhone}</b></div>
          <div><small>Instansi</small><b>{item.institution || "Pemohon perseorangan"}</b></div>
          <div><small>Jabatan</small><b>{item.jobTitle || "-"}</b></div>
          <div><small>Alamat</small><b>{item.address || "-"}</b></div>
          <div><small>Kategori surat</small><b>{item.category}</b></div>
          <div><small>Tanggal pengajuan</small><b>{formatDate(item.createdAt)}</b></div>
        </div>
        <div className="detail-message"><small>Isi atau maksud surat</small><p>{item.subject}</p></div>
        <div className="detail-document"><small>Dokumen pendukung</small>{item.documentUrl && item.documentName ? <a href={item.documentUrl} target="_blank">Unduh {item.documentName}</a> : <span>Dokumen tidak tersedia</span>}</div>
        <div className="detail-timeline"><h3>Riwayat status</h3>{item.statusLogs.map(log => <div key={log.id}><span></span><p><b>{STATUS_LABELS[log.status]}</b><small>{formatDate(log.createdAt)}{log.note ? ` · ${log.note}` : ""}</small></p></div>)}</div>
        <div className="modal-actions"><Link className="button button-primary" href={`/lacak-surat?resi=${encodeURIComponent(item.receiptCode)}`}>Lacak status</Link><button className="button button-ghost" onClick={onClose}>Tutup</button></div>
      </section>
    </div>
  );
}

export function ClaimSubmission() { const [receiptCode, setReceiptCode] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false); async function claim(event: FormEvent) { event.preventDefault(); setLoading(true); setMessage(""); const response = await fetch("/api/submissions/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiptCode }) }); const data = await response.json(); setLoading(false); if (!response.ok) return setMessage(data.error || "Pengajuan belum dapat ditambahkan."); window.location.reload(); }
  return <form className="claim-card" onSubmit={claim}><div><b>Punya pengajuan tanpa akun?</b><p>Tambahkan ke riwayat menggunakan kode resi. Email akun harus sama dengan email saat mengajukan.</p></div><div><input value={receiptCode} onChange={e => setReceiptCode(e.target.value)} placeholder="Masukkan kode resi" /><button className="button button-ghost" disabled={loading}>{loading ? "Memeriksa..." : "Tambahkan"}</button></div>{message && <small className="claim-error">{message}</small>}</form>; }

export function LogoutButton() { const [loading, setLoading] = useState(false); async function logout() { setLoading(true); await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; } return <button className="logout-button" onClick={logout} disabled={loading}>{loading ? "Keluar..." : "Keluar"}</button>; }
