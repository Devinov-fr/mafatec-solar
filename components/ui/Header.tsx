import { X } from "lucide-react";
import React, { useState, useRef } from "react";

const Header: React.FC = () => {
  const [isSubMenuOpen, setSubMenuOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement | null>(null);
  const subMenuRef = useRef<HTMLUListElement | null>(null);

 const handleMouseEnter = () => setSubMenuOpen(true);
const handleMouseLeave = () => setSubMenuOpen(false);


  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <header className="h-[80px] bg-white pt-4 shadow-md">
      <div className="max-w-[1200px] mx-auto flex items-center px-4 gap-4">
        {/* LOGO à gauche */}
        <div className="flex-none w-[150px]">
          <a href="https://mafatec.com/" aria-label="Retour à l'accueil">
            <img
              src="/logo-mafatec-2048x423.png"
              alt="logo Mafatec"
              className="max-w-[150px] h-auto"
            />
          </a>
        </div>

        {/* GROUPE NAV + BOUTONS à droite (desktop) */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {/* NAV */}
          <nav onMouseLeave={handleMouseLeave}>
            <ul className="flex items-center gap-6 text-black">
              {/* Accueil */}
              <li className="text-[15px] relative group font-bold">
                <a href="https://mafatec.com/" className="block">
                  Accueil
                </a>
                {/* Soulignement animé depuis le centre */}
                <div
                  className="
                    pointer-events-none
                    absolute left-1/2 -translate-x-1/2 -bottom-[3px]
                    h-[2px] bg-[#d32f2f] rounded-full
                    w-0
                    transition-all duration-300
                    group-hover:w-[60%]
                  "
                />
              </li>

              {/* séparateur vertical entre Accueil et À propos */}
              <span
                aria-hidden="true"
                className="h-5 w-px bg-slate-300/70"
              />

              {/* À propos */}
              <li className="text-[15px] font-bold relative group">
                <a href="https://mafatec.com/a-propos/" className="block">
                  À propos
                </a>
                <div
                  className="
                    pointer-events-none
                    absolute left-1/2 -translate-x-1/2 -bottom-[3px]
                    h-[2px] bg-[#d32f2f] rounded-full
                    w-0
                    transition-all duration-300
                    group-hover:w-[60%]
                  "
                />
              </li>

              {/* séparateur vertical entre À propos et Nos services */}
              <span
                aria-hidden="true"
                className="h-5 w-px bg-slate-300/70"
              />

             
              {/* Nos services + sous-menu */}
<li
  className="relative text-[15px] group font-bold"
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  ref={menuRef}
>
  <span className="cursor-pointer inline-flex items-center gap-2">
    Nos services
    <span
      className="inline-block h-[6px] w-[6px] border-b-[2px] border-r-[2px] border-[#d32f2f] 
                 rotate-45 transition-transform duration-300 group-hover:translate-y-[2px]"
    />
  </span>

  {/* Soulignement animé depuis le centre */}
  <div
    className={`
      pointer-events-none
      absolute left-1/2 -translate-x-1/2 -bottom-[2px]
      h-[2px] bg-[#d32f2f] rounded-full
      w-[60%]
      origin-center
      will-change-transform
      transition-transform duration-300
      ${isSubMenuOpen ? "scale-x-100" : "scale-x-0"}
    `}
  />

  {isSubMenuOpen && (
    <div
      className="
        absolute left-1/2 -translate-x-1/2 top-full
        z-[9999]
      "
      // (optionnel, tu peux enlever ces 2 handlers si tu veux garder seulement ceux du <li>)
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bande transparente pour coller au texte, mais garder le hover */}
      <div className="h-3 w-full bg-transparent" />

      {/* Bloc réel du sous-menu */}
      <ul
        className="
          w-[320px] rounded-xl
          bg-white/95 backdrop-blur-md shadow-[0_16px_40px_rgba(15,23,42,0.18)]
          border border-slate-100/80 p-2.5 text-[0.9rem]
        "
        ref={subMenuRef}
      >
        {[
          {
            href: "https://mafatec.com/nos-services/solutions-solaires-innovantes-et-certifiees/",
            label: "Solutions Solaires Innovantes et Certifiées",
          },
          {
            href: "https://mafatec.com/nos-services/audits-energetiques-personnalises/",
            label: "Audits Énergétiques Personnalisés",
          },
          {
            href: "https://mafatec.com/nos-services/etudes-techniques-electriques-cfo-cfa/",
            label: "Études Techniques Électriques CFO/CFA",
          },
          {
            href: "https://mafatec.com/nos-services/electricite-cfo-cfa/",
            label: "Électricité CFO/CFA",
          },
          {
            href: "https://mafatec.com/nos-services/domotique-intelligente/",
            label: "Domotique Intelligente",
          },
          {
            href: "https://mafatec.com/nos-services/bornes-de-recharge-electrique/",
            label: "Bornes de Recharge Électrique",
          },
        ].map((item) => (
          <li key={item.href} className="py-1">
            <a
              href={item.href}
              className="
                flex items-start gap-2 px-3 py-1.5 rounded-md
                text-[13px] text-black
                hover:bg-[#0f427c0d] hover:text-[#0f427c]
                border-l-[2px] border-transparent
                transition-colors duration-200
              "
            >
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )}
</li>

            </ul>
          </nav>

          {/* petit séparateur AVANT les boutons (10px de haut) */}
          <span
            aria-hidden="true"
            className="h-8 w-[0.5px] bg-slate-300/80"
          />

          {/* BOUTONS à droite (desktop, lg+) */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              className="p-[10px] w-[170px] rounded-[5px] text-[13px] font-bold text-white bg-[#d32f2f] cursor-pointer"
              onClick={() =>
                (window.location.href = "https://simulateur-cee.mafatec.com/")
              }
            >
              Simulateur CEE
            </button>
            <button
              className="p-[10px] w-[170px] rounded-[5px] text-[13px] font-bold text-white bg-[#344d95] cursor-pointer"
              onClick={() =>
                (window.location.href = "https://mafatec.com/contact/")
              }
            >
              Demande de devis
            </button>
          </div>
        </div>

        {/* BOUTON MOBILE (hamburger) à droite sur mobile */}
        <button
          className="md:hidden p-2 text-gray-600 focus:outline-none ml-auto"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X /> : "☰"}
        </button>
      </div>

      {/* MENU MOBILE */}
      {isMenuOpen && (
  <div
    className="
      fixed inset-x-0 top-[80px] bottom-0
      bg-white z-[2000] shadow-lg
      overflow-y-auto
    "
  >
    <ul className="flex flex-col items-center gap-2 p-4 text-black">
      <li className="cursor-pointer">
        <a href="https://mafatec.com/">Accueil</a>
      </li>

      <li className="cursor-pointer">
        <a href="https://mafatec.com/a-propos/">À propos</a>
      </li>
      <li className="relative cursor-pointer">
        <span className="cursor-pointer">Nos services</span>

        {/* 👉 en mobile, on peut garder un sous-menu simple en colonne */}
        {isSubMenuOpen && (
          <ul className="mt-2 w-full max-w-xs bg-white rounded-lg border border-slate-200 shadow-md">
            <li className="py-1 cursor-pointer">
              <a
                href="https://mafatec.com/nos-services/solutions-solaires-innovantes-et-certifiees/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Solutions Solaires Innovantes et Certifiées
              </a>
            </li>
            <li className="py-1 cursor-pointer">
              <a
                href="https://mafatec.com/nos-services/audits-energetiques-personnalises/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Audits Énergétiques Personnalisés
              </a>
            </li>
            <li className="py-1 cursor-pointer">
              <a
                href="https://mafatec.com/nos-services/etudes-techniques-electriques-cfo-cfa/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Études Techniques Électriques CFO/CFA
              </a>
            </li>
            <li className="py-1 cursor-pointer">
              <a
                href="https://mafatec.com/nos-services/electricite-cfo-cfa/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Électricité CFO/CFA
              </a>
            </li>
            <li className="py-1 cursor-pointer">
              <a
                href="https://mafatec.com/nos-services/domotique-intelligente/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Domotique Intelligente
              </a>
            </li>
            <li className="py-1 cursor-pointer">
              <a
                href="https://mafatec.com/nos-services/bornes-de-recharge-electrique/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Bornes de Recharge Électrique
              </a>
            </li>
          </ul>
        )}
      </li>

      
    </ul>

    {/* Boutons sous le menu en mobile */}
    <div className="flex flex-col lg:hidden justify-center gap-2 w-full pb-10">
      <button
        className="p-[10px] mx-auto w-[200px] rounded-[5px] text-[13px] font-semibold text-white bg-[#d32f2f] cursor-pointer"
        onClick={() =>
          (window.location.href = "https://simulateur-cee.mafatec.com/")
        }
      >
        Simulateur CEE
      </button>
      <button
        className="p-[10px] mx-auto w-[200px] rounded-[5px] text-[13px] font-semibold text-white bg-[#344d95] cursor-pointer"
        onClick={() =>
          (window.location.href = "https://mafatec.com/contact/")
        }
      >
        Demande de devis
      </button>
    </div>
  </div>
)}

    </header>
  );
};

export default Header;
