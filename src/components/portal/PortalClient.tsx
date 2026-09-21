"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, FileCheck, History, BarChart3, Users, Settings,
  LogOut, Bell, Search, Download, CheckCircle2, XCircle, FileText,
  Lock, User as UserIcon, Mail, Phone, Key, Camera, ExternalLink,
  AlertCircle, Menu, X, ArrowRight, Printer, RefreshCw, AlertTriangle, Clock,
  NotebookPen, FileUp, Eye
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AvatarCropperModal from "@/components/AvatarCropperModal";
import { generateOfficialLetterPdf } from "@/lib/pdf-letter";
import { 
  submitDecision, uploadResponseFile, saveGeneratedResponsePdf, uploadAvatarBase64, addInternalUser, 
  updateUserRole, blockUser, unblockUser, deleteUser, updateProfile 
} from "@/app/portal/actions";

type Submission = {
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
  responseDocUrl?: string | null;
  responseDocName?: string | null;
  responseNomor?: string | null;
  internalNote?: string | null;
  status: string;
  catatanStaf: string | null;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  phone: string | null;
  institution?: string | null;
  nip?: string | null;
  avatarUrl?: string | null;
  role: string;
  status?: string;
};

interface PortalClientProps {
  currentUser: { 
    id: string; 
    name: string; 
    email: string; 
    role: string; 
    isBlocked: boolean;
    phone?: string;
    institution?: string;
    nip?: string;
    avatarUrl?: string;
  };
  initialSubmissions: Submission[];
  initialUsers: User[];
  initialActivities: { id: string, detail: string | null, createdAt: string, [key: string]: unknown }[];
}

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "verifikasi", label: "Verifikasi Substansi", icon: FileCheck },
  { id: "riwayat", label: "Riwayat Keputusan", icon: History },
  { id: "laporan", label: "Laporan Analitik", icon: BarChart3 },
  { id: "users", label: "User Management", icon: Users },
];

const COLORS = ['#0868a9', '#f4b81a', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function getCleanDocUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("[")) {
    try {
      const arr = JSON.parse(url);
      if (Array.isArray(arr) && arr.length > 0) return String(arr[0]);
    } catch {
      return url;
    }
  }
  return url;
}

function getCleanDocName(name: string | null | undefined): string {
  if (!name) return "Dokumen PDF";
  if (name.startsWith("[")) {
    try {
      const arr = JSON.parse(name);
      if (Array.isArray(arr) && arr.length > 0) return String(arr[0]);
    } catch {
      return name;
    }
  }
  return name;
}

export default function PortalClient({ currentUser, initialSubmissions, initialUsers }: PortalClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // User Action Modals State with Reasons
  const [selectedActionUser, setSelectedActionUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Add User Form State
  const [addUserName, setAddUserName] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [addUserRole, setAddUserRole] = useState("STAFF");
  const [addUserNip, setAddUserNip] = useState("");
  const [addUserPhone, setAddUserPhone] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Avatar Cropper State
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    nip: currentUser.nip || "",
    institution: currentUser.institution || (currentUser.role === "ADMIN" ? "Balai Wilayah Sungai Bali Penida" : "Tata Usaha BWS Bali Penida"),
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // States for Decision / Verification Modal
  const [selectedDoc, setSelectedDoc] = useState<Submission | null>(null);
  const [selectedDocMode, setSelectedDocMode] = useState<"edit" | "view">("edit");
  const [decision, setDecision] = useState<"DISETUJUI" | "DITOLAK" | "DITERUSKAN" | "PERLU_REVISI" | null>(null);
  const [publicNote, setPublicNote] = useState("");
  const [internalNote, setInternalNote] = useState("");

  // States for Surat Balasan Resmi (Editable PDF Template)
  const [responseNomor, setResponseNomor] = useState("");
  const [responseSifat, setResponseSifat] = useState("Penting / Segera");
  const [responseLampiran, setResponseLampiran] = useState("1 (satu) Berkas");
  const [responsePerihal, setResponsePerihal] = useState("");
  const [responseIsi, setResponseIsi] = useState("");
  const [responsePenandatangan, setResponsePenandatangan] = useState("Kepala Balai Wilayah Sungai Bali Penida");
  const [responsePenandatanganNama, setResponsePenandatanganNama] = useState("Ir. I Komang Swastika, S.T., M.T.");
  const [responsePenandatanganNip, setResponsePenandatanganNip] = useState("197204121998031004");
  const [useCustomUpload, setUseCustomUpload] = useState(false);
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const responseFileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Laporan Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa format gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropperImageSrc(null);
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatarBase64(croppedDataUrl);
      setCurrentAvatarUrl(res.url);
      alert("Foto profil berhasil diperbarui!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan foto profil.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert("Konfirmasi kata sandi baru tidak sama.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        nip: profileForm.nip,
        institution: profileForm.institution,
        password: newPassword.trim() ? newPassword : undefined,
        avatarUrl: currentAvatarUrl || undefined
      });
      alert("Pengaturan profil berhasil disimpan!");
      setIsProfileModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui profil.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOpenDoc = (doc: Submission, mode: "edit" | "view" = "edit") => {
    setSelectedDoc(doc);
    setSelectedDocMode(doc.status === "PERLU_REVISI" ? "view" : mode);
    setDecision(null);
    setPublicNote(doc.catatanStaf || "");
    setInternalNote(doc.internalNote || "");
    
    // Auto-generate editable official response letter fields
    const smartYear = new Date().getFullYear();
    const lastPart = doc.receiptCode.split("/").pop() || "001";
    setResponseNomor(doc.responseNomor || `BWS.02/HK.01/${smartYear}/${lastPart}`);
    setResponseSifat("Penting / Segera");
    setResponseLampiran("1 (satu) Berkas");
    setResponsePerihal(`Persetujuan dan Rekomendasi Teknis atas Permohonan ${doc.category}`);
    setResponseIsi(
`Menindaklanjuti permohonan Saudara dengan nomor resi ${doc.receiptCode} perihal "${doc.subject}", setelah dilakukan penelaahan teknis dan kelengkapan administrasi oleh tim Balai Wilayah Sungai Bali Penida, bersama ini disampaikan bahwa Balai Wilayah Sungai Bali Penida menyatakan MENYETUJUI dan MEMBERIKAN REKOMENDASI atas permohonan yang diajukan dengan ketentuan sebagai berikut:

1. Pelaksanaan kegiatan wajib mematuhi seluruh peraturan perundang-undangan pengelolaan sumber daya air yang berlaku.
2. Rekomendasi teknis ini berlaku selama kegiatan berjalan sesuai dengan dokumen dan maksud usulan yang telah diverifikasi.
3. Pemohon wajib memberikan laporan pelaksanaan secara berkala kepada pihak Balai Wilayah Sungai Bali Penida.

Demikian surat persetujuan dan rekomendasi ini disampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya diucapkan terima kasih.`
    );
    setResponsePenandatangan("Kepala Balai Wilayah Sungai Bali Penida");
    setResponsePenandatanganNama("Ir. I Komang Swastika, S.T., M.T.");
    setResponsePenandatanganNip("197204121998031004");
    setUseCustomUpload(false);
    setResponseFile(null);
    setShowPdfPreview(false);
  };

  const handlePreviewOfficialLetter = () => {
    if (!selectedDoc) return;
    const docPdf = generateOfficialLetterPdf({
      receiptCode: selectedDoc.receiptCode,
      nomorSurat: responseNomor,
      sifat: responseSifat,
      lampiran: responseLampiran,
      perihal: responsePerihal,
      tanggalSurat: new Date().toISOString(),
      applicantName: selectedDoc.applicantName,
      institution: selectedDoc.institution,
      isiSurat: responseIsi,
      penandatanganJabatan: responsePenandatangan,
      penandatanganNama: responsePenandatanganNama,
      penandatanganNip: responsePenandatanganNip
    });
    const blob = docPdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  const handleSubmitDecision = async () => {
    if (!selectedDoc || !decision) return;
    if ((decision === "DITOLAK" || decision === "PERLU_REVISI") && !publicNote.trim()) {
      alert("Harap berikan catatan/alasan untuk pemohon.");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedDocUrl: string | undefined = undefined;
      let uploadedDocName: string | undefined = undefined;

      if (decision === "DISETUJUI") {
        if (useCustomUpload && responseFile) {
          const fd = new FormData();
          fd.set("file", responseFile);
          const res = await uploadResponseFile(fd);
          uploadedDocUrl = res.url;
          uploadedDocName = res.name;
        } else {
          // Generate official PDF directly from the edited letter fields!
          const docPdf = generateOfficialLetterPdf({
            receiptCode: selectedDoc.receiptCode,
            nomorSurat: responseNomor,
            sifat: responseSifat,
            lampiran: responseLampiran,
            perihal: responsePerihal,
            tanggalSurat: new Date().toISOString(),
            applicantName: selectedDoc.applicantName,
            institution: selectedDoc.institution,
            isiSurat: responseIsi,
            penandatanganJabatan: responsePenandatangan,
            penandatanganNama: responsePenandatanganNama,
            penandatanganNip: responsePenandatanganNip
          });
          const pdfBase64 = docPdf.output("datauristring");
          const res = await saveGeneratedResponsePdf(selectedDoc.receiptCode, pdfBase64);
          uploadedDocUrl = res.url;
          uploadedDocName = res.name;
        }
      }

      await submitDecision(
        selectedDoc.receiptCode,
        decision,
        publicNote,
        internalNote,
        responseNomor || undefined,
        uploadedDocUrl,
        uploadedDocName
      );

      setSubmissions(prev => prev.map(s => s.id === selectedDoc.id ? { 
        ...s, 
        status: decision,
        catatanStaf: publicNote || s.catatanStaf,
        internalNote: internalNote || s.internalNote,
        responseNomor: responseNomor || s.responseNomor,
        responseDocUrl: uploadedDocUrl || s.responseDocUrl,
        responseDocName: uploadedDocName || s.responseDocName
      } : s));

      setSelectedDoc(null);
      alert("Keputusan berhasil disimpan dan surat balasan resmi telah diterbitkan!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses keputusan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addInternalUser({
        name: addUserName,
        email: addUserEmail,
        password: addUserPassword,
        role: addUserRole,
        nip: addUserNip,
        phone: addUserPhone
      });
      setIsAddUserModalOpen(false);
      setAddUserName("");
      setAddUserEmail("");
      setAddUserPassword("");
      setAddUserNip("");
      setAddUserPhone("");
      alert("Pengguna internal baru berhasil ditambahkan!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan pengguna.");
    }
  };

  const handleEditRole = async () => {
    if (!selectedActionUser) return;
    setIsActionLoading(true);
    try {
      await updateUserRole(selectedActionUser.id, "ADMIN", actionReason);
      setIsRoleModalOpen(false);
      setActionReason("");
      alert("Role pengguna berhasil diperbarui menjadi ADMIN!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah role.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!selectedActionUser) return;
    setIsActionLoading(true);
    try {
      if (selectedActionUser.isBlocked) {
        await unblockUser(selectedActionUser.id, actionReason);
        alert("Blokir akun berhasil dibuka!");
      } else {
        await blockUser(selectedActionUser.id, actionReason);
        alert("Akun berhasil diblokir!");
      }
      setIsBlockModalOpen(false);
      setActionReason("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses status blokir.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedActionUser) return;
    setIsActionLoading(true);
    try {
      await deleteUser(selectedActionUser.id, actionReason);
      setIsDeleteModalOpen(false);
      setActionReason("");
      alert("Pengguna berhasil dihapus secara permanen!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus pengguna.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filtered submissions for tables & search
  const filteredSubmissions = submissions.filter(s => 
    s.receiptCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.institution && s.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingSubmissions = filteredSubmissions.filter(s => 
    currentUser.role === "STAFF" 
      ? (s.status === "MENUNGGU" || s.status === "PERLU_REVISI")
      : s.status === "DITERUSKAN"
  );

  const historySubmissions = filteredSubmissions.filter(s => 
    ["DISETUJUI", "DITOLAK", "DITERUSKAN"].includes(s.status)
  );

  // Filtered for Laporan Analitik
  const filteredForLaporan = submissions.filter(s => {
    if (!startDate && !endDate) return true;
    const itemDate = new Date(s.createdAt).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000) : Infinity;
    return itemDate >= start && itemDate <= end;
  });

  const totalMasuk = filteredForLaporan.length;
  const totalDisetujui = filteredForLaporan.filter(s => s.status === "DISETUJUI").length;
  const totalDitolak = filteredForLaporan.filter(s => s.status === "DITOLAK").length;
  const totalDiproses = filteredForLaporan.filter(s => ["MENUNGGU", "PERLU_REVISI", "DITERUSKAN"].includes(s.status)).length;

  const categoryCounts = filteredForLaporan.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }));

  const timelineData = filteredForLaporan.reduce((acc, curr) => {
    const dateKey = format(new Date(curr.createdAt), "dd MMM");
    const existing = acc.find(item => item.date === dateKey);
    if (existing) {
      existing.masuk += 1;
      if (curr.status === "DISETUJUI") existing.disetujui += 1;
      if (curr.status === "DITOLAK") existing.ditolak += 1;
    } else {
      acc.push({
        date: dateKey,
        masuk: 1,
        disetujui: curr.status === "DISETUJUI" ? 1 : 0,
        ditolak: curr.status === "DITOLAK" ? 1 : 0,
      });
    }
    return acc;
  }, [] as { date: string; masuk: number; disetujui: number; ditolak: number }[]).slice(-10);

  const summaryTable = Object.entries(categoryCounts).map(([cat, total]) => {
    const masuk = filteredForLaporan.filter(s => s.category === cat).length;
    const disetujui = filteredForLaporan.filter(s => s.category === cat && s.status === 'DISETUJUI').length;
    const ditolak = filteredForLaporan.filter(s => s.category === cat && s.status === 'DITOLAK').length;
    return { cat, masuk, disetujui, ditolak, total };
  });

  // Export Excel Function
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const response = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate })
      });

      if (!response.ok) throw new Error("Gagal mengunduh file Excel.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Surat Masuk 2025.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengexport file Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export PDF Function
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("KEMENTERIAN PEKERJAAN UMUM", 148.5, 12, { align: "center" });
    doc.text("DIREKTORAT JENDERAL SUMBER DAYA AIR - BALAI WILAYAH SUNGAI BALI PENIDA", 148.5, 17, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Kapten Cok Agung Tresna No. 9, Panjer, Denpasar Selatan, Bali 80234", 148.5, 21, { align: "center" });
    doc.setLineWidth(0.6);
    doc.line(14, 24, 283, 24);
    doc.setLineWidth(0.2);
    doc.line(14, 25, 283, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTER ARSIP SURAT MASUK (SISTEM SAPA)", 148.5, 32, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${startDate || 'Semua Data'} s/d ${endDate || 'Terkini'}  |  Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 148.5, 37, { align: "center" });

    const tableData = filteredForLaporan.map((sub, idx) => [
      idx + 1,
      sub.receiptCode,
      sub.category,
      sub.subject,
      `${sub.applicantName}\n(${sub.institution || 'Perseorangan'})`,
      format(new Date(sub.createdAt), "dd/MM/yyyy"),
      "1 berkas",
      sub.status === "DISETUJUI" ? `DISETUJUI\n${sub.responseNomor || ''}` : sub.status.replace(/_/g, " "),
      sub.category.includes("Rekomendasi") ? "Terbatas" : "Biasa"
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["NO", "KODE RESI", "KATEGORI", "PERIHAL SURAT", "PENGIRIM & INSTANSI", "TANGGAL", "JUMLAH", "STATUS", "AKSES"]],
      body: tableData,
      theme: "grid",
      headStyles: { 
        fillColor: [8, 104, 169], 
        textColor: [255, 255, 255], 
        fontSize: 8, 
        fontStyle: "bold",
        halign: "center",
        valign: "middle"
      },
      styles: { 
        fontSize: 7.5, 
        cellPadding: 2.5, 
        valign: "middle" 
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 34, fontStyle: "bold" },
        2: { cellWidth: 28 },
        3: { cellWidth: 62 },
        4: { cellWidth: 44 },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: 20, halign: "center" },
        7: { cellWidth: 28, halign: "center" },
        8: { cellWidth: 20, halign: "center" }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        doc.setFontSize(7);
        doc.text(`Halaman ${data.pageNumber}`, 283, 200, { align: "right" });
      }
    });

    const autoTableDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    const finalY = autoTableDoc.lastAutoTable?.finalY || 150;
    if (finalY < 170) {
      doc.setFontSize(8);
      doc.text("Mengetahui,", 230, finalY + 12);
      doc.text("Kasubag Umum & Tata Usaha BWS", 230, finalY + 16);
      doc.text("( ........................................................ )", 230, finalY + 34);
    }

    doc.save(`Laporan_Surat_Masuk_SAPA_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const renderProfileSettingsModal = () => {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-xl shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pengaturan Akun & Profil</h2>
            <p className="text-xs text-slate-500">
              {currentUser.role === "ADMIN" ? "Administrator Utama" : "Staf Tata Usaha"}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-[#0868a9] text-white flex items-center justify-center font-bold text-xl shadow-xs border border-white overflow-hidden">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-5 h-5 bg-[#f4b81a] text-[#084f86] rounded-full flex items-center justify-center border border-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
              title="Ganti Foto"
            >
              <Camera className="w-2.5 h-2.5" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{currentUser.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.role === "ADMIN" ? "Staff TU • Admin" : "Staff TU • Verifikator"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0868a9] text-[11px] font-semibold rounded border border-blue-200">
                <Lock className="w-2.5 h-2.5" />
                NIP: {currentUser.nip || "198803152011011002"}
              </span>
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                {uploadingAvatar ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
                {uploadingAvatar ? "Mengunggah..." : "Pilih Foto Baru"}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Induk Pegawai (NIP) <span className="text-red-500 font-normal">(Terkunci)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input 
                  disabled
                  value={currentUser.nip || "198803152011011002"} 
                  className="w-full h-10 pl-9 pr-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-medium cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username / ID Pegawai</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <input 
                  disabled
                  value={currentUser.email.split("@")[0]} 
                  className="w-full h-10 pl-9 pr-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-medium cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <input 
                  value={profileForm.name} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  required 
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Level User <span className="text-red-500 font-normal">(Terkunci)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input 
                  disabled
                  value={currentUser.role === "ADMIN" ? "Staff TU • Admin" : "Staff TU"} 
                  className="w-full h-10 pl-9 pr-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-bold cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Kedinasan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input 
                  type="email"
                  value={profileForm.email} 
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} 
                  required 
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input 
                  type="tel"
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  placeholder="08xxxxxxxxxx"
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                Ganti Kata Sandi <span className="font-normal normal-case text-slate-400">(Kosongkan jika tidak ingin mengubah)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input 
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Kata sandi baru"
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input 
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={profileSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0868a9] hover:bg-[#084f86] text-white font-bold rounded-lg shadow-xs disabled:opacity-50 text-xs transition-all cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              {profileSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* FULL HEIGHT SIDEBAR: Responsive Full vs Mini (Icon-Only) Sidebar */}
      <aside 
        className={`transition-all duration-300 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm z-30 fixed md:sticky top-0 h-screen overflow-hidden shrink-0 ${
          isSidebarOpen 
            ? 'w-[260px] translate-x-0' 
            : 'w-[260px] -translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className={`h-20 flex items-center border-b border-slate-100 shrink-0 ${isSidebarOpen ? 'px-6' : 'justify-center px-2'}`}>
            <button 
              onClick={() => setActiveTab("dashboard")} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              title="SAPA BWS Bali Penida"
            >
              <div className="sapa-mark shrink-0">S</div>
              {isSidebarOpen && (
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SAPA</h1>
              )}
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {MENU_ITEMS.map((menu) => {
              const Icon = menu.icon;
              const isActive = activeTab === menu.id;
              if (menu.id === "users" && currentUser.role !== "ADMIN") return null;

              return (
                <button
                  key={menu.id}
                  title={menu.label}
                  onClick={() => {
                    setActiveTab(menu.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                    isSidebarOpen ? "gap-3.5 px-3.5 py-3" : "justify-center p-3"
                  } ${
                    isActive 
                      ? "bg-[#0868a9] text-white shadow-xs font-bold" 
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {isSidebarOpen && <span className="truncate">{menu.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Settings & Logout (Full vs Icon-Only) */}
        <div className={`p-3 border-t border-slate-100 space-y-2 shrink-0 bg-white ${isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            title="Pengaturan Akun"
            className={`flex items-center justify-center rounded-lg font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-2xs cursor-pointer ${
              isSidebarOpen ? "w-full gap-2 px-4 py-2.5" : "w-11 h-11 p-0"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Pengaturan Akun</span>}
          </button>
          <button 
            onClick={handleLogout} 
            title="Logout"
            className={`flex items-center justify-center rounded-lg font-bold text-xs bg-red-600 text-white hover:bg-red-700 transition-colors shadow-2xs cursor-pointer ${
              isSidebarOpen ? "w-full gap-2 px-4 py-2.5" : "w-11 h-11 p-0"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Menu"
              title={isSidebarOpen ? "Kecilkan Sidebar (Icon Only)" : "Perbesar Sidebar"}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                {getGreeting()}, {currentUser.name.split(" ")[0]}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari surat, resi, pemohon..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-[#0868a9] outline-none transition-all"
              />
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {pendingSubmissions.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Notifikasi Masuk</span>
                    <span className="text-xs bg-blue-50 text-[#0868a9] font-bold px-2 py-0.5 rounded">{pendingSubmissions.length} antrean</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pendingSubmissions.slice(0, 5).map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setSelectedDoc(s); setShowNotifications(false); }}
                        className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer border border-slate-100 transition-colors"
                      >
                        <p className="text-xs font-bold text-slate-800 truncate">{s.receiptCode}</p>
                        <p className="text-[11px] text-slate-500 truncate">{s.subject}</p>
                        <span className="text-[10px] text-slate-400">{format(new Date(s.createdAt), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    ))}
                    {pendingSubmissions.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">Tidak ada antrean baru.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 p-1.5 sm:px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#0868a9] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 capitalize">{currentUser.role.toLowerCase()}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto w-full">
          
          {/* === MENU 1: DASHBOARD === */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Surat Masuk</span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{totalMasuk}</p>
                  <p className="text-xs text-slate-500 mt-1">Total pengajuan masuk</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Antrean Verifikasi</span>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{totalDiproses}</p>
                  <p className="text-xs text-slate-500 mt-1">Menunggu tindakan</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Surat Disetujui</span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{totalDisetujui}</p>
                  <p className="text-xs text-slate-500 mt-1">Selesai & diterbitkan</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Surat Ditolak</span>
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{totalDitolak}</p>
                  <p className="text-xs text-slate-500 mt-1">Spam / Tidak sesuai</p>
                </div>
              </div>

              {/* Antrean Verifikasi Terkini */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 w-full">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Antrean Verifikasi Surat Terkini</h3>
                    <p className="text-xs text-slate-400">Surat yang membutuhkan tindakan verifikasi dan keputusan.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("verifikasi")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0868a9] hover:underline cursor-pointer"
                  >
                    Lihat Semua Antrean <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-full">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 rounded-l">Kode Resi</th>
                        <th className="py-3 px-3">Pemohon & Instansi</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-3">Tanggal Masuk</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-center rounded-r">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingSubmissions.slice(0, 5).map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-900 text-xs">{sub.receiptCode}</td>
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-slate-800 text-xs">{sub.applicantName}</p>
                            <p className="text-[11px] text-slate-400">{sub.institution || "Perseorangan"}</p>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 text-xs">{sub.category}</td>
                          <td className="py-3.5 px-3 text-slate-500 text-xs">{format(new Date(sub.createdAt), "dd MMM yyyy", { locale: id })}</td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              sub.status === "PERLU_REVISI" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                              "bg-blue-100 text-blue-900 border border-blue-200"
                            }`}>
                              {sub.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {sub.status === "PERLU_REVISI" ? (
                              <button 
                                onClick={() => handleOpenDoc(sub, "view")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-xs font-semibold transition-all cursor-pointer border border-amber-300 shadow-2xs"
                                title="Menunggu pemohon mengunggah dokumen revisi"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Menunggu Revisi
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleOpenDoc(sub, "edit")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0868a9] hover:bg-[#084f86] text-white rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer border border-[#0868a9]"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                Proses Verifikasi
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pendingSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-medium">
                            Semua surat telah selesai diverifikasi! Tidak ada antrean tertunda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* === MENU 2: VERIFIKASI SUBSTANSI / ANTREAN === */}
          {activeTab === "verifikasi" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 space-y-6 w-full">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {currentUser.role === "ADMIN" ? "Pemeriksaan & Keputusan Substansi Surat" : "Verifikasi Kelengkapan Administrasi Surat"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {currentUser.role === "ADMIN"
                    ? "Tinjau kelayakan substansi surat yang telah dinyatakan valid oleh Staf TU dan tentukan status DISETUJUI / DITOLAK."
                    : "Periksa berkas pemohon. Tolak SPAM, kembalikan untuk REVISI, atau TERUSKAN berkas yang valid ke Admin."
                  }
                </p>
              </div>

              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 rounded-l">Kode Resi</th>
                      <th className="py-3 px-3">Pemohon</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Perihal</th>
                      <th className="py-3 px-3">Catatan Internal</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center rounded-r">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-[#0868a9] text-xs">{sub.receiptCode}</td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800 text-xs">{sub.applicantName}</p>
                          <p className="text-[11px] text-slate-400">{sub.institution || "Perseorangan"}</p>
                        </td>
                        <td className="py-3.5 px-3 text-slate-700 text-xs">{sub.category}</td>
                        <td className="py-3.5 px-3 text-slate-600 text-xs max-w-[200px] truncate" title={sub.subject}>{sub.subject}</td>
                        <td className="py-3.5 px-3">
                          {sub.internalNote ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-semibold max-w-[150px] truncate" title={sub.internalNote}>
                              <NotebookPen className="w-3 h-3 shrink-0 text-amber-700" />
                              {sub.internalNote}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            sub.status === "PERLU_REVISI" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                            "bg-blue-100 text-blue-900 border border-blue-200"
                          }`}>
                            {sub.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {sub.status === "PERLU_REVISI" ? (
                            <button 
                              onClick={() => handleOpenDoc(sub, "view")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-xs font-semibold transition-all cursor-pointer border border-amber-300 shadow-2xs"
                              title="Menunggu pemohon mengunggah dokumen revisi"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Menunggu Revisi
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenDoc(sub, "edit")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0868a9] hover:bg-[#084f86] text-white rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer border border-[#0868a9]"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Proses Verifikasi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {pendingSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                          Tidak ada surat yang membutuhkan tindakan saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === MENU 3: RIWAYAT KEPUTUSAN === */}
          {activeTab === "riwayat" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 space-y-6 w-full">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Riwayat & Arsip Keputusan Surat</h3>
                <p className="text-xs text-slate-500 mt-1">Daftar seluruh surat yang telah selesai diverifikasi atau diputuskan.</p>
              </div>

              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 rounded-l">Kode Resi</th>
                      <th className="py-3 px-3">Pemohon</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Tanggal Keputusan</th>
                      <th className="py-3 px-3">Nomor Balasan</th>
                      <th className="py-3 px-3">Status Akhir</th>
                      <th className="py-3 px-3 text-center rounded-r">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historySubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-800 text-xs">{sub.receiptCode}</td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800 text-xs">{sub.applicantName}</p>
                          <p className="text-[11px] text-slate-400">{sub.institution || "Perseorangan"}</p>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-xs">{sub.category}</td>
                        <td className="py-3.5 px-3 text-slate-500 text-xs">{format(new Date(sub.updatedAt), "dd/MM/yyyy HH:mm")}</td>
                        <td className="py-3.5 px-3 font-mono text-xs text-emerald-800 font-semibold">{sub.responseNomor || "-"}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            sub.status === "DISETUJUI" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            sub.status === "DITOLAK" ? "bg-red-100 text-red-800 border border-red-200" :
                            "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            {sub.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleOpenDoc(sub, "view")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Tinjau
                            </button>
                            <a 
                              href={`/cetak-resi?resi=${encodeURIComponent(sub.receiptCode)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-blue-50 text-[#0868a9] hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Cetak Lembar Tanda Terima & QR"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === MENU 4: LAPORAN ANALITIK === */}
          {activeTab === "laporan" && (
            <div className="space-y-8 w-full">
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 flex flex-wrap items-center justify-between gap-4 w-full">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Laporan & Rekapitulasi Surat</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Format standar Buku Register Arsip Surat Masuk Balai Wilayah Sungai Bali Penida.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select
                      className="h-10 pl-3 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#0868a9]"
                      onChange={(e) => {
                        const val = e.target.value;
                        const now = new Date();
                        if (val === "7days") {
                          const d = new Date(); d.setDate(now.getDate() - 7);
                          setStartDate(format(d, "yyyy-MM-dd"));
                          setEndDate(format(now, "yyyy-MM-dd"));
                        } else if (val === "30days") {
                          const d = new Date(); d.setDate(now.getDate() - 30);
                          setStartDate(format(d, "yyyy-MM-dd"));
                          setEndDate(format(now, "yyyy-MM-dd"));
                        } else if (val === "6months") {
                          const d = new Date(); d.setMonth(now.getMonth() - 6);
                          setStartDate(format(d, "yyyy-MM-dd"));
                          setEndDate(format(now, "yyyy-MM-dd"));
                        } else if (val === "1year") {
                          const d = new Date(); d.setFullYear(now.getFullYear() - 1);
                          setStartDate(format(d, "yyyy-MM-dd"));
                          setEndDate(format(now, "yyyy-MM-dd"));
                        }
                      }}
                    >
                      <option value="">Pilih Rentang Cepat...</option>
                      <option value="7days">7 Hari Terakhir</option>
                      <option value="30days">30 Hari Terakhir</option>
                      <option value="6months">6 Bulan Terakhir</option>
                      <option value="1year">1 Tahun Terakhir</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className="h-8 px-2 bg-transparent text-xs font-medium text-slate-700 outline-none" 
                    />
                    <span className="text-xs text-slate-400 font-bold">s/d</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      className="h-8 px-2 bg-transparent text-xs font-medium text-slate-700 outline-none" 
                    />
                  </div>

                  <button 
                    onClick={handleExportPDF}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0868a9] hover:bg-[#084f86] text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF (Kop BWS)
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isExportingExcel ? "Mengunduh..." : "Export Excel (Surat Masuk 2025)"}
                  </button>
                </div>
              </div>

              {/* Interactive Visual Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6">
                  <h4 className="text-base font-bold text-slate-800 mb-1">Distribusi Kategori Permohonan</h4>
                  <p className="text-xs text-slate-400 mb-4">Persentase surat masuk berdasarkan kategori layanan BWS.</p>
                  
                  <div className="h-64 w-full">
                    {pieChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        Belum ada data permohonan.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6">
                  <h4 className="text-base font-bold text-slate-800 mb-1">Tren Aktivitas Surat</h4>
                  <p className="text-xs text-slate-400 mb-4">Grafik perbandingan surat masuk, disetujui, dan ditolak terkini.</p>
                  
                  <div className="h-64 w-full">
                    {timelineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <RechartsTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="masuk" stroke="#0868a9" strokeWidth={2.5} name="Total Masuk" />
                          <Line type="monotone" dataKey="disetujui" stroke="#10b981" strokeWidth={2.5} name="Disetujui" />
                          <Line type="monotone" dataKey="ditolak" stroke="#ef4444" strokeWidth={2.5} name="Ditolak" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        Belum ada data tren permohonan.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 w-full">
                <h4 className="text-base font-bold text-slate-800 mb-4">Ringkasan Statistik Status Permohonan</h4>
                <div className="w-full">
                  <table id="summary-table" className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-y border-slate-100 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3">NO</th>
                        <th className="py-3 px-3">JENIS / KATEGORI SURAT</th>
                        <th className="py-3 px-3 text-blue-600">MASUK (TOTAL)</th>
                        <th className="py-3 px-3 text-emerald-600">DISETUJUI</th>
                        <th className="py-3 px-3 text-red-600">DITOLAK</th>
                        <th className="py-3 px-3">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summaryTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{row.cat}</td>
                          <td className="py-3 px-3 font-bold text-blue-600">{row.masuk}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600">{row.disetujui}</td>
                          <td className="py-3 px-3 font-bold text-red-600">{row.ditolak}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{row.total}</td>
                        </tr>
                      ))}
                      {summaryTable.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada data untuk rentang waktu ini.</td></tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={2} className="py-3.5 px-3 text-slate-900 text-right font-black uppercase text-xs tracking-wider">GRAND TOTAL</td>
                        <td className="py-3.5 px-3 font-black text-blue-700 text-base">{summaryTable.reduce((s, r) => s + r.masuk, 0)}</td>
                        <td className="py-3.5 px-3 font-black text-emerald-700 text-base">{summaryTable.reduce((s, r) => s + r.disetujui, 0)}</td>
                        <td className="py-3.5 px-3 font-black text-red-700 text-base">{summaryTable.reduce((s, r) => s + r.ditolak, 0)}</td>
                        <td className="py-3.5 px-3 font-black text-slate-950 text-base">{summaryTable.reduce((s, r) => s + r.total, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === MENU 5: USER MANAGEMENT === */}
          {activeTab === "users" && currentUser.role === "ADMIN" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 space-y-6 w-full">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola hak akses akun Staf TU, Admin BWS, dan Pemohon Publik.</p>
                </div>
                <button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0868a9] hover:bg-[#084f86] text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Tambah Staf/Admin
                </button>
              </div>

              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 rounded-l">ID</th>
                      <th className="py-3 px-3">Nama Lengkap & NIP</th>
                      <th className="py-3 px-3">Email / Akun</th>
                      <th className="py-3 px-3">No. HP</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center rounded-r">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {initialUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-xs text-slate-400">{u.id.slice(0, 8)}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800 text-xs">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {u.nip 
                              ? `NIP: ${u.nip}` 
                              : u.role === "ADMIN" 
                                ? (u.institution || "BWS Bali Penida") 
                                : u.role === "STAFF" 
                                  ? (u.institution || "Tata Usaha BWS Bali Penida") 
                                  : (u.institution || "Pemohon Publik")}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{u.email}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{u.phone || "-"}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            u.role === "ADMIN" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                            u.role === "STAFF" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                            "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                            u.isBlocked ? "text-red-600" : "text-emerald-600"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${u.isBlocked ? "bg-red-600" : "bg-emerald-600"}`} />
                            {u.isBlocked ? "Diblokir" : "Aktif"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {u.id === currentUser.id ? (
                            <span className="text-xs font-bold text-slate-400 italic">Akun Anda</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {u.role === "STAFF" && (
                                <button 
                                  onClick={() => { 
                                    setSelectedActionUser(u); 
                                    setActionReason("");
                                    setIsRoleModalOpen(true); 
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Edit Role
                                </button>
                              )}
                              <button 
                                onClick={() => { 
                                  setSelectedActionUser(u); 
                                  setActionReason("");
                                  setIsBlockModalOpen(true); 
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  u.isBlocked ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                }`}
                              >
                                {u.isBlocked ? "Buka Blokir" : "Blokir"}
                              </button>
                              <button 
                                onClick={() => { 
                                  setSelectedActionUser(u); 
                                  setActionReason("");
                                  setIsDeleteModalOpen(true); 
                                }}
                                className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VERIFIKASI & KEPUTUSAN SUBSTANSI SURAT */}
      {/* ========================================================================= */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <section className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-2xl shadow-2xl relative my-6 border border-slate-200 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0868a9] bg-blue-50 px-2.5 py-1 rounded">
                  {selectedDocMode === "edit" ? "TINJAUAN VERIFIKASI" : "DETAIL ARSIP KEPUTUSAN"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDoc.receiptCode}</h3>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              
              {/* Applicant Metadata Box - 2 Columns */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-medium">Nama Pemohon:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedDoc.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Instansi:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedDoc.institution || "Perseorangan"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-medium">Kategori Surat:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedDoc.category}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Tanggal Masuk:</span>
                    <p className="font-semibold text-slate-700 mt-0.5">{format(new Date(selectedDoc.createdAt), "dd MMMM yyyy HH:mm", { locale: id })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div className="min-w-0">
                    <span className="text-slate-400 font-medium">Email Kontak:</span>
                    <div className="mt-1">
                      <a 
                        href={`mailto:${selectedDoc.applicantEmail}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedDoc.applicantEmail}</span>
                      </a>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 font-medium">No. Telepon / WhatsApp:</span>
                    <div className="mt-1">
                      {(() => {
                        const cleanPhone = selectedDoc.applicantPhone.replace(/[^0-9]/g, '');
                        const waNum = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                        return (
                          <a 
                            href={`https://wa.me/${waNum}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{selectedDoc.applicantPhone}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Chat WA</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maksud / Perihal Surat:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed">
                  {selectedDoc.subject}
                </div>
              </div>

              {/* Attachment & In-App PDF Preview Toggle */}
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0868a9] flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Dokumen Lampiran ({getCleanDocName(selectedDoc.documentName)})
                  </span>
                  <div className="flex items-center gap-2">
                    {getCleanDocUrl(selectedDoc.documentUrl) && (
                      <button 
                        type="button"
                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                        className="text-xs font-bold text-[#0868a9] hover:underline cursor-pointer"
                      >
                        {showPdfPreview ? "Sembunyikan Preview" : "Lihat Preview Dokumen"}
                      </button>
                    )}
                  </div>
                </div>

                {showPdfPreview && getCleanDocUrl(selectedDoc.documentUrl) && (
                  <div className="w-full h-80 border border-slate-300 rounded-lg overflow-hidden bg-white">
                    <iframe 
                      src={getCleanDocUrl(selectedDoc.documentUrl)} 
                      className="w-full h-full" 
                      title="PDF Preview" 
                    />
                  </div>
                )}

                {getCleanDocUrl(selectedDoc.documentUrl) && (
                  <div className="flex gap-2 pt-0.5">
                    <a 
                      href={getCleanDocUrl(selectedDoc.documentUrl)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0868a9] bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
                    </a>
                  </div>
                )}
              </div>

              {/* Catatan Internal */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <NotebookPen className="w-4 h-4 text-amber-700" />
                  <span>Catatan Internal (Khusus Staf TU & Admin)</span>
                </div>
                {selectedDocMode === "edit" ? (
                  <textarea 
                    value={internalNote}
                    onChange={e => setInternalNote(e.target.value)}
                    placeholder="Tulis catatan internal untuk koordinasi staf dan admin..."
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 outline-none focus:border-amber-500"
                    rows={2}
                  />
                ) : (
                  <p className="text-xs text-amber-950 font-medium bg-white/80 p-2.5 rounded border border-amber-200">
                    {selectedDoc.internalNote || "Tidak ada catatan internal untuk surat ini."}
                  </p>
                )}
              </div>

              {/* PERLU_REVISI status locked */}
              {selectedDoc.status === "PERLU_REVISI" ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-amber-950">Menunggu Perbaikan Berkas dari Pemohon</p>
                    <p className="mt-1 leading-relaxed">
                      Surat ini sedang dalam status <b>PERLU REVISI</b>. Staf TU tidak dapat memproses atau mengubah keputusan surat ini sampai pemohon mengunggah dokumen revisi melalui sistem.
                    </p>
                    {selectedDoc.catatanStaf && (
                      <div className="mt-2.5 p-2.5 bg-white/90 border border-amber-200 rounded-lg">
                        <span className="font-bold text-amber-800">Catatan revisi yang dikirim ke pemohon:</span>
                        <p className="mt-0.5 text-slate-700">{selectedDoc.catatanStaf}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedDocMode === "edit" ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Tentukan Keputusan {currentUser.role === "ADMIN" ? "Substansi" : "Administrasi"}:
                  </label>

                  {currentUser.role === "STAFF" ? (
                    <div className="grid grid-cols-3 gap-2.5">
                      <button 
                        type="button" 
                        onClick={() => setDecision("DITERUSKAN")}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === "DITERUSKAN" ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-current" />
                        Valid & Teruskan
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setDecision("PERLU_REVISI")}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === "PERLU_REVISI" ? "bg-amber-600 text-white border-amber-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <AlertCircle className="w-5 h-5 text-current" />
                        Perlu Revisi
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setDecision("DITOLAK")}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === "DITOLAK" ? "bg-red-600 text-white border-red-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <XCircle className="w-5 h-5 text-current" />
                        Tolak (SPAM)
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        onClick={() => setDecision("DISETUJUI")}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === "DISETUJUI" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-current" />
                        DISETUJUI RESMI
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setDecision("DITOLAK")}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          decision === "DITOLAK" ? "bg-red-600 text-white border-red-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <XCircle className="w-5 h-5 text-current" />
                        TOLAK SUBSTANSI
                      </button>
                    </div>
                  )}

                  {/* EDITABLE OFFICIAL RESPONSE LETTER TEMPLATE FOR ADMIN */}
                  {decision === "DISETUJUI" && (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-emerald-700" />
                          Format Surat Balasan Resmi BWS (Bisa Diedit):
                        </span>
                        <button
                          type="button"
                          onClick={handlePreviewOfficialLetter}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview PDF
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">Nomor Surat Balasan Resmi BWS</label>
                            <input 
                              value={responseNomor}
                              onChange={e => setResponseNomor(e.target.value)}
                              placeholder="Contoh: BWS.02/HK.01/2026/089"
                              className="w-full h-9 px-3 bg-white border border-emerald-400 rounded-lg font-mono font-bold text-emerald-950 outline-none focus:border-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">Sifat Surat</label>
                            <input 
                              value={responseSifat}
                              onChange={e => setResponseSifat(e.target.value)}
                              placeholder="Penting / Segera"
                              className="w-full h-9 px-3 bg-white border border-emerald-400 rounded-lg font-semibold text-emerald-950 outline-none focus:border-emerald-700"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">Lampiran</label>
                            <input 
                              value={responseLampiran}
                              onChange={e => setResponseLampiran(e.target.value)}
                              placeholder="1 (satu) Berkas"
                              className="w-full h-9 px-3 bg-white border border-emerald-400 rounded-lg text-emerald-950 outline-none focus:border-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">Perihal Surat</label>
                            <input 
                              value={responsePerihal}
                              onChange={e => setResponsePerihal(e.target.value)}
                              placeholder="Persetujuan dan Rekomendasi Teknis..."
                              className="w-full h-9 px-3 bg-white border border-emerald-400 rounded-lg font-semibold text-emerald-950 outline-none focus:border-emerald-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-emerald-950 mb-1">
                            Isi Teks Surat Balasan Resmi (Edit Sesuai Kebutuhan):
                          </label>
                          <textarea 
                            value={responseIsi}
                            onChange={e => setResponseIsi(e.target.value)}
                            className="w-full p-2.5 bg-white border border-emerald-400 rounded-lg leading-relaxed text-slate-800 outline-none focus:border-emerald-700"
                            rows={5}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">Jabatan Penandatangan</label>
                            <input 
                              value={responsePenandatangan}
                              onChange={e => setResponsePenandatangan(e.target.value)}
                              className="w-full h-9 px-3 bg-white border border-emerald-400 rounded-lg text-emerald-950 outline-none focus:border-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-emerald-950 mb-1">Nama Pejabat Penandatangan</label>
                            <input 
                              value={responsePenandatanganNama}
                              onChange={e => setResponsePenandatanganNama(e.target.value)}
                              className="w-full h-9 px-3 bg-white border border-emerald-400 rounded-lg font-bold text-emerald-950 outline-none focus:border-emerald-700"
                            />
                          </div>
                        </div>

                        {/* Optional Toggle for Manual Custom Upload */}
                        <div className="pt-2 border-t border-emerald-200">
                          <button 
                            type="button"
                            onClick={() => setUseCustomUpload(!useCustomUpload)}
                            className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            {useCustomUpload ? "Tutup Opsi Upload Manual (Gunakan Format Otomatis)" : "Atau Ingin Upload Berkas PDF Bertanda Tangan Fisik / Scan Manual?"}
                          </button>

                          {useCustomUpload && (
                            <div className="mt-2.5 p-3 bg-white border border-dashed border-emerald-400 rounded-lg">
                              <input 
                                type="file"
                                ref={responseFileInputRef}
                                accept=".pdf,application/pdf"
                                onChange={e => setResponseFile(e.target.files?.[0] || null)}
                                className="hidden"
                              />
                              {responseFile ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-bold text-emerald-950 truncate">{responseFile.name}</span>
                                    <span className="text-[10px] text-slate-400">({(responseFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => setResponseFile(null)}
                                    className="text-xs font-bold text-red-600 hover:text-red-800 ml-2"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => responseFileInputRef.current?.click()}
                                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer py-1"
                                >
                                  <FileUp className="w-4 h-4 text-emerald-700" />
                                  Pilih Berkas PDF Scan Manual Pengganti
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan untuk Pemohon <span className="font-normal text-slate-400">(Akan tampil di layar publik pemohon)</span>
                    </label>
                    <textarea 
                      value={publicNote}
                      onChange={e => setPublicNote(e.target.value)}
                      placeholder={decision === "PERLU_REVISI" ? "Tuliskan bagian mana yang perlu diperbaiki oleh pemohon..." : "Catatan atau keterangan persetujuan/penolakan..."}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#0868a9]"
                      rows={2}
                    />
                  </div>

                </div>
              ) : null}

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100 mt-4">
              <button 
                type="button" 
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
              {selectedDocMode === "edit" && selectedDoc.status !== "PERLU_REVISI" && (
                <button 
                  type="button" 
                  disabled={!decision || isSubmitting}
                  onClick={handleSubmitDecision}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-[#0868a9] hover:bg-[#084f86] shadow-xs disabled:opacity-50 text-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan & Menerbitkan..." : "Kirim Keputusan"}
                </button>
              )}
            </div>

          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: USER MANAGEMENT ACTION MODALS */}
      {/* ========================================================================= */}
      
      {/* Modal Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <section className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative border border-slate-100" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Tambah Pegawai Internal</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input required value={addUserName} onChange={e => setAddUserName(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP Pegawai (Opsional)</label>
                <input value={addUserNip} onChange={e => setAddUserNip(e.target.value)} placeholder="19xxxxxxxxxxxxxxxx" className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Kedinasan</label>
                <input type="email" required value={addUserEmail} onChange={e => setAddUserEmail(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. HP / WhatsApp</label>
                <input type="tel" value={addUserPhone} onChange={e => setAddUserPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal</label>
                <input type="password" required value={addUserPassword} onChange={e => setAddUserPassword(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Hak Akses</label>
                <select value={addUserRole} onChange={e => setAddUserRole(e.target.value)} className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none font-bold">
                  <option value="STAFF">STAFF (Verifikator TU)</option>
                  <option value="ADMIN">ADMIN (Keputusan Substansi)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#0868a9] text-white font-bold rounded-lg hover:bg-[#084f86] cursor-pointer">Simpan Akun</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Modal Edit Role */}
      {isRoleModalOpen && selectedActionUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <section className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative border border-slate-100" role="dialog" aria-modal="true">
            <h3 className="text-base font-bold text-slate-900 mb-2">Ubah Role Pengguna ke ADMIN</h3>
            <p className="text-xs text-slate-600 mb-3">
              Ubah wewenang untuk <b>{selectedActionUser.name}</b> ({selectedActionUser.email}) dari <b>STAFF</b> menjadi <b>ADMIN</b>.
            </p>
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3 flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <b>Peringatan:</b> Mengubah role pengguna menjadi Admin akan memberikan hak akses penuh untuk memutuskan surat dan mengelola pengguna lain.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Perubahan Role <span className="text-slate-400 font-normal">(Audit Trail)</span>:</label>
                <textarea 
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Contoh: Promosi jabatan / SK penugasan admin baru..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 text-xs cursor-pointer">Batal</button>
              <button 
                disabled={isActionLoading}
                onClick={handleEditRole} 
                className="px-5 py-2 rounded-lg font-bold text-white bg-[#0868a9] hover:bg-[#084f86] text-xs cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? "Menyimpan..." : "Ya, Jadikan Admin"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal Block User */}
      {isBlockModalOpen && selectedActionUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <section className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative border border-slate-100" role="dialog" aria-modal="true">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {selectedActionUser.isBlocked ? "Buka Blokir Akun" : "Blokir Akses Akun"}
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Apakah Anda yakin ingin {selectedActionUser.isBlocked ? "membuka blokir untuk" : "memblokir akses login"} akun <b>{selectedActionUser.name}</b>?
            </p>

            <div className={`p-3 rounded-lg mb-3 flex items-start gap-2 text-xs ${
              selectedActionUser.isBlocked ? "bg-emerald-50 border border-emerald-200 text-emerald-900" : "bg-red-50 border border-red-200 text-red-900"
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${selectedActionUser.isBlocked ? "text-emerald-700" : "text-red-700"}`} />
              <div>
                <b>Peringatan:</b> {selectedActionUser.isBlocked 
                  ? "Membuka blokir akan mengaktifkan kembali akses login pengguna ke sistem SAPA." 
                  : "Pemblokiran akan mencabut seluruh hak akses login akun ini ke portal secara langsung."}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan {selectedActionUser.isBlocked ? "Buka Blokir" : "Pemblokiran"} <span className="text-slate-400 font-normal">(Audit Trail)</span>:
                </label>
                <textarea 
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Contoh: Akun terindikasi melakukan spam surat pengajuan..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#0868a9]"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => setIsBlockModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 text-xs cursor-pointer">Batal</button>
              <button 
                disabled={isActionLoading}
                onClick={handleBlockToggle} 
                className={`px-5 py-2 rounded-lg font-bold text-white text-xs cursor-pointer disabled:opacity-50 ${
                  selectedActionUser.isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isActionLoading ? "Memproses..." : selectedActionUser.isBlocked ? "Ya, Buka Blokir" : "Ya, Blokir Akun"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal Delete User */}
      {isDeleteModalOpen && selectedActionUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <section className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative border border-slate-100" role="dialog" aria-modal="true">
            <h3 className="text-base font-bold text-red-600 mb-2">Hapus Akun Pengguna</h3>
            <p className="text-xs text-slate-600 mb-3">
              Tindakan ini akan menghapus akun <b>{selectedActionUser.name}</b> ({selectedActionUser.email}) secara permanen dari sistem database.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3 flex items-start gap-2 text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <b>Peringatan Kritis:</b> Menghapus akun bersifat permanen dan tidak dapat dibatalkan. Riwayat surat yang terhubung akan tetap tersimpan dalam arsip.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penghapusan <span className="text-slate-400 font-normal">(Audit Trail)</span>:</label>
                <textarea 
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Contoh: Pegawai purna tugas / akun tidak aktif..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-red-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 text-xs cursor-pointer">Batal</button>
              <button 
                disabled={isActionLoading}
                onClick={handleDeleteUser} 
                className="px-5 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 text-xs cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal Profile Settings */}
      {isProfileModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const isUnchanged = profileForm.name === currentUser.name && profileForm.email === currentUser.email && profileForm.phone === (currentUser.phone || "") && !newPassword;
              if (isUnchanged) setIsProfileModalOpen(false);
            }
          }}
        >
          {renderProfileSettingsModal()}
        </div>
      )}

      {/* Avatar Cropper Modal */}
      {cropperImageSrc && (
        <AvatarCropperModal
          imageSrc={cropperImageSrc}
          onClose={() => setCropperImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}

    </div>
  );
}
