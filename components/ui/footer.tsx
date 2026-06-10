import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 py-6 bg-white">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between text-[#4a5568] text-sm">
        
        {/* Left: Address */}
        <div>
          12 Rue Paul Langevin, 93270 Sevran
        </div>

        {/* Center: Certifications */}
        <div className="font-medium text-[#2d3748]">
          RGE · Qualifelec · Qualit'EnR · IRVE · KNX
        </div>

        <div></div>

        {/* Right: Links 
        <div className="flex items-center gap-6">
          <a href="/mon-espace" className="hover:text-black transition-colors">Mon espace</a>
          <a href="/demo-espaces" className="hover:text-black transition-colors">Démo espaces</a>
          <a href="/passation-dev" className="hover:text-black transition-colors">Passation dev</a>
        </div>*/}
        
      </div>
    </footer>
  );
};

export default Footer;