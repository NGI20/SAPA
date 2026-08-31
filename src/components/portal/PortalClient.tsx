"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, FileCheck, History, BarChart3, Users, 
  LogOut, Bell, Search, Eye, Download, CheckCircle2, XCircle, FileText, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { id } from "date-fns/locale";
import { submitDecision } from "@/app/portal/actions";

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
  role: string;
  status?: string;
};

interface PortalClientProps {
  currentUser: { id: string; name: string; email: string;
  isBlocked: boolean; role: string };
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

export default function PortalClient({ currentUser, initialSubmissions, initialUsers, initialActivities }: PortalClientProps) {
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
  const [selectedActionUser, setSelectedActionUser] = useState<User | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleReason, setRoleReason] = useState("");
  const [blockReason, setBlockReason] = useState("");
  
  const [addUserName, setAddUserName] = useState("");
  const [addUserEmail, setAddUserEmail] = useState("");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [addUserRole, setAddUserRole] = useState("STAFF");

  const [searchQuery, setSearchQuery] = useState("");
  const [profileForm, setProfileForm] = useState({ name: currentUser.name, email: currentUser.email, phone: "", password: "" });
  
  // States for Modals
  const [selectedDoc, setSelectedDoc] = useState<Submission | null>(null);
  const [selectedDocMode, setSelectedDocMode] = useState<"edit" | "view">("edit");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [decision, setDecision] = useState<"DISETUJUI" | "DITOLAK" | "DITERUSKAN" | "PERLU_REVISI" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
  };

  const handleAddInternalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const actions = await import("@/app/portal/actions");
      await actions.addInternalUser({ name: addUserName, email: addUserEmail, password: addUserPassword, role: addUserRole });
      setIsAddUserModalOpen(false);
      setAddUserName(""); setAddUserEmail(""); setAddUserPassword(""); setAddUserRole("STAFF");
      alert("Pengguna berhasil ditambahkan!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambahkan pengguna.");
    }
  };

  const handleEditRole = async () => {
    if (!selectedActionUser) return;
    try {
      const actions = await import("@/app/portal/actions");
      await actions.updateUserRole(selectedActionUser.id, selectedActionUser.role === "ADMIN" ? "STAFF" : "ADMIN");
      setIsRoleModalOpen(false);
      alert("Role berhasil diubah!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah role.");
    }
  };

  const handleBlockUser = async () => {
    if (!selectedActionUser) return;
    try {
      const actions = await import("@/app/portal/actions");
      if (selectedActionUser.isBlocked) {
        await actions.unblockUser(selectedActionUser.id);
        alert("Blokir berhasil dibuka!");
      } else {
        await actions.blockUser(selectedActionUser.id);
        alert("Pengguna diblokir!");
      }
      setIsBlockModalOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memblokir/membuka blokir.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedActionUser) return;
    try {
      const actions = await import("@/app/portal/actions");
      await actions.deleteUser(selectedActionUser.id);
      setIsDeleteModalOpen(false);
      alert("Pengguna berhasil dihapus!");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus pengguna.");
    }
  };

  const handleDecisionSubmit = async () => {
    if (!selectedDoc || !decision) return;
    if ((decision === "DITOLAK" || decision === "PERLU_REVISI") && !rejectReason.trim()) {
      alert("Alasan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitDecision(selectedDoc.receiptCode, decision, rejectReason);
      
      // Update local state for immediate feedback
      setSubmissions(prev => prev.map(s => {
        if (s.id === selectedDoc.id) {
          return { ...s, status: decision, catatanStaf: rejectReason };
        }
        return s;
      }));
      
      setSelectedDoc(null);
      setDecision(null);
      setRejectReason("");
      alert("Keputusan berhasil disimpan!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan keputusan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStaff = currentUser.role === "STAFF";

  const filteredSubmissions = submissions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.receiptCode.toLowerCase().includes(q) || 
           s.applicantName.toLowerCase().includes(q) ||
           s.subject.toLowerCase().includes(q);
  });

  const pendingSubmissions = filteredSubmissions.filter(s => 
    isStaff ? s.status === "MENUNGGU" : s.status === "DITERUSKAN"
  );
  
  const finishedSubmissions = filteredSubmissions.filter(s => s.status === "DISETUJUI" || s.status === "DITOLAK" || s.status === "PERLU_REVISI");

  // Summary counts
  const countStaffAntrean = submissions.filter(s => s.status === "MENUNGGU").length;
  const countStaffDiteruskan = submissions.filter(s => s.status === "DITERUSKAN").length;
  const countStaffRevisi = submissions.filter(s => s.status === "PERLU_REVISI").length;
  
  const countAdminAntrean = submissions.filter(s => s.status === "DITERUSKAN").length;
  const countDisetujui = submissions.filter(s => s.status === "DISETUJUI").length;
  const countDitolak = submissions.filter(s => s.status === "DITOLAK").length;
  const countPublik = initialUsers.filter(u => u.role === "PEMOHON").length;


  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full md:w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm z-30 fixed md:relative h-full overflow-hidden shrink-0`}>
        <div className="overflow-hidden">
          <div className="h-20 flex items-center px-8 border-b border-slate-100">
            <button onClick={() => setActiveTab("dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="sapa-mark">S</div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SAPA<span className="text-blue-600">.</span></h1>
            </button>
          </div>
          <nav className="p-4 space-y-1 w-72">
            {MENU_ITEMS.map((menu) => {
              const Icon = menu.icon;
              const isActive = activeTab === menu.id;
              // Sembunyikan menu User Management jika bukan Admin
              if (menu.id === "users" && currentUser.role !== "ADMIN") return null;

  return (
                <button
                  key={menu.id}
                  onClick={() => setActiveTab(menu.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {menu.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-600 bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
                {(() => { const h = new Date().getHours(); return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam"; })()}, {currentUser.name}
              </h2>
              <p className="text-sm text-slate-500 hidden sm:block">
                {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 relative">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {initialActivities.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <b className="text-sm text-slate-800">Notifikasi</b>
                      <span className="text-xs text-slate-500">{initialActivities.length} aktivitas baru</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {initialActivities.length > 0 ? (
                        initialActivities.map(act => (
                          <div key={act.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="text-sm text-slate-700">{act.detail}</p>
                            <small className="text-xs text-slate-400 block mt-1">{format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}</small>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">Belum ada notifikasi.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 relative cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.role === "ADMIN" ? "Administrator" : "Staff TU"}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              
              {/* === MENU 1: DASHBOARD === */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Cards */}
                  <div className="grid grid-cols-4 gap-6">
                    {isStaff ? (
                      <>
                        <SummaryCard title="Total Antrean" value={countStaffAntrean} icon={FileText} color="blue" />
                        <SummaryCard title="Diteruskan ke Atasan" value={countStaffDiteruskan} icon={CheckCircle2} color="green" />
                        <SummaryCard title="Direvisi (Dikembalikan)" value={countStaffRevisi} icon={FileText} color="slate" />
                        <SummaryCard title="Ditolak (Spam)" value={countDitolak} icon={XCircle} color="red" />
                      </>
                    ) : (
                      <>
                        <SummaryCard title="Antrean Keputusan" value={countAdminAntrean} icon={FileText} color="blue" />
                        <SummaryCard title="Surat Disetujui" value={countDisetujui} icon={CheckCircle2} color="green" />
                        <SummaryCard title="Surat Ditolak" value={countDitolak} icon={XCircle} color="red" />
                        <SummaryCard title="Total Akun Publik" value={countPublik} icon={Users} color="slate" />
                      </>
                    )}
                  </div>
                  
                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-800">5 Antrean Verifikasi Teratas</h3>
                      <button onClick={() => setActiveTab("verifikasi")} className="text-sm text-blue-600 font-semibold hover:underline">Lihat Semua</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="py-3 px-4 font-semibold rounded-l-lg">Kode Resi</th>
                            <th className="py-3 px-4 font-semibold">Pengirim</th>
                            <th className="py-3 px-4 font-semibold">Kategori</th>
                            <th className="py-3 px-4 font-semibold">Status</th>
                            <th className="py-3 px-4 font-semibold rounded-r-lg">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pendingSubmissions.slice(0, 5).map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="py-4 px-4 font-semibold text-blue-600">{s.receiptCode}</td>
                              <td className="py-4 px-4">{s.institution || s.applicantName}</td>
                              <td className="py-4 px-4">{s.category}</td>
                              <td className="py-4 px-4"><StatusBadge status={s.status} /></td>
                              <td className="py-4 px-4">
                                <button onClick={() => { setActiveTab("verifikasi"); setSelectedDoc(s); }} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100">
                                  <Eye className="w-3.5 h-3.5" /> Tinjau
                                </button>
                              </td>
                            </tr>
                          ))}
                          {pendingSubmissions.length === 0 && (
                            <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada antrean saat ini.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === MENU 2: VERIFIKASI SUBSTANSI === */}
              {activeTab === "verifikasi" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">Verifikasi Substansi</h3>
                      <p className="text-sm text-slate-500">Daftar ini memuat surat yang perlu keputusan akhir atau verifikasi lanjutan.</p>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari resi atau nama..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-3 px-4 font-semibold rounded-l-lg">No</th>
                          <th className="py-3 px-4 font-semibold">Nomor Resi</th>
                          <th className="py-3 px-4 font-semibold">Pengirim / Instansi</th>
                          <th className="py-3 px-4 font-semibold">Kategori</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold rounded-r-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingSubmissions.map((s, i) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 text-slate-500">{i + 1}</td>
                            <td className="py-4 px-4 font-semibold text-blue-600">{s.receiptCode}</td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-800">{s.institution || "Perseorangan"}</div>
                              <div className="text-xs text-slate-500">{s.applicantName}</div>
                            </td>
                            <td className="py-4 px-4">{s.category}</td>
                            <td className="py-4 px-4"><StatusBadge status={s.status} /></td>
                            <td className="py-4 px-4">
                              <button onClick={() => setSelectedDoc(s)} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white font-semibold transition-colors text-xs flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Tinjau
                              </button>
                            </td>
                          </tr>
                        ))}
                        {pendingSubmissions.length === 0 && (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-500">Semua permohonan telah selesai ditinjau.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === MENU 3: RIWAYAT KEPUTUSAN === */}
              {activeTab === "riwayat" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">Arsip & Riwayat Keputusan</h3>
                      <p className="text-sm text-slate-500">Seluruh permohonan yang telah disetujui atau ditolak.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option>Bulan Ini</option>
                        <option>Semua Waktu</option>
                      </select>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari resi atau nama..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-3 px-4 font-semibold rounded-l-lg">Kode Resi</th>
                          <th className="py-3 px-4 font-semibold">Pengirim</th>
                          <th className="py-3 px-4 font-semibold">Tanggal Keputusan</th>
                          <th className="py-3 px-4 font-semibold">Keputusan Akhir</th>
                          <th className="py-3 px-4 font-semibold">Catatan</th>
                          <th className="py-3 px-4 font-semibold rounded-r-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {finishedSubmissions.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 font-semibold text-slate-800">{s.receiptCode}</td>
                            <td className="py-4 px-4">{s.institution || s.applicantName}</td>
                            <td className="py-4 px-4">{format(new Date(s.updatedAt), "dd MMM yyyy", { locale: id })}</td>
                            <td className="py-4 px-4"><StatusBadge status={s.status} /></td>
                            <td className="py-4 px-4">
                              <span className="text-slate-500 italic max-w-xs block truncate" title={s.catatanStaf || undefined}>
                                {s.catatanStaf || "-"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button onClick={() => { setSelectedDoc(s); setSelectedDocMode("view"); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors border border-blue-100 whitespace-nowrap">
                                Tinjau Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                        {finishedSubmissions.length === 0 && (
                          <tr><td colSpan={6} className="py-12 text-center text-slate-500">Belum ada riwayat keputusan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === MENU 4: LAPORAN ANALITIK === */}
              {activeTab === "laporan" && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col xl:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">Laporan & Analitik</h3>
                      <p className="text-sm text-slate-500">Ringkasan eksekutif distribusi dan tren permohonan.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                          <select 
                            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 px-3 py-1.5 rounded-xl outline-none hover:bg-slate-100 cursor-pointer font-medium"
                            onChange={(e) => {
                              const val = e.target.value;
                              const today = new Date();
                              const formatDate = (date: Date) => {
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, "0");
                                const d = String(date.getDate()).padStart(2, "0");
                                return `${y}-${m}-${d}`;
                              };
                              if (val === "") {
                                setStartDate(""); setEndDate("");
                              } else if (val === "7days") {
                                const past = new Date(today); past.setDate(today.getDate() - 7);
                                setStartDate(formatDate(past)); setEndDate(formatDate(today));
                              } else if (val === "30days") {
                                const past = new Date(today); past.setDate(today.getDate() - 30);
                                setStartDate(formatDate(past)); setEndDate(formatDate(today));
                              } else if (val === "6months") {
                                const past = new Date(today); past.setMonth(today.getMonth() - 6);
                                setStartDate(formatDate(past)); setEndDate(formatDate(today));
                              } else if (val === "1year") {
                                const past = new Date(today); past.setFullYear(today.getFullYear() - 1);
                                setStartDate(formatDate(past)); setEndDate(formatDate(today));
                              }
                              e.target.value = ""; // reset after selection
                            }}
                          >
                            <option value="">Pilih Rentang Cepat...</option>
                            <option value="7days">7 Hari Terakhir</option>
                            <option value="30days">30 Hari Terakhir</option>
                            <option value="6months">6 Bulan Terakhir</option>
                            <option value="1year">1 Tahun Terakhir</option>
                          </select>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm text-slate-700 outline-none" />
                            <span className="text-slate-400">-</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm text-slate-700 outline-none" />
                          </div>
                        </div>
                      <button onClick={() => {
                        const doc = new jsPDF();
                        autoTable(doc, { html: '#summary-table' });
                        doc.save('Laporan_SAPA.pdf');
                      }} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" /> Export PDF
                      </button>
                      <button onClick={() => {
                        const table = document.getElementById('summary-table');
                        if (table) {
                          const wb = XLSX.utils.table_to_book(table);
                          XLSX.writeFile(wb, 'Laporan_SAPA.xlsx');
                        }
                      }} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                        <Download className="w-4 h-4" /> Export Excel
                      </button>
                    </div>
                  </div>

                  {(() => {
                    let filteredForLaporan = submissions;
                    if (startDate) {
                      filteredForLaporan = filteredForLaporan.filter(s => new Date(s.createdAt) >= new Date(startDate));
                    }
                    if (endDate) {
                      const end = new Date(endDate);
                      end.setHours(23, 59, 59, 999);
                      filteredForLaporan = filteredForLaporan.filter(s => new Date(s.createdAt) <= end);
                    }

                    // Prepare Pie Data
                    const categoryCounts = filteredForLaporan.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {} as Record<string, number>);
                    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
                    const COLORS = ['#0284c7', '#059669', '#d97706', '#9333ea', '#db2777'];

                    // Prepare Trend Data (Line chart over days)
                    const trends = filteredForLaporan.reduce((acc, s) => {
                      const dateStr = format(new Date(s.createdAt), "dd MMM yyyy");
                      acc[dateStr] = (acc[dateStr] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const lineData = Object.entries(trends).map(([name, Agenda]) => ({ name, Agenda })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

                    // Prepare Summary Table
                    const summaryTable = Object.entries(categoryCounts).map(([cat, total]) => {
                        const masuk = filteredForLaporan.filter(s => s.category === cat).length;
                      const disetujui = filteredForLaporan.filter(s => s.category === cat && (s.status === 'DISETUJUI' || s.status === 'DITERUSKAN')).length;
                      const ditolak = filteredForLaporan.filter(s => s.category === cat && s.status === 'DITOLAK').length;
                      return { cat, masuk, disetujui, ditolak, total };
                    });

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 min-h-[400px] flex flex-col">
                            <h4 className="text-lg font-bold text-slate-800 mb-1">Perbandingan Kategori Layanan</h4>
                            <p className="text-sm text-slate-500 mb-4">Distribusi permohonan</p>
                            <div className="flex-1 min-h-[300px]">
                              {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : <div className="flex items-center justify-center h-full text-slate-500">Belum ada data</div>}
                            </div>
                          </div>
                          
                          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 min-h-[400px] flex flex-col">
                            <h4 className="text-lg font-bold text-slate-800 mb-1">Tren Jumlah Permohonan</h4>
                            <p className="text-sm text-slate-500 mb-4">Grafik permohonan harian</p>
                            <div className="flex-1 min-h-[300px]">
                              {lineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="Agenda" stroke="#0284c7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : <div className="flex items-center justify-center h-full text-slate-500">Belum ada data</div>}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
                          <h4 className="text-lg font-bold text-slate-800 mb-4">Ringkasan Status Permohonan</h4>
                          <div className="overflow-x-auto">
                            <table id="summary-table" className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-500 border-y border-slate-100">
                                <tr>
                                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs">NO</th>
                                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs">JENIS SURAT</th>
                                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs text-blue-600">MASUK</th>
                                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs text-emerald-600">DISETUJUI/DITERUSKAN</th>
                                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs text-red-600">DITOLAK</th>
                                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-xs">TOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {summaryTable.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="py-4 px-4 font-medium text-slate-800">{row.cat}</td>
                                    <td className="py-4 px-4 font-bold text-blue-600">{row.masuk}</td>
                                    <td className="py-4 px-4 font-bold text-emerald-600">{row.disetujui}</td>
                                    <td className="py-4 px-4 font-bold text-red-600">{row.ditolak}</td>
                                    <td className="py-4 px-4 font-bold text-slate-800">{row.total}</td>
                                  </tr>
                                ))}
                                {summaryTable.length === 0 && (
                                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada data untuk rentang waktu ini.</td></tr>
                                )}
                              </tbody>
                              <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                                <tr>
                                  <td colSpan={2} className="py-4 px-4 text-slate-800 text-right font-black uppercase text-xs tracking-wider">GRAND TOTAL</td>
                                  <td className="py-4 px-4 font-black text-blue-700 text-lg">{summaryTable.reduce((sum, row) => sum + row.masuk, 0)}</td>
                                  <td className="py-4 px-4 font-black text-emerald-700 text-lg">{summaryTable.reduce((sum, row) => sum + row.disetujui, 0)}</td>
                                  <td className="py-4 px-4 font-black text-red-700 text-lg">{summaryTable.reduce((sum, row) => sum + row.ditolak, 0)}</td>
                                  <td className="py-4 px-4 font-black text-slate-900 text-xl">{summaryTable.reduce((sum, row) => sum + row.total, 0)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

                {/* === MENU 5: USER MANAGEMENT === */}
              {activeTab === "users" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">Manajemen Pengguna</h3>
                      <p className="text-sm text-slate-500">Kelola akses akun Staf, Admin, dan Publik.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                        Tambah Staf/Admin
                      </button>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama atau email..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-3 px-4 font-semibold rounded-l-lg">ID</th>
                          <th className="py-3 px-4 font-semibold">Nama Pengguna</th>
                          <th className="py-3 px-4 font-semibold">Email</th>
                          <th className="py-3 px-4 font-semibold">Role</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold rounded-r-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {initialUsers.filter(u => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                          }).map((u) => (
<tr key={u.id} className="hover:bg-slate-50 transition-colors"><td className="py-4 px-4 font-mono text-xs text-slate-400">{u.id.slice(-6).toUpperCase()}</td>
                            <td className="py-4 px-4 font-medium text-slate-800">{u.name}</td>
                            <td className="py-4 px-4 text-slate-600">{u.email}</td>
                            <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                  u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                                  u.role === "STAFF" ? "bg-slate-200 text-slate-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                            <td className="py-4 px-4">
                              {u.isBlocked ? (
                                <span className="flex items-center gap-1.5 text-red-600 text-xs font-semibold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Diblokir
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Aktif
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 flex gap-2">
                              {u.id === currentUser.id ? (
                                <span className="text-xs text-slate-400 italic">Anda sendiri</span>
                              ) : u.isBlocked ? (
                                <>
                                  <button onClick={() => { setSelectedActionUser(u); setIsBlockModalOpen(true); }} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium transition-colors text-xs">Buka Blokir</button>
                                  <button onClick={() => { setSelectedActionUser(u); setIsDeleteModalOpen(true); }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors text-xs">Hapus Akun</button>
                                </>
                              ) : (
                                <>
                                  {u.role !== "PEMOHON" && (
                                    <button onClick={() => { setSelectedActionUser(u); setIsRoleModalOpen(true); }} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors text-xs">Edit Role</button>
                                  )}
                                  <button onClick={() => { setSelectedActionUser(u); setIsBlockModalOpen(true); }} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 font-medium transition-colors text-xs">Blokir</button>
                                  <button onClick={() => { setSelectedActionUser(u); setIsDeleteModalOpen(true); }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors text-xs">Hapus</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* === MODAL: TINJAU & EKSEKUSI === */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-6 sm:px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tinjau Permohonan</h2>
                  <p className="text-sm text-slate-500 font-mono mt-1">{selectedDoc.receiptCode}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">Pengirim / Instansi</label>
                      <p className="text-slate-800 font-medium mb-1">{selectedDoc.institution || "Perseorangan"}</p>
                      <p className="text-slate-500 text-sm mb-3">{selectedDoc.applicantName}</p>
                      <div className="flex gap-2">
                        {selectedDoc.applicantPhone && (
                          <a href={`https://wa.me/${selectedDoc.applicantPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors border border-emerald-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            Hubungi WA
                          </a>
                        )}
                        <a href={`mailto:${selectedDoc.applicantEmail}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors border border-blue-100">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M2 4l10 8 10-8"/></svg>
                          Kirim Email
                        </a>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">Maksud / Isi Surat</label>
                      <p className="text-slate-800 text-sm leading-relaxed">{selectedDoc.subject}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">Kategori</label>
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold">{selectedDoc.category}</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">Dokumen Lampiran</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          let urls: string[] = [];
                          let names: string[] = [];
                          try {
                            urls = JSON.parse(selectedDoc.documentUrl || "[]");
                            names = JSON.parse(selectedDoc.documentName || "[]");
                            if (!Array.isArray(urls)) throw new Error("not array");
                          } catch {
                            urls = selectedDoc.documentUrl ? [selectedDoc.documentUrl] : [];
                            names = selectedDoc.documentName ? [selectedDoc.documentName] : [];
                          }
                          if (urls.length === 0) return <span className="text-sm text-slate-500">Tidak ada dokumen</span>;
                          return urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors max-w-max">
                              <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">{names[i] || `Buka Dokumen PDF ${i+1}`}</span>
                            </a>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedDocMode === "edit" && <hr className="border-slate-100 mb-8" />}

                {selectedDocMode === "edit" && <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h4 className="text-base font-bold text-slate-800 mb-4">Form Eksekusi Keputusan</h4>
                  <div className="flex gap-4 mb-6 flex-wrap">
                    {isStaff ? (
                      <>
                        <label className={`flex-1 min-w-[200px] flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${decision === "DITERUSKAN" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <input type="radio" name="decision" value="DITERUSKAN" onChange={() => setDecision("DITERUSKAN")} className="w-5 h-5 accent-emerald-600" />
                          <div>
                            <b className="block text-emerald-800">Teruskan ke Atasan</b>
                            <span className="text-xs text-emerald-600/80">Dokumen valid, kirim ke Admin.</span>
                          </div>
                        </label>
                        <label className={`flex-1 min-w-[200px] flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${decision === "PERLU_REVISI" ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <input type="radio" name="decision" value="PERLU_REVISI" onChange={() => setDecision("PERLU_REVISI")} className="w-5 h-5 accent-orange-600" />
                          <div>
                            <b className="block text-orange-800">Kembalikan Revisi</b>
                            <span className="text-xs text-orange-600/80">Dokumen buram/kurang lengkap.</span>
                          </div>
                        </label>
                        <label className={`flex-1 min-w-[200px] flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${decision === "DITOLAK" ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <input type="radio" name="decision" value="DITOLAK" onChange={() => setDecision("DITOLAK")} className="w-5 h-5 accent-red-600" />
                          <div>
                            <b className="block text-red-800">Tolak (Spam)</b>
                            <span className="text-xs text-red-600/80">Permohonan tidak valid.</span>
                          </div>
                        </label>
                      </>
                    ) : (
                      <>
                        <label className={`flex-1 min-w-[200px] flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${decision === "DISETUJUI" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <input type="radio" name="decision" value="DISETUJUI" onChange={() => setDecision("DISETUJUI")} className="w-5 h-5 accent-emerald-600" />
                          <div>
                            <b className="block text-emerald-800">Setujui Permohonan</b>
                            <span className="text-xs text-emerald-600/80">Dokumen disahkan dan selesai.</span>
                          </div>
                        </label>
                        <label className={`flex-1 min-w-[200px] flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${decision === "DITOLAK" ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <input type="radio" name="decision" value="DITOLAK" onChange={() => setDecision("DITOLAK")} className="w-5 h-5 accent-red-600" />
                          <div>
                            <b className="block text-red-800">Tolak Permohonan</b>
                            <span className="text-xs text-red-600/80">Dokumen ditolak permanen.</span>
                          </div>
                        </label>
                      </>
                    )}
                  </div>

                  {(decision === "DITOLAK" || decision === ("PERLU_REVISI")) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Catatan / Alasan <span className="text-red-500">*</span></label>
                      <textarea 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Tuliskan alasan spesifik mengapa surat ini ditolak atau perlu direvisi..."
                        className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                      />
                    </motion.div>
                  )}
                </div>}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                <button onClick={() => setSelectedDoc(null)} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">{selectedDocMode === "edit" ? "Batal" : "Tutup"}</button>
                {selectedDocMode === "edit" && (
                  <button 
                    onClick={handleDecisionSubmit}
                    disabled={!decision || isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Keputusan Akhir"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>
        
        {/* MODAL: PENGATURAN PROFIL INTERNAL */}
        {isProfileModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => {
              const isUnchanged = profileForm.name === currentUser.name && profileForm.email === currentUser.email && profileForm.phone === "";
              if (isUnchanged) setIsProfileModalOpen(false);
            }}
          >
            <section className="bg-white rounded-[24px] p-8 w-full max-w-[500px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Pengaturan Profil</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const actions = await import("@/app/portal/actions");
                  await actions.updateProfile({ name: profileForm.name, email: profileForm.email, phone: profileForm.phone, password: profileForm.password || undefined });
                  alert("Profil diperbarui!");
                  setIsProfileModalOpen(false);
                  router.refresh();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Gagal memperbarui profil.");
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} type="email" required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">No HP</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} type="tel" className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Simpan Perubahan</button>
                </div>
              </form>
            </section>
          </div>
        )}

          {/* USER MANAGEMENT MODALS */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <section className="bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl relative">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Tambah Staf/Admin</h2>
                <form onSubmit={handleAddInternalUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                    <input value={addUserName} onChange={e => setAddUserName(e.target.value)} required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input value={addUserEmail} onChange={e => setAddUserEmail(e.target.value)} type="email" required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Kata Sandi</label>
                    <input value={addUserPassword} onChange={e => setAddUserPassword(e.target.value)} type="password" required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <select value={addUserRole} onChange={e => setAddUserRole(e.target.value)} className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white">
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Batal</button>
                    <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Tambah</button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {isRoleModalOpen && selectedActionUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <section className="bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl relative text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Ubah Role</h2>
                <div className="text-sm text-slate-500 mb-6 space-y-2">
                    <p>Anda akan mengubah hak akses untuk <b>{selectedActionUser.name}</b> menjadi <b>{selectedActionUser.role === 'ADMIN' ? 'STAFF' : 'ADMIN'}</b>.</p>
                    <p className="p-3 bg-amber-50 text-amber-700 rounded-lg text-xs text-left">
                      <b>Perhatian:</b> {selectedActionUser.role === 'ADMIN' ? 'Sebagai STAFF, pengguna ini tidak lagi dapat mengelola pengguna lain atau mengatur sistem secara penuh.' : 'Sebagai ADMIN, pengguna ini akan memiliki akses penuh untuk menghapus, memblokir, dan mengubah role pengguna lain.'}
                    </p>
                    <div className="mt-4 text-left">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Perubahan Role (Opsional)</label>
                      <textarea value={roleReason} onChange={e => setRoleReason(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" rows={2} placeholder="Tulis alasan perubahan..."></textarea>
                    </div>
                  </div>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setIsRoleModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Batal</button>
                  <button onClick={handleEditRole} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Ya, Ubah Role</button>
                </div>
              </section>
            </div>
          )}

          {isBlockModalOpen && selectedActionUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <section className="bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl relative text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedActionUser.isBlocked ? "Buka Blokir Pengguna" : "Blokir Pengguna"}</h2>
                <div className="text-sm text-slate-500 mb-6 space-y-2">
                  <p>Anda akan {selectedActionUser.isBlocked ? "membuka blokir akses" : "memblokir akses"} untuk akun <b>{selectedActionUser.name}</b>.</p>
                  <p className={`p-3 rounded-lg text-xs text-left ${selectedActionUser.isBlocked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    <b>Konsekuensi:</b> {selectedActionUser.isBlocked ? "Pengguna ini akan segera mendapatkan kembali hak akses untuk login dan beraktivitas normal di sistem sesuai rolenya." : "Pengguna ini akan langsung dikeluarkan secara paksa jika sedang login, dan tidak akan bisa masuk ke sistem sampai blokir dibuka kembali. Histori data mereka tetap aman."}
                  </p>
                  <div className="mt-4 text-left">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Tindakan (Opsional)</label>
                    <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" rows={2} placeholder="Tulis alasan tindakan..."></textarea>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setIsBlockModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Batal</button>
                  <button onClick={handleBlockUser} className={`px-6 py-2.5 rounded-xl font-bold text-white ${selectedActionUser.isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                    {selectedActionUser.isBlocked ? "Ya, Buka Blokir" : "Ya, Blokir"}
                  </button>
                </div>
              </section>
            </div>
          )}

          {isDeleteModalOpen && selectedActionUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <section className="bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl relative text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Hapus Pengguna Permanen</h2>
                <div className="text-sm text-slate-500 mb-6 space-y-2">
                  <p>Anda akan menghapus akun <b>{selectedActionUser.name}</b> dari sistem.</p>
                  <p className="p-3 bg-red-50 text-red-700 rounded-lg text-xs text-left border border-red-100">
                    <b>Peringatan Keras:</b> Tindakan ini <u>tidak dapat dibatalkan</u>. Semua data profil pengguna akan musnah secara permanen dari server database. Pastikan Anda tidak salah memilih pengguna!
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Batal</button>
                  <button onClick={handleDeleteUser} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700">Ya, Hapus</button>
                </div>
              </section>
            </div>
          )}

      </div>
    );
}

// Komponen kecil untuk Card
function SummaryCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-slate-500 font-medium text-sm w-2/3">{title}</h4>
        <div className={`p-2.5 rounded-xl ${colors[color as keyof typeof colors]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

// Komponen Status Badge
function StatusBadge({ status }: { status: string }) {
  if (status === "MENUNGGU" || status === "DITERUSKAN" || status === "MENUNGGU_VERIFIKASI") 
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Menunggu</span>;
  if (status === "PERLU_REVISI") 
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Revisi</span>;
  if (status === "DISETUJUI" || status === "SELESAI")
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disetujui</span>;

  if (status === "DITOLAK") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-xs font-bold"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Ditolak</span>;
  return <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{status}</span>;
}



































