'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, Download, FileText, User as UserIcon, Zap, Calendar, UserCheck, Building } from 'lucide-react';
import { toast } from 'sonner';

export default function MonEspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studies, setStudies] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated') {
      fetchUserProfile();
      fetchStudies();
    }
  }, [status]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/me/profile');
      const data = await res.json();
      if (data.success) {
        setUserProfile(data.user);
      } else {
        toast.error(data.error || 'Erreur lors du chargement du profil');
      }
    } catch (err) {
      toast.error('Une erreur est survenue');
    }
  };

  const fetchStudies = async () => {
    try {
      const res = await fetch('/api/me/studies');
      const data = await res.json();
      if (data.success) {
        setStudies(data.studies);
      } else {
        toast.error(data.error || 'Erreur lors du chargement des études');
      }
    } catch (err) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  const totalPw = studies.reduce((acc, st) => {
    const p = parseFloat(String(st.puissance).replace(',', '.'));
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  const lastStudyDate = studies.length > 0 
    ? new Date(studies[0].createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—';

  // Determine user type
  const isPro = userProfile?.type === 'pro';
  const userTypeLabel = isPro ? 'PRO' : 'Particulier';
  const UserTypeIcon = isPro ? Building : UserCheck;
  
  // Dynamic colors based on user type
  const primaryColor = isPro ? '#3a55b0' : '#c93b18';
  const primaryColorHover = isPro ? '#4a6bd0' : '#e0552e';
  const primaryColorLight = isPro ? 'rgba(58, 85, 176, 0.15)' : 'rgba(201, 59, 24, 0.15)';
  const primaryColorBg = isPro ? 'bg-[#3a55b0]' : 'bg-[#c93b18]';
  const primaryColorHoverBg = isPro ? 'hover:bg-[#4a6bd0]' : 'hover:bg-[#e0552e]';
  const primaryColorText = isPro ? 'text-[#3a55b0]' : 'text-[#c93b18]';
  const primaryColorBorder = isPro ? 'border-[#3a55b0]' : 'border-[#c93b18]';
  const primaryColorFocus = isPro ? 'focus:border-[#3a55b0] focus:shadow-[0_0_0_3px_rgba(58,85,176,0.15)]' : 'focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)]';

  // Get company name if professional
  const companyName = userProfile?.entreprise || userProfile?.company || null;

  return (
    <div className="dash min-h-screen bg-[#f5f5f7] font-sans">
      {/* Topbar */}
      <header className="sp-top sticky top-0 z-50 bg-[rgba(11,14,29,0.96)] backdrop-blur-[18px] text-[#f3efe6] border-b border-[rgba(255,255,255,0.08)]">
        <div className="sp-top-in max-w-[1200px] mx-auto px-[2.2rem] h-[68px] flex items-center justify-between gap-4">
          <a className="sp-brand flex items-center gap-[0.8rem]" href="/">
            <img src="/logo-mafatec-blanc.png" alt="MAFATEC" className="h-[26px]" />
            <span className="sp-divider w-px h-[22px] bg-[rgba(201,169,106,0.28)]"></span>
            <span className="sp-space font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-[#A82E12]">Espace client</span>
          </a>
          <div className="sp-top-right flex items-center gap-[1.3rem]">
            <div className="sp-user flex items-center gap-[0.6rem] text-[0.82rem] text-[rgba(243,239,230,0.62)]">
              <span className="sp-ava w-[30px] h-[30px] rounded-full bg-[#2a2e72] text-white flex items-center justify-center text-[0.72rem] font-bold tracking-[0.02em]">
                {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
              <span className="hidden sm:inline">Bonjour, <strong className="text-[#f3efe6] font-semibold">{session?.user?.name}</strong></span>
            </div>
            <button 
              onClick={handleLogout}
              className="sp-logout inline-flex items-center gap-[0.45rem] text-[0.78rem] font-semibold text-[rgba(243,239,230,0.62)] hover:text-[#A82E12] transition-colors duration-300"
            >
              <LogOut size={15} />
              DÉCONNEXION
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main max-w-[1200px] mx-auto p-[3rem_2.2rem_5rem]">
        <div className="dash-head flex items-end justify-between gap-[1.5rem] flex-wrap mb-[2.4rem]">
          <div>
            <span className="dh-eyebrow inline-flex items-center gap-[0.55rem] font-sans text-[0.64rem] font-bold tracking-[0.2em] uppercase mb-[0.7rem]" style={{ color: primaryColor }}>
              <span className={`mark w-[22px] h-[1.4px]`} style={{ backgroundColor: primaryColor }}></span>
              Tableau de bord
            </span>
            <h1 className="font-serif font-semibold text-[clamp(1.9rem,3.4vw,2.6rem)] tracking-[-0.015em] text-[#15172b] leading-[1.05]">
              Vos études <em className={`not-italic italic ${primaryColorText}`}>photovoltaïques</em>
            </h1>
            <p className="dh-sub text-[0.92rem] text-[#454a63] mt-[0.5rem]">Retrouvez l'ensemble de vos simulations et téléchargez vos rapports.</p>
          </div>
          <a 
            className={`btn-new inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.86rem] p-[0.9rem_1.6rem] rounded-[6px] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] ${primaryColorBg} ${primaryColorHoverBg}`} 
            href="/"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColorHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
          >
            <Plus size={16} />
            Nouvelle étude
          </a>
        </div>

        {/* Stats Strip */}
        <div className="dash-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.1rem] mb-[2.4rem]">
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <FileText size={14} className={primaryColorText} />
              Études réalisées
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{studies.length}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Zap size={14} className={primaryColorText} />
              Puissance cumulée
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">
              {totalPw % 1 === 0 ? totalPw : totalPw.toFixed(1)}<small className="font-sans text-[0.8rem] font-medium text-[#7a7e95] ml-[0.25rem]">kWc</small>
            </div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Calendar size={14} className={primaryColorText} />
              Dernière étude
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{lastStudyDate}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <UserTypeIcon size={14} className={primaryColorText} />
              Profil
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">
              {isPro ? (
                <div className="flex items-center gap-2">
                  
                  <span className="text-[1.9rem]">{userTypeLabel}</span>
                </div>
              ) : (
                <span>{userTypeLabel}</span>
              )}
              {companyName && (
                <span className="block text-[0.8rem] font-sans font-normal text-[#7a7e95] mt-[0.1rem]">
                  {companyName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="studies-panel bg-white border border-[#e8e8ea] rounded-[18px] overflow-hidden shadow-[0_18px_50px_rgba(11,14,29,0.12)]">
          <div className="sp-h flex items-center justify-between p-[1.3rem_1.7rem] border-b border-[#e8e8ea]">
            <h2 className="font-serif font-semibold text-[1.2rem] text-[#15172b] tracking-[-0.01em]">Mes études</h2>
            <span className="sp-count text-[0.76rem] text-[#7a7e95] font-semibold">{studies.length} étude{studies.length > 1 ? 's' : ''}</span>
          </div>
          
          <div id="list">
            {studies.length === 0 ? (
              <div className="dash-empty text-center p-[4rem_2rem]">
                <div className="de-ic w-[64px] h-[64px] rounded-full mx-auto mb-[1.4rem] bg-[#f5f5f7] border border-[#e8e8ea] flex items-center justify-center text-[#7a7e95]">
                  <FileText size={28} />
                </div>
                <h3 className="font-serif font-medium text-[1.3rem] text-[#15172b] mb-[0.5rem]">Aucune étude pour le moment</h3>
                <p className="text-[0.88rem] text-[#454a63] max-w-[42ch] mx-auto mb-[1.6rem] leading-[1.6]">
                  Lancez votre première étude photovoltaïque gratuite : elle apparaîtra ici, avec son rapport téléchargeable.
                </p>
                <a 
                  className={`btn-new inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.86rem] p-[0.9rem_1.6rem] rounded-[6px] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] ${primaryColorBg} ${primaryColorHoverBg}`}
                  href="/"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColorHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                >
                  <Plus size={16} />
                  Lancer une étude
                </a>
              </div>
            ) : (
              studies.map((study) => (
                <div key={study._id} className="study-row flex items-center gap-[1.3rem] p-[1.3rem_1.7rem] border-b border-[#e8e8ea] last:border-b-0 hover:bg-[#f5f5f7] transition-colors duration-300">
                  <span className={`sr-ic w-[48px] h-[48px] shrink-0 rounded-[12px] ${primaryColorBg} text-white flex items-center justify-center`}>
                    <Zap size={24} />
                  </span>
                  <div className="sr-body flex-1 min-w-0">
                    <div className="sr-title text-[0.96rem] font-bold text-[#15172b] tracking-[-0.005em] line-clamp-1">
                      Étude installation PV <span className={primaryColorText}>{study.puissance} kWc</span>
                    </div>
                    <div className="sr-meta flex items-center gap-[0.55rem] flex-wrap text-[0.8rem] text-[#454a63] mt-[0.3rem]">
                      <span className="line-clamp-1">{study.adresse}</span>
                      <span className="sr-sep w-[3px] h-[3px] rounded-full bg-[#7a7e95] shrink-0"></span>
                      <span className="text-[#7a7e95]">Réalisée le {new Date(study.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <a 
                    className={`sr-dl inline-flex items-center gap-[0.55rem] shrink-0 font-sans font-semibold text-[0.8rem] p-[0.7rem_1.25rem] rounded-[6px] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] ${primaryColorBg} ${primaryColorHoverBg}`}
                    href={`/rapport?id=${study._id}`}
                    target="_blank"
                    style={{ backgroundColor: primaryColor }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColorHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                  >
                    <Download size={15} />
                    TÉLÉCHARGER LE RAPPORT
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}