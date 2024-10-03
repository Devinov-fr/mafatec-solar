import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Get the current year dynamically

  return (
    <footer className='w-full p-6 bg-[#0F427C] text-[12px]'>
      <div className='flex justify-center pb-4'>
        <img className="lg:w-[10%] w-[40%]" src='/Footer_logo.png' alt="Footer Logo" />
      </div>
      <div className='flex justify-center gap-10 lg:flex-row flex-col text-center pb-2 text-white'>
        <a href="https://mafatec.com/certifications-et-partenariats/" className="hover:underline">Certifications</a>
        <a href="https://mafatec.com/demarches-administratives" className="hover:underline">Démarches Administratives</a>
        <a href="https://mafatec.com/contact" className="hover:underline">Contact</a>
        <a href="https://mafatec.com/mentions-legales" className="hover:underline">Mentions légales</a>
        <a href="https://mafatec.com/politique-de-confidentialite" className="hover:underline">Politique de confidentialité</a>
      </div>
      <div className='p-2 w-[30%] mx-auto border-b border-b-white text-white '></div>
      <p className='text-center text-white pt-4 text-[10px]'>
        {currentYear} <a href="https://mafatec.com/" className="text-white hover:underline">MAFATEC</a>. All rights reserved
      </p> 
    </footer>
  );
};

export default Footer;
