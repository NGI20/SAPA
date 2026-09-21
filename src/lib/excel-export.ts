import ExcelJS from "exceljs";
import { format } from "date-fns";

export interface ExportSubmission {
  id: string;
  receiptCode: string;
  applicantName: string;
  institution: string | null;
  category: string;
  subject: string;
  status: string;
  createdAt: string;
}

export function getCategoryClassification(cat: string) {
  const c = (cat || "").toLowerCase();
  if (c.includes("rekomendasi")) return { group: "HUKUM", code: "HK 0101", sifat: "Terbatas" };
  if (c.includes("data")) return { group: "PENGELOLAAN DATA", code: "PA 0101", sifat: "Biasa/ Umum/ Terbuka" };
  if (c.includes("izin")) return { group: "SUMBER DAYA AIR", code: "SA 0404", sifat: "Terbatas" };
  if (c.includes("kerja sama") || c.includes("kerjasama")) return { group: "HUBUNGAN KERJASAMA", code: "KS 0201", sifat: "Biasa/ Umum/ Terbuka" };
  return { group: "UMUM", code: "UM 0102", sifat: "Biasa/ Umum/ Terbuka" };
}

export async function generateSuratMasukExcelBuffer(submissions: ExportSubmission[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SAPA BWS Bali Penida";
  wb.lastModifiedBy = "SAPA";
  wb.created = new Date();
  wb.modified = new Date();

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } }
  };

  // ==========================================
  // SHEET 1: Laporan Format Tabel
  // ==========================================
  const ws1 = wb.addWorksheet("Laporan Format Tabel", {
    views: [{ showGridLines: true }]
  });

  // Column Widths matching Surat Masuk 2025
  ws1.columns = [
    { key: "noBerkas", width: 10 },
    { key: "noItem", width: 12 },
    { key: "kodeKlasifikasi", width: 18 },
    { key: "uraian", width: 55 },
    { key: "tanggal", width: 18 },
    { key: "jumlah", width: 14 },
    { key: "keterangan", width: 14 },
    { key: "akses", width: 35 }
  ];

  // Row 1: Table 1
  ws1.mergeCells("A1:H1");
  const r1 = ws1.getCell("A1");
  r1.value = "Table 1";
  r1.font = { name: "Calibri", size: 11, bold: false };
  r1.alignment = { horizontal: "center", vertical: "middle" };

  // Row 2: Laporan Surat Masuk (Gray Header)
  ws1.mergeCells("A2:H2");
  const r2 = ws1.getCell("A2");
  r2.value = "Laporan Surat Masuk";
  r2.font = { name: "Calibri", size: 11, bold: true };
  r2.alignment = { horizontal: "center", vertical: "middle" };
  r2.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9D9D9" }
  };
  r2.border = thinBorder;
  ws1.getRow(2).height = 24;

  // Row 3: Empty

  // Row 4: Table Headers
  const headerValues = [
    "NO BERKAS",
    "NO ITEM SURAT",
    "KODE KLASIFIKASI",
    "URAIAN INFORMASI",
    "TANGGAL",
    "JUMLAH",
    "KETERANGAN",
    "KLASIFIKASI KEAMANAN DAN AKSES ARSIP DINAMIS"
  ];
  const hRow = ws1.getRow(4);
  hRow.height = 28;
  headerValues.forEach((val, idx) => {
    const cell = hRow.getCell(idx + 1);
    cell.value = val;
    cell.font = { name: "Calibri", size: 9.5, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" }
    };
  });

  // Group Submissions by Category
  const grouped: Record<string, ExportSubmission[]> = {};
  submissions.forEach(sub => {
    const { group } = getCategoryClassification(sub.category);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(sub);
  });

  let currentRowIdx = 5;
  let globalBerkasNo = 1;

  Object.entries(grouped).forEach(([groupName, items]) => {
    // Category Header Row (e.g. HUKUM)
    ws1.mergeCells(`A${currentRowIdx}:H${currentRowIdx}`);
    const catCell = ws1.getCell(`A${currentRowIdx}`);
    catCell.value = groupName;
    catCell.font = { name: "Calibri", size: 10, bold: true };
    catCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    catCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF9FAFB" }
    };
    catCell.border = thinBorder;
    ws1.getRow(currentRowIdx).height = 20;
    currentRowIdx++;

    const startItemRow = currentRowIdx;
    const { code, sifat } = getCategoryClassification(items[0]?.category || "");

    items.forEach((item, itemIdx) => {
      const row = ws1.getRow(currentRowIdx);
      row.height = 36;

      // NO BERKAS
      const c1 = row.getCell(1);
      c1.value = itemIdx === 0 ? globalBerkasNo : null;
      c1.alignment = { horizontal: "center", vertical: "middle" };
      c1.border = thinBorder;
      c1.font = { name: "Calibri", size: 10 };

      // NO ITEM SURAT
      const c2 = row.getCell(2);
      c2.value = itemIdx + 1;
      c2.alignment = { horizontal: "center", vertical: "middle" };
      c2.border = thinBorder;
      c2.font = { name: "Calibri", size: 10 };

      // KODE KLASIFIKASI
      const c3 = row.getCell(3);
      c3.value = itemIdx === 0 ? code : null;
      c3.alignment = { horizontal: "center", vertical: "middle" };
      c3.border = thinBorder;
      c3.font = { name: "Calibri", size: 10, bold: true };

      // URAIAN INFORMASI
      const c4 = row.getCell(4);
      c4.value = `${item.subject}\n(Pengirim: ${item.applicantName}, ${item.institution || "Perseorangan"})`;
      c4.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      c4.border = thinBorder;
      c4.font = { name: "Calibri", size: 9.5 };

      // TANGGAL
      const c5 = row.getCell(5);
      c5.value = format(new Date(item.createdAt), "dd MMMM yyyy");
      c5.alignment = { horizontal: "center", vertical: "middle" };
      c5.border = thinBorder;
      c5.font = { name: "Calibri", size: 9.5 };

      // JUMLAH
      const c6 = row.getCell(6);
      c6.value = "1 berkas";
      c6.alignment = { horizontal: "center", vertical: "middle" };
      c6.border = thinBorder;
      c6.font = { name: "Calibri", size: 9.5 };

      // KETERANGAN
      const c7 = row.getCell(7);
      c7.value = item.status === "DISETUJUI" ? "Asli" : item.status;
      c7.alignment = { horizontal: "center", vertical: "middle" };
      c7.border = thinBorder;
      c7.font = { name: "Calibri", size: 9.5 };

      // KLASIFIKASI KEAMANAN DAN AKSES ARSIP DINAMIS
      const c8 = row.getCell(8);
      c8.value = itemIdx === 0 ? sifat : null;
      c8.alignment = { horizontal: "center", vertical: "middle" };
      c8.border = thinBorder;
      c8.font = { name: "Calibri", size: 9.5 };

      currentRowIdx++;
    });

    // Merge group vertical cells for No Berkas, Kode Klasifikasi, Akses if more than 1 item
    if (items.length > 1) {
      const endItemRow = currentRowIdx - 1;
      ws1.mergeCells(`A${startItemRow}:A${endItemRow}`);
      ws1.mergeCells(`C${startItemRow}:C${endItemRow}`);
      ws1.mergeCells(`H${startItemRow}:H${endItemRow}`);
    }

    globalBerkasNo++;
  });

  // ==========================================
  // SHEET 2: Pencarian & Slicer Data
  // ==========================================
  const ws2 = wb.addWorksheet("Pencarian & Slicer Data", {
    views: [{ showGridLines: true }]
  });

  ws2.columns = [
    { key: "no", width: 8 },
    { key: "kategori", width: 32 },
    { key: "kode", width: 18 },
    { key: "uraian", width: 65 },
    { key: "tanggal", width: 18 },
    { key: "jumlah", width: 14 },
    { key: "keterangan", width: 14 },
    { key: "akses", width: 28 },
    { key: "nomorAsli", width: 45 }
  ];

  // Row 1 Title
  const s2r1 = ws2.getCell("A1");
  s2r1.value = "DATABASE SURAT MASUK 2025 (BISA PAKAI SLICER & FILTER)";
  s2r1.font = { name: "Calibri", size: 11, bold: true };

  // Row 2 Tips
  const s2r2 = ws2.getCell("A2");
  s2r2.value = "Tips: Klik sembarang sel di tabel bawah, lalu di menu Excel klik Insert -> Slicer untuk filter tombol visual!";
  s2r2.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF555555" } };

  // Row 4 Table Headers with Rich Blue Style
  const s2Headers = [
    "No",
    "Kategori",
    "Kode Klasifikasi",
    "Uraian Informasi",
    "Tanggal",
    "Jumlah",
    "Keterangan",
    "Sifat / Akses Keamanan",
    "Nomor & Tanggal Surat Asli"
  ];

  const s2hRow = ws2.getRow(4);
  s2hRow.height = 26;
  s2Headers.forEach((h, i) => {
    const c = s2hRow.getCell(i + 1);
    c.value = h;
    c.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2F5597" } // Professional Deep Blue
    };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = thinBorder;
  });

  // Enable AutoFilter on Database Table
  ws2.autoFilter = {
    from: "A4",
    to: `I${Math.max(5, submissions.length + 4)}`
  };

  submissions.forEach((sub, idx) => {
    const { group, code, sifat } = getCategoryClassification(sub.category);
    const row = ws2.getRow(idx + 5);
    row.height = 24;

    const values = [
      idx + 1,
      group,
      code,
      sub.subject,
      format(new Date(sub.createdAt), "dd MMMM yyyy"),
      "1 berkas",
      sub.status === "DISETUJUI" ? "Asli" : sub.status,
      sifat,
      `${sub.receiptCode} - ${format(new Date(sub.createdAt), "yyyy-MM-dd HH:mm:ss")}`
    ];

    values.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: "Calibri", size: 9.5 };
      cell.border = thinBorder;
      if (cIdx === 0 || cIdx === 2 || cIdx === 4 || cIdx === 5 || cIdx === 6 || cIdx === 7) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
