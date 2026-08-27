"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, formatDate, statusClass } from "@/lib/submission-utils";
import { submitRevision } from "@/app/riwayat-surat/actions";

export type HistorySubmission = {
  id: string;
  receiptCode: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  institution: string | null;
  category: string;
  subject: string;
  documentName: string | null;
  documentUrl: string | null;
  status: string;
  catatanStaf: string | null;
  createdAt: string;
  statusLogs: { id: string; status: string; note: string | null; createdAt: string }[];
};

const statusOptions = ["", "MENUNGGU", "PERLU_REVISI", "DITERUSKAN", "DISETUJUI", "DITOLAK"];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      <span className="status-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function HistoryTable({ submissions }: { submissions: HistorySubmission[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HistorySubmission | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<HistorySubmission | null>(null);
  const perPage = 5;

  const filtered = useMemo(
    () =>
      submissions.filter(
        (item) =>
          `${item.receiptCode} ${item.institution || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) && (!status || item.status === status)
      ),
    [submissions, query, status]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <div className="history-card">
        <div className="table-tools">
          <div>
            <h2>Riwayat permohonan</h2>
            <p>Data ini hanya menampilkan permohonan yang terhubung dengan akun Anda.</p>
          </div>
          <div className="table-filters">
            <div className="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                aria-label="Cari riwayat surat"
                placeholder="Cari kode resi atau instansi"
              />
            </div>
            <div className="select-wrap">
              <select
                aria-label="Filter status"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                {statusOptions.map((option) => (
                  <option value={option} key={option}>
                    {option ? STATUS_LABELS[option] : "Semua status"}
                  </option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {visible.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode resi</th>
                    <th>Instansi Asal</th>
                    <th>Kategori</th>
                    <th>Tanggal pengajuan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td><span className="resi-code">{item.receiptCode}</span></td>
                      <td>{item.institution || "Perseorangan"}</td>
                      <td>{item.category}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button className="detail-btn" onClick={() => setSelected(item)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Detail
                          </button>
                          {item.status === "PERLU_REVISI" && (
                            <button className="detail-btn revisi-btn" onClick={() => setRevisionTarget(item)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Revisi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Menampilkan {visible.length} dari {filtered.length} permohonan</span>
              <div className="pagination">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    onClick={() => setPage(i + 1)}
                    className={page === i + 1 ? "current" : ""}
                    key={i}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>›</button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3>{submissions.length ? "Tidak ada permohonan yang sesuai" : "Belum ada riwayat permohonan"}</h3>
            <p>
              {submissions.length
                ? "Coba ubah kata kunci atau filter status Anda."
                : "Ajukan surat melalui SAPA, atau tambahkan pengajuan tamu menggunakan kode resi."}
            </p>
            {!submissions.length && (
              <Link className="button button-primary" href="/ajukan-surat">Ajukan surat</Link>
            )}
          </div>
        )}
      </div>

      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} onRevise={(item) => { setSelected(null); setRevisionTarget(item); }} />}
      {revisionTarget && <RevisionModal item={revisionTarget} onClose={() => setRevisionTarget(null)} />}
    </>
  );
}

function DetailModal({ item, onClose, onRevise }: { item: HistorySubmission; onClose: () => void; onRevise: (item: HistorySubmission) => void }) {
  const lastLog = item.statusLogs.length ? item.statusLogs[item.statusLogs.length - 1] : null;
  const revisiLog = item.statusLogs.find(l => l.status === "PERLU_REVISI");

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="detail-modal" role="dialog" aria-modal="true">
        <div className="modal-top">
          <div>
            <span className="eyebrow">DETAIL PERMOHONAN</span>
            <h2>{item.receiptCode}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <StatusBadge status={item.status} />

        {item.status === "DITOLAK" && lastLog?.note && (
          <div className="reject-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <div>
              <b>Alasan penolakan</b>
              <p>{lastLog.note}</p>
            </div>
          </div>
        )}

        {item.status === "PERLU_REVISI" && (
          <div className="revise-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <b>Catatan dari Staf</b>
              <p>{item.catatanStaf || revisiLog?.note || "Dokumen perlu diperbaiki. Silakan unggah dokumen baru."}</p>
            </div>
          </div>
        )}

        <div className="detail-grid">
          <div><small>Nama pemohon</small><b>{item.applicantName}</b></div>
          <div><small>Email</small><b>{item.applicantEmail}</b></div>
          <div><small>Nomor HP / WhatsApp</small><b>{item.applicantPhone}</b></div>
          <div><small>Instansi</small><b>{item.institution || "Perseorangan"}</b></div>
          <div><small>Kategori surat</small><b>{item.category}</b></div>
          <div><small>Tanggal pengajuan</small><b>{formatDate(item.createdAt)}</b></div>
        </div>

        <div className="detail-subject">
          <small>Isi atau maksud surat</small>
          <p>{item.subject}</p>
        </div>

        <div className="detail-doc">
          <small>Dokumen pendukung</small>
          {item.documentUrl && item.documentName ? (
            <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {item.documentName}
            </a>
          ) : (
            <span className="no-doc">Tidak tersedia</span>
          )}
        </div>

        <div className="detail-timeline">
          <h3>Riwayat status</h3>
          <div className="timeline-list">
            {item.statusLogs.map((log, i) => (
              <div className={`tl-item ${i === item.statusLogs.length - 1 ? "latest" : ""}`} key={log.id}>
                <div className="tl-dot" />
                <div>
                  <b>{STATUS_LABELS[log.status] || log.status}</b>
                  <small>{formatDate(log.createdAt)}{log.note ? ` · ${log.note}` : ""}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          {item.status === "PERLU_REVISI" && (
            <button className="button button-gold" onClick={() => onRevise(item)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Revisi Dokumen
            </button>
          )}
          <Link className="button button-primary" href={`/lacak-surat?resi=${encodeURIComponent(item.receiptCode)}`}>Lacak status</Link>
          <button className="button button-ghost" onClick={onClose}>Tutup</button>
        </div>
      </section>
    </div>
  );
}

function RevisionModal({ item, onClose }: { item: HistorySubmission; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const revisiLog = item.statusLogs.find(l => l.status === "PERLU_REVISI");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Pilih file PDF terlebih dahulu.");
    if (file.type !== "application/pdf") return setError("Format file harus PDF.");
    if (file.size > 5 * 1024 * 1024) return setError("Ukuran file maksimal 5 MB.");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("receiptCode", item.receiptCode);
      fd.set("file", file);
      await submitRevision(fd);
      setSuccess(true);
      setTimeout(() => { onClose(); router.refresh(); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah dokumen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="detail-modal revision-modal" role="dialog" aria-modal="true">
        <div className="modal-top">
          <div>
            <span className="eyebrow">REVISI DOKUMEN</span>
            <h2>{item.receiptCode}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="revise-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <b>Catatan dari Staf</b>
            <p>{item.catatanStaf || revisiLog?.note || "Dokumen perlu diperbaiki. Silakan unggah dokumen pengganti."}</p>
          </div>
        </div>

        {success ? (
          <div className="revision-success">
            <div className="success-icon-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3>Dokumen berhasil dikirim ulang!</h3>
            <p>Status permohonan Anda telah diubah kembali ke <b>Menunggu</b>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="revision-form">
            <div className="revision-upload-area">
              <label htmlFor="revision-file" className="upload-label">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>{fileName || "Klik untuk memilih file PDF"}</span>
                <small>Maksimal 5 MB · Format PDF</small>
              </label>
              <input
                ref={fileRef}
                id="revision-file"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
              />
            </div>
            {error && <p className="form-note error-note">{error}</p>}
            <div className="modal-actions">
              <button className="button button-primary" type="submit" disabled={loading}>
                {loading ? "Mengunggah..." : "Kirim Ulang"}
              </button>
              <button className="button button-ghost" type="button" onClick={onClose}>Batal</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export function ClaimSubmission() {
  const [open, setOpen] = useState(false);
  const [receiptCode, setReceiptCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function claim(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const response = await fetch("/api/submissions/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptCode }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.error || "Pengajuan belum dapat ditambahkan.");
    setSuccess(true);
    setMessage("Pengajuan berhasil ditambahkan ke riwayat Anda.");
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="claim-section">
      <button className="claim-toggle" onClick={() => setOpen(!open)}>
        <div className="claim-toggle-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Punya pengajuan tanpa akun? <b>Tambahkan ke riwayat</b></span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: open ? 'rotate(180deg)' : 'none', transition: '.2s'}}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <form className="claim-form" onSubmit={claim}>
          <p>Masukkan kode resi pengajuan Anda. Email akun harus sama dengan email saat mengajukan.</p>
          <div className="claim-input-row">
            <input
              value={receiptCode}
              onChange={(e) => setReceiptCode(e.target.value)}
              placeholder="Contoh: SAPA/REKOMENDASI/2026/G82A/001"
            />
            <button className="button button-primary" disabled={loading} type="submit">
              {loading ? "Memeriksa..." : "Tambahkan"}
            </button>
          </div>
          {message && (
            <p className={`claim-msg ${success ? "success" : "error"}`}>{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
