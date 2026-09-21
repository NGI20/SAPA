import jsPDF from "jspdf";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface LetterParams {
  receiptCode: string;
  nomorSurat: string;
  sifat: string;
  lampiran: string;
  perihal: string;
  tanggalSurat: string;
  applicantName: string;
  institution: string | null;
  isiSurat: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  penandatanganNip: string;
  tembusan?: string;
}

export function generateOfficialLetterPdf(params: LetterParams): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const leftMargin = 20;
  const rightMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // 1. KOP SURAT RESMI BWS BALI PENIDA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KEMENTERIAN PEKERJAAN UMUM", pageWidth / 2, 14, { align: "center" });
  doc.setFontSize(11);
  doc.text("DIREKTORAT JENDERAL SUMBER DAYA AIR", pageWidth / 2, 19, { align: "center" });
  doc.setFontSize(12);
  doc.text("BALAI WILAYAH SUNGAI BALI PENIDA", pageWidth / 2, 24, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Jalan Kapten Cok Agung Tresna No. 9 Panjer, Denpasar Selatan, Bali 80234", pageWidth / 2, 28, { align: "center" });
  doc.text("Telepon: (0361) 222387 | Pos-el: bws.balipenida@pu.go.id | Laman: sapa.bwsbalipenida.go.id", pageWidth / 2, 32, { align: "center" });

  // Double Line Separator
  doc.setLineWidth(0.6);
  doc.line(leftMargin, 35, pageWidth - rightMargin, 35);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, 36, pageWidth - rightMargin, 36);

  // 2. TANGGAL & TUJUAN SURAT (Sisi Kanan)
  let y = 44;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const tglText = params.tanggalSurat 
    ? `Denpasar, ${format(new Date(params.tanggalSurat), "d MMMM yyyy", { locale: id })}`
    : `Denpasar, ${format(new Date(), "d MMMM yyyy", { locale: id })}`;

  doc.text(tglText, 130, y);

  // METADATA SURAT (Sisi Kiri)
  doc.text("Nomor", leftMargin, y);
  doc.text(`: ${params.nomorSurat || "-"}`, leftMargin + 22, y);

  y += 5;
  doc.text("Sifat", leftMargin, y);
  doc.text(`: ${params.sifat || "Penting / Segera"}`, leftMargin + 22, y);

  y += 5;
  doc.text("Lampiran", leftMargin, y);
  doc.text(`: ${params.lampiran || "1 (satu) Berkas"}`, leftMargin + 22, y);

  y += 5;
  doc.text("Perihal", leftMargin, y);
  doc.setFont("helvetica", "bold");
  const halLines = doc.splitTextToSize(`: ${params.perihal || "Persetujuan / Rekomendasi Teknis"}`, 75);
  doc.text(halLines, leftMargin + 22, y);
  doc.setFont("helvetica", "normal");

  // KEPADA YTH (Sisi Kanan)
  let yKanan = 50;
  doc.text("Kepada Yth.", 130, yKanan);
  yKanan += 5;
  doc.setFont("helvetica", "bold");
  doc.text(params.applicantName || "Pemohon", 130, yKanan);
  doc.setFont("helvetica", "normal");
  yKanan += 5;
  doc.text(params.institution || "Di Tempat", 130, yKanan);
  yKanan += 5;
  doc.text("di -", 130, yKanan);
  yKanan += 5;
  doc.text("      Tempat", 130, yKanan);

  // Geser posisi vertikal ke bawah setelah metadata & tujuan
  y = Math.max(y + (halLines.length * 5) + 6, yKanan + 8);

  // 3. ISI SURAT (Body Text)
  const defaultBody = params.isiSurat || 
`Menindaklanjuti permohonan Saudara dengan nomor resi ${params.receiptCode}, setelah dilakukan penelaahan teknis dan kelengkapan administrasi oleh tim Balai Wilayah Sungai Bali Penida, bersama ini disampaikan bahwa Balai Wilayah Sungai Bali Penida menyatakan MENYETUJUI dan MEMBERIKAN REKOMENDASI atas permohonan yang diajukan.

Pelaksanaan rekomendasi ini wajib mematuhi ketentuan perundang-undangan pengelolaan sumber daya air yang berlaku serta arahan teknis dari Balai Wilayah Sungai Bali Penida.

Demikian surat persetujuan dan rekomendasi ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya diucapkan terima kasih.`;

  const bodyParagraphs = defaultBody.split("\n");
  bodyParagraphs.forEach((p) => {
    const trimmed = p.trim();
    if (!trimmed) {
      y += 4;
      return;
    }
    const lines = doc.splitTextToSize(trimmed, contentWidth);
    doc.text(lines, leftMargin, y);
    y += lines.length * 5 + 3;
  });

  // 4. BAGIAN TANDA TANGAN (Sisi Kanan Bawah)
  y = Math.max(y + 8, 205);

  const signX = 125;
  doc.setFont("helvetica", "normal");
  doc.text("Balai Wilayah Sungai Bali Penida", signX, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(params.penandatanganJabatan || "Kepala Balai,", signX, y);

  // Kotak Digital Signature / Barcode Stamp
  y += 6;
  doc.setDrawColor(8, 104, 169);
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(signX, y, 65, 20, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setTextColor(8, 104, 169);
  doc.setFont("helvetica", "bold");
  doc.text("DITANDATANGANI SECARA ELEKTRONIK", signX + 32.5, y + 5, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Sistem Administrasi SAPA BWS`, signX + 32.5, y + 10, { align: "center" });
  doc.text(`Kode Validasi: ${params.receiptCode}`, signX + 32.5, y + 15, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9.5);

  y += 25;
  doc.setFont("helvetica", "bold");
  doc.text(params.penandatanganNama || "Ir. I Komang Swastika, S.T., M.T.", signX, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${params.penandatanganNip || "197204121998031004"}`, signX, y);

  // 5. TEMBUSAN (Sisi Kiri Bawah)
  let tembusanY = 230;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Tembusan Yth:", leftMargin, tembusanY);
  doc.setFont("helvetica", "normal");
  tembusanY += 4;
  doc.text("1. Kepala Balai Wilayah Sungai Bali Penida (sebagai laporan);", leftMargin, tembusanY);
  tembusanY += 4;
  doc.text("2. Kasubag Umum & Tata Usaha BWS Bali Penida;", leftMargin, tembusanY);
  tembusanY += 4;
  doc.text("3. Pertinggal / Arsip.", leftMargin, tembusanY);

  // Footer Keabsahan
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dokumen resmi ini diterbitkan secara sah melalui SAPA (Sistem Administrasi Permohonan Antar Instansi) BWS Bali Penida.`,
    pageWidth / 2,
    285,
    { align: "center" }
  );

  return doc;
}
