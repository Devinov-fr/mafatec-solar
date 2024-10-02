import React, { useState, useRef } from 'react';

const Header: React.FC = () => {
  const [isSubMenuOpen, setSubMenuOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement | null>(null);
  const subMenuRef = useRef<HTMLUListElement | null>(null);

  const handleMouseEnter = () => {
    setSubMenuOpen(true);
  };

  const handleMouseLeave = () => {
    const menu = menuRef.current;
    const subMenu = subMenuRef.current;

    if (menu && subMenu) {
      const isMouseInside =
        menu.contains(document.activeElement) || subMenu.contains(document.activeElement);
      if (!isMouseInside) {
        setSubMenuOpen(false);
      }
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <header className='h-[80px] bg-white pt-4 shadow-md'>
      <div className='max-w-[1200px] mx-auto flex justify-start items-center px-4'>
        <div className='w-[12%]'>
          <img src='/logo-mafatec-2048x423.png' alt='logo' className='max-w-[150px] h-auto' />
        </div>
        <div className='hidden md:flex relative w-[40%]'>
        <ul className='flex justify-center items-center w-[100%] gap-4 text-black'>
            <li className='text-[13px] relative group'>
              <a href='https://mafatec.com/' className='block'>Accueil</a>
             <div className='absolute left-0 h-[2px] bg-[#d32f2f] w-0 transition-all duration-300 group-hover:w-full'></div>
            </li>
            <li
              className='relative text-[13px] group'
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              ref={menuRef}
            >
              <span className='cursor-pointer'>Nos Services</span>
             <div className='absolute left-0 h-[2px] bg-[#d32f2f] w-0 transition-all duration-300 group-hover:w-full'></div>
              {isSubMenuOpen && (
                <ul
                  className='absolute left-0 z-[9999] bg-white shadow-lg mt-2 w-[300px] rounded-lg p-2 text-[1rem]'
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  ref={subMenuRef}
                >
                  <li className='py-1'>
                    <a href='https://mafatec.com/nos-services/solutions-solaires-innovantes-et-certifiees/' className='block px-4 hover:bg-gray-200 text-[14px]'>Solutions Solaires Innovantes et Certifiées</a>
                  </li>
                  <li className='py-1'>
                    <a href='https://mafatec.com/nos-services/audits-energetiques-personnalises/' className='block px-4 hover:bg-gray-200 text-[14px]'>Audits Énergétiques Personnalisés</a>
                  </li>
                  <li className='py-1'>
                    <a href='https://mafatec.com/nos-services/etudes-techniques-electriques-cfo-cfa/' className='block px-4 hover:bg-gray-200 text-[14px]'>Études Techniques Électriques CFO/CFA</a>
                  </li>
                  <li className='py-1'>
                    <a href='https://mafatec.com/nos-services/electricite-cfo-cfa/' className='block px-4 hover:bg-gray-200 text-[14px]'>Électricité CFO/CFA</a>
                  </li>
                  <li className='py-1'>
                    <a href='https://mafatec.com/nos-services/domotique-intelligente/' className='block px-4 hover:bg-gray-200 text-[14px]'>Domotique Intelligente</a>
                  </li>
                  <li className='py-1'>
                    <a href='https://mafatec.com/nos-services/bornes-de-recharge-electrique/' className='block px-4 hover:bg-gray-200 text-[14px]'>Bornes de Recharge Électrique</a>
                  </li>
                </ul>
              )}
            </li>            
            <li className='text-[13px] relative group'>
              <a href='https://mafatec.com/certifications-et-partenariats/' className='block'>Certifications</a>
             <div className='absolute left-0 h-[2px] bg-[#d32f2f] w-0 transition-all duration-300 group-hover:w-full'></div>
            </li>
            <li className='text-[13px] relative group'>
              <a href='https://mafatec.com/a-propos/' className='block'>À propos</a>
              <div className='absolute left-0 h-[2px] bg-[#d32f2f] w-0 transition-all duration-300 group-hover:w-full'></div>
            
            </li>            
            <li className='text-[13px] relative group'>
              <a href='https://mafatec.com/contact/' className='block'>Contact</a>
             <div className='absolute left-0 h-[2px] bg-[#d32f2f] w-0 transition-all duration-300 group-hover:w-full'></div>
            </li>
          </ul>
        </div>
        {/* Mobile Menu Button */}
        <button 
          className='md:hidden p-2 text-gray-600 focus:outline-none'
          onClick={toggleMenu}
        >
          {isMenuOpen ? '✖️' : '☰'}
        </button>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='absolute top-16 left-0 right-0 bg-white shadow-lg z-10'>
            <ul className='flex flex-col items-center gap-2 p-4 text-black'>
              <li className='cursor-pointer'>
                <a href='https://mafatec.com/'>Accueil</a>
              </li>
              <li 
                className='relative cursor-pointer'
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                ref={menuRef}
              >
                <span className='cursor-pointer'>Nos Services</span>
                {isSubMenuOpen && (
                  <ul className='absolute left-0 z-10 bg-white shadow-lg mt-2 w-48 rounded-lg p-2' ref={subMenuRef}>
                    <li className='py-1 cursor-pointer'>
                      <a href='https://mafatec.com/nos-services/solutions-solaires-innovantes-et-certifiees/' className='block px-4 hover:bg-gray-200'>Solutions Solaires Innovantes et Certifiées</a>
                    </li>
                    <li className='py-1 cursor-pointer'>
                      <a href='https://mafatec.com/nos-services/audits-energetiques-personnalises/' className='block px-4 hover:bg-gray-200'>Audits Énergétiques Personnalisés</a>
                    </li>
                    <li className='py-1 cursor-pointer'>
                      <a href='https://mafatec.com/nos-services/etudes-techniques-electriques-cfo-cfa/' className='block px-4 hover:bg-gray-200'>Études Techniques Électriques CFO/CFA</a>
                    </li>
                    <li className='py-1 cursor-pointer'>
                      <a href='https://mafatec.com/nos-services/electricite-cfo-cfa/' className='block px-4 hover:bg-gray-200'>Électricité CFO/CFA</a>
                    </li>
                    <li className='py-1 cursor-pointer'>
                      <a href='https://mafatec.com/nos-services/domotique-intelligente/' className='block px-4 hover:bg-gray-200'>Domotique Intelligente</a>
                    </li>
                    <li className='py-1 cursor-pointer'>
                      <a href='https://mafatec.com/nos-services/bornes-de-recharge-electrique/' className='block px-4 hover:bg-gray-200'>Bornes de Recharge Électrique</a>
                    </li>
                  </ul>
                )}
              </li>  

              <li className='cursor-pointer'>
                <a href='https://mafatec.com/certifications-et-partenariats/'>Certifications</a>
              </li>                          
              <li className='cursor-pointer'>
                <a href='https://mafatec.com/a-propos/'>À propos</a>
              </li>


              <li className='cursor-pointer'>
                <a href='https://mafatec.com/contact/'>Contact</a>
              </li>
            </ul>
          </div>
        )}
        <div className='flex justify-between gap-2 w-[35%]'>
          <button className='p-[10px] w-[220px] rounded-[5px] text-[13px] font-semibold text-white bg-[#d32f2f] cursor-pointer' onClick={() => window.location.href = 'https://mafatec.com/etude/'}>Étude gratuite de production</button>
          <button className='p-[10px] w-[200px] rounded-[5px] text-[13px] font-semibold text-white bg-[#344d95] cursor-pointer' onClick={() => window.location.href = 'https://mafatec.com/contact/'}>Demande de devis</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
