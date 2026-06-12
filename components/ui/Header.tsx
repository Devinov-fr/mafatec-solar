import React, { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";

const Header: React.FC = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSolid, setSolid] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setSolid(window.scrollY > 14);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when resizing to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
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
        className={`site-header fixed top-0 left-0 right-0 z-[300] h-[74px] flex items-center bg-white/95 backdrop-blur-[12px] transition-all duration-[0.45s] ease-in-out border-b border-[var(--line-warm)] ${
          isSolid ? "shadow-[0_1px_0_#ececec,0_14px_32px_rgba(15,18,30,0.05)]" : ""
        }`}
      >
        <div className="wrap site-header-in flex items-center justify-between w-full max-w-[1200px] mx-auto px-10">
          {/* Logo */}
          <a href="https://mafatec.com/" className="logo flex-shrink-0">
            <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-6 w-auto" />
          </a>

          {/* Breadcrumbs (Centered) - Hidden on tablet/mobile */}
          <div className="header-nav hidden lg:flex items-center gap-[0.55rem] whitespace-nowrap overflow-hidden">
            <a href="https://solaire.mafatec.com/" className="text-[0.74rem] font-medium tracking-[0.04em] text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Accueil
            </a>
          </div>

          {/* Right Actions */}
          <div className="header-actions flex items-center gap-[1.4rem]">
            <a 
              href="#" 
              className="btn-login flex items-center gap-[0.5rem] font-sans text-[0.76rem] font-semibold tracking-[0.02em] text-white bg-[var(--ink-900)] px-[1.15rem] py-[0.6rem] rounded-[8px] whitespace-nowrap transition-all duration-[0.35s] hover:-translate-y-[2px] hover:bg-[var(--ink-800)]"
            >
              <User className="w-[14px] h-[14px]" strokeWidth={1.8} />
              <span>Connexion</span>
            </a>
            
            {/* Burger Menu - Visible only on tablet and mobile */}
            <button 
              className="lg:hidden p-2 text-[var(--text)] hover:bg-[rgba(0,0,0,0.05)] rounded-lg transition-all duration-200"
              onClick={() => setMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-[999] bg-white transition-all duration-[0.4s] ease-in-out ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        style={{ top: "74px", height: "calc(100vh - 74px)" }}
      >
        <div className="h-full overflow-y-auto px-10 pb-10 pt-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="border-t border-[var(--line-warm)] py-[1.3rem]">
              <h5 className="text-[0.66rem] tracking-[0.22em] uppercase text-[var(--champagne)] mb-4 font-semibold">
                Menu
              </h5>
              <a href="https://solaire.mafatec.com/" className="block font-[var(--serif)] text-[1.5rem] text-[var(--text)] py-3 hover:text-[var(--champagne)] transition-colors">
                Accueil
              </a>
              <a href="#" className="block font-[var(--serif)] text-[1.5rem] text-[var(--text)] py-3 hover:text-[var(--champagne)] transition-colors">
                Connexion &agrave; mon espace
              </a>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" style={{ top: "74px" }} onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
};

export default Header;