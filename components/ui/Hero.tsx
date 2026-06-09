import React from "react";
import { Check } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#0b0e1d] text-[#f3efe6] pt-[10.5rem] pb-[5rem] grain">
      {/* Glow Effects (Custom Background) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_70%_at_84%_24%,rgba(201,59,24,0.18)_0%,transparent_60%),radial-gradient(ellipse_62%_64%_at_10%_96%,rgba(42,46,114,0.5)_0%,transparent_60%)]" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-10">
        <div className="max-w-[880px]">
          {/* Eyebrow */}
          <div className="flex items-center gap-[0.6rem] mb-[1.8rem] reveal in">
            <span className="w-[26px] h-[1px] bg-[#c9a96a]" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[#e3cfa3]">
              Outil en ligne · 100% gratuit
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[clamp(2.3rem,4.4vw,3.8rem)] leading-[1.1] tracking-[-0.015em] text-[#f3efe6] mb-[2.5rem] reveal in d1">
            Étude photovoltaïque professionnelle —<br />
            votre analyse de production <em className="italic text-[#e3cfa3]">offerte</em>
          </h1>

          {/* Lead */}
          <p className="text-[1.12rem] leading-[1.78] text-[rgba(243,239,230,0.62)] max-w-[660px] mb-[2.4rem] reveal in d2">
            Un outil rapide, précis et sans engagement, conçu pour estimer votre production solaire 
            avec fiabilité et optimiser votre projet. Les résultats clés de votre toiture, 
            calculés selon les données d&apos;irradiation officielles.
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-x-[1.8rem] gap-y-[0.7rem] reveal in d3">
            {[
              "Résultat immédiat",
              "Estimation précise",
              "Sans engagement"
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-[0.5rem]">
                <Check className="w-[16px] h-[16px] text-[#e3cfa3]" strokeWidth={2.2} />
                <span className="text-[0.84rem] text-[#f3efe6] font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
