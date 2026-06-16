import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer border-t border-[var(--line-warm)] py-10 bg-white">
      <div className="wrap site-footer-in max-w-[1200px] mx-auto px-10 flex flex-col md:flex-row items-center justify-between gap-6 text-[var(--text-soft)] text-[0.82rem]">

        {/* Left: Address */}
        <div className="footer-addr">
          12 Rue Paul Langevin, 93270 Sevran
        </div>

        {/* Center: Certifications */}
        <div className="footer-certs font-semibold text-[var(--text)]">
          RGE · Qualifelec · Qualit&apos;EnR · IRVE · KNX
        </div>

        <div className="footer-logo"> </div>

        {/* Right: Logo 
        <div className="footer-logo">
          <img src="/logo-mafatec-2048x423.png" alt="MAFATEC" className="h-4 w-auto opacity-80 grayscale" />
        </div>
        */}
      </div>
    </footer>
  );
};

export default Footer;