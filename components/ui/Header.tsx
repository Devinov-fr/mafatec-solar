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
        className={`fixed top-0 left-0 right-0 z-[300] h-[74px] flex items-center justify-between px-[1rem] sm:px-[1.5rem] md:px-[2.2rem] gap-[1.5rem] transition-all duration-[0.45s] ease-in-out bg-white border-b border-[#e6e6e6] ${
          isSolid ? "shadow-[0_1px_0_#ececec,0_14px_32px_rgba(15,18,30,0.05)]" : ""
        }`}
      >
        {/* Logo */}
        <a href="https://mafatec.com/" className="flex-shrink-0 flex items-center">
          <img
            src="/logo-mafatec-2048x423.png"
            alt="MAFATEC"
            className="h-6 w-auto"
          />
        </a>

        {/* Breadcrumbs (Centered) - Hidden on tablet/mobile */}
        <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 hidden lg:flex items-center gap-[0.55rem] whitespace-nowrap max-w-[58%] overflow-hidden">
          <a href="https://mafatec.com/" className="text-[0.74rem] font-medium tracking-[0.04em] text-[#7a7e95] hover:text-[#15172b] transition-colors">
            Accueil
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-[0.75rem] sm:gap-[1.4rem] flex-shrink-0">
          {/* Login Button - Visible on all devices, next to burger menu on mobile */}
          <a 
            href="#" 
            className="flex items-center gap-[0.5rem] font-sans text-[0.76rem] font-semibold tracking-[0.02em] text-white bg-[#0b0e1d] px-[0.9rem] sm:px-[1.15rem] py-[0.55rem] sm:py-[0.6rem] rounded-[8px] whitespace-nowrap transition-all duration-[0.35s] hover:-translate-y-[2px] hover:bg-[#141832]"
          >
            <User className="w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" strokeWidth={1.8} />
            <span className="text-[0.7rem] sm:text-[0.76rem]">Connexion</span>
          </a>
          
          {/* Burger Menu - Visible only on tablet and mobile (max-width: 1023px) */}
          <button 
            className="lg:hidden p-2 text-[#15172b] hover:bg-[rgba(0,0,0,0.05)] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a8884a] relative z-[301]"
            onClick={() => setMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay - Highest z-index to appear on top of everything */}
      <div 
        className={`lg:hidden fixed inset-0 z-[999] bg-white transition-all duration-[0.4s] ease-in-out ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        style={{
          top: isMenuOpen ? "74px" : "74px",
          height: isMenuOpen ? "calc(100vh - 74px)" : "calc(100vh - 74px)",
        }}
      >
        <div className="h-full overflow-y-auto px-[1.5rem] sm:px-[2rem] pb-[2rem] pt-[2rem]">
          <div className="max-w-[1200px] mx-auto">
            <div className="border-t border-[#e8e8ea] py-[1.3rem]">
              <h5 className="text-[0.66rem] tracking-[0.22em] uppercase text-[#a8884a] mb-4 font-semibold">
                Menu
              </h5>
              <a 
                href="https://solaire.mafatec.com/" 
                className="block font-serif text-[1.5rem] text-[#15172b] py-3 hover:text-[#a8884a] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Accueil
              </a>
              <a 
                href="#" 
                className="block font-serif text-[1.5rem] text-[#15172b] py-3 hover:text-[#a8884a] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Connexion à mon espace
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay - Also on top but below the menu */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
          style={{ top: "74px" }}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Header;