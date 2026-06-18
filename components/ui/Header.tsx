'use client';

import React, { useState, useEffect } from "react";
import { Menu, X, User, LogOut, ChevronRight } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const Header: React.FC = () => {
  const { data: session } = useSession();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSolid, setSolid] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setSolid(window.scrollY > 14);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header 
        className={`site-header fixed top-0 left-0 right-0 z-[300] h-[74px] flex items-center transition-all duration-[0.45s] ease-lux border-b ${
          isSolid 
            ? "bg-white/95 backdrop-blur-[12px] border-[#e8e8ea] shadow-[0_1px_0_#ececec,0_14px_32px_rgba(15,18,30,0.05)]" 
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="wrap site-header-in flex items-center justify-between w-full max-w-[1200px] mx-auto px-10">
          {/* Logo */}
          <Link href="/" className="logo flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]">
            <img src={isSolid ? "/logo-mafatec-2048x423.png" : "/logo-mafatec-blanc.png"} alt="MAFATEC" className="h-6 w-auto" />
          </Link>

          {/* Nav */}
          <nav className="header-nav hidden lg:flex items-center gap-[1.5rem]">
            <Link href="/" className={`text-[0.74rem] font-bold tracking-[0.06em] uppercase transition-colors ${isSolid ? "text-[#7a7e95] hover:text-[#15172b]" : "text-white/70 hover:text-white"}`}>
              Accueil
            </Link>
            <Link href="/#results" className={`text-[0.74rem] font-bold tracking-[0.06em] uppercase transition-colors ${isSolid ? "text-[#7a7e95] hover:text-[#15172b]" : "text-white/70 hover:text-white"}`}>
              Résultats
            </Link>
          </nav>

          {/* Actions */}
          <div className="header-actions flex items-center gap-[1.4rem]">
            {session ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/mon-espace" 
                  className={`flex items-center gap-[0.5rem] font-sans text-[0.76rem] font-bold tracking-[0.02em] px-[1.15rem] py-[0.6rem] rounded-[8px] whitespace-nowrap transition-all duration-[0.35s] ${
                    isSolid 
                      ? "text-[#0b0e1d] border border-[#e8e8ea] hover:bg-slate-50" 
                      : "text-white border border-white/20 hover:bg-white/10"
                  }`}
                >
                  <User className="w-[14px] h-[14px]" strokeWidth={2} />
                  <span>MON ESPACE</span>
                </Link>
                <button 
                  onClick={() => signOut()}
                  className={`p-2 transition-colors ${isSolid ? "text-[#7a7e95] hover:text-[#c93b18]" : "text-white/60 hover:text-white"}`}
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className={`btn-login flex items-center gap-[0.5rem] font-sans text-[0.76rem] font-bold tracking-[0.04em] px-[1.15rem] py-[0.6rem] rounded-[8px] whitespace-nowrap transition-all duration-[0.35s] hover:-translate-y-[2px] ${
                  isSolid 
                    ? "text-white bg-[#0b0e1d] hover:bg-[#141832]" 
                    : "text-[#0b0e1d] bg-[#e3cfa3] hover:bg-[#f3efe6]"
                }`}
              >
                <User className="w-[14px] h-[14px]" strokeWidth={2} />
                <span>CONNEXION</span>
              </Link>
            )}
            
            {/* Burger */}
            <button 
              className={`lg:hidden p-2 rounded-lg transition-all duration-200 ${isSolid ? "text-[#15172b] hover:bg-black/5" : "text-white hover:bg-white/10"}`}
              onClick={() => setMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden fixed inset-0 z-[999] bg-[#0b0e1d] text-white transition-all duration-[0.4s] ease-lux ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        style={{ top: "74px", height: "calc(100vh - 74px)" }}
      >
        <div className="h-full overflow-y-auto px-10 pb-10 pt-8 grain">
          <div className="max-w-[1200px] mx-auto">
            <div className="border-t border-white/10 py-[1.3rem]">
              <h5 className="text-[0.66rem] tracking-[0.22em] uppercase text-[#c9a96a] mb-6 font-bold">
                Navigation
              </h5>
              <div className="flex flex-col gap-4">
                <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center justify-between font-serif text-[1.8rem] py-2 group">
                  <span>Accueil</span>
                  <ChevronRight className="opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#c9a96a]" />
                </Link>
                {session ? (
                  <Link href="/mon-espace" onClick={() => setMenuOpen(false)} className="flex items-center justify-between font-serif text-[1.8rem] py-2 group">
                    <span>Mon espace client</span>
                    <ChevronRight className="opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#c9a96a]" />
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-between font-serif text-[1.8rem] py-2 group">
                    <span>Connexion</span>
                    <ChevronRight className="opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#c9a96a]" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm" style={{ top: "74px" }} onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
};

export default Header;
