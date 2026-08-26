import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./history-table";

const nav = [["Beranda", "/"], ["Ajukan Surat", "/ajukan-surat"], ["Lacak Surat", "/lacak-surat"], ["Riwayat Surat", "/riwayat-surat"]];
export function SapaLogo() { return <Link href="/" className="brand"><span className="sapa-mark">S</span><span>SAPA</span></Link>; }

export async function SiteHeader({ active }: { active?: string }) { 
  const user = await getCurrentUser();
  
  return (
    <header className="site-header">
      <SapaLogo />
      <nav>{nav.map(([label, href]) => <Link className={active === label ? "active" : ""} href={href} key={label}>{label}</Link>)}</nav>
      <div className="nav-actions">
        {user ? (
          <div className="user-profile-menu">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span className="user-name">{user.name.split(" ")[0]}</span>
            <LogoutButton />
          </div>
        ) : (
          <>
            <Link className="text-link" href="/masuk">Masuk</Link>
            <Link className="button button-gold small-button" href="/daftar">Daftar</Link>
          </>
        )}
      </div>
    </header>
  ); 
}
