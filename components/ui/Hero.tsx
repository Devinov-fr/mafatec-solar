import React from "react";

const Hero = () => {
  return (
    <section
      className='relative h-[400px] flex items-center bg-center bg-cover bg-no-repeat bg-[url("/header-home-mafatec.jpg")]'
    >
      {/* Overlay dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/75" />

      {/* Conteneur global */}
      <div className="relative z-10 w-full">
        {/* Texte aligné à gauche, avec largeur max */}
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
          <div className="max-w-[900px]">
            <h1 className="text-white font-semibold leading-tight text-[1.9rem] md:text-[2.4rem] lg:text-[2.7rem]">
              Étude Photovoltaïque Professionnelle —{" "}
              <span className="text-[#d32f2f]">
                Votre Analyse de Production Offerte
              </span>
            </h1>

            <p className="mt-4 text-sm md:text-[15px] text-slate-100">
              Outil 100% gratuit, rapide, précis et sans engagement, conçu pour
              estimer votre production solaire avec fiabilité et optimiser votre
              projet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
