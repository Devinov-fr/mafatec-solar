import React from "react";
import { Check } from "lucide-react";

const Hero = () => {
  return (
    <header className="tool-hero grain relative overflow-hidden bg-[var(--ink-900)] text-[var(--on-dark)] pt-[10.5rem] pb-[5rem]">
      {/* Glow Effects (Custom Background) */}
      <div className="tool-hero-bg absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_70%_at_84%_24%,rgba(201,59,24,0.18)_0%,transparent_60%),radial-gradient(ellipse_62%_64%_at_10%_96%,rgba(42,46,114,0.5)_0%,transparent_60%)]" />

      <div className="wrap relative z-[2] max-w-[1200px] mx-auto px-10">
        <div className="max-w-[880px]">
          {/* Eyebrow */}
          <span className="eyebrow mb-[1.8rem] text-[var(--champagne-soft)] flex items-center gap-[0.6rem] font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase">
            <span className="mark w-[26px] h-px bg-[var(--champagne-soft)]" />
            Outil en ligne · 100% gratuit
          </span>

          {/* Title */}
          <h1 className="display text-[clamp(2.3rem,4.4vw,3.8rem)] leading-[1.1] tracking-[-0.015em] text-[var(--on-dark)] mb-[2.5rem] font-[var(--head)] font-semibold">
            Étude photovoltaïque professionnelle —<br />
            votre analyse de production <em className="italic text-[var(--champagne-soft)] not-italic-sans">offerte</em>
          </h1>

          {/* Lead */}
          <p className="tool-hero-lead text-[1.12rem] leading-[1.78] text-[var(--on-dark-soft)] max-w-[660px] mb-[2.4rem]">
            Un outil rapide, précis et sans engagement, conçu pour estimer votre production solaire 
            avec fiabilité et optimiser votre projet. Les résultats clés de votre toiture, 
            calculés selon les données d&apos;irradiation officielles.
          </p>

          {/* Features */}
          <div className="tool-hero-feats flex flex-wrap gap-x-[1.8rem] gap-y-[0.7rem]">
            {[
              "Résultat immédiat",
              "Estimation précise",
              "Sans engagement"
            ].map((feat) => (
              <span key={feat} className="inline-flex items-center gap-[0.5rem] text-[0.84rem] text-[var(--on-dark)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px] text-[var(--champagne-soft)]">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
