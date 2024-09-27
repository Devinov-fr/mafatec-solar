import React from 'react'

const Footer = () => {
  return (
    <footer className='w-full p-10 bg-[#0F427C]'>
      <div className='flex justify-center py-4'>
        <img className="lg:w-[10%] w-[40%]" src='/Footer_logo.png'   />
      </div>
      <div className='flex justify-center gap-10 lg:flex-row flex-col pb-2 text-white'>
        <p>Certifications</p>
        <p>Démarches Administratives</p>
        <p>Contact</p>
        <p>Mentions légales</p>
        <p>Politique de confidentialité</p>
      </div>
      <div className='p-2 w-[60%] mx-auto border-b border-b-white text-white '></div>
      <p className='text-center text-white py-4'>MAFATEC © 2024. All rights reserved.</p>
    </footer>
  )
}

export default Footer