import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PortalClient from "@/components/portal/PortalClient";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    redirect("/portal/login");
  }

  // Ambil semua data untuk Dashboard/Portal
  const submissionsData = await prisma.submission.findMany({
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      statusLogs: { orderBy: { createdAt: "asc" } }
    },
    orderBy: { createdAt: "desc" },
  });

  const usersData = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, phone: true, isBlocked: true }
  });

  const activitiesData = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      actor: { select: { name: true, role: true } }
    }
  });

  // Serialize dates untuk dikirim ke Client
  const submissions = submissionsData.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    statusLogs: s.statusLogs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() }))
  }));

  const activities = activitiesData.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString()
  }));

  const users = usersData.map(u => ({
    ...u,
    status: "Aktif" // Dummy since we don't have isBlocked yet in DB
  }));

  return (
    <PortalClient 
      currentUser={{ id: user.id, name: user.name, email: user.email, role: user.role, isBlocked: user.isBlocked }}
      initialSubmissions={submissions}
      initialUsers={users}
      initialActivities={activities}
    />
  );
}
