'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, Download, FileText, User as UserIcon, Zap, Calendar, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function MonEspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated') {
      fetchStudies();
    }
  }, [status]);

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

  return (
    <div className="dash min-h-screen bg-[#f5f5f7] font-sans">
      {/* Topbar */}
      <header className="sp-top sticky top-0 z-50 bg-[rgba(11,14,29,0.96)] backdrop-blur-[18px] text-[#f3efe6] border-b border-[rgba(255,255,255,0.08)]">
        <div className="sp-top-in max-w-[1200px] mx-auto px-[2.2rem] h-[68px] flex items-center justify-between gap-4">
          <a className="sp-brand flex items-center gap-[0.8rem]" href="/">
            <img src="/logo-mafatec-blanc.png" alt="MAFATEC" className="h-[26px]" />
            <span className="sp-divider w-px h-[22px] bg-[rgba(201,169,106,0.28)]"></span>
            <span className="sp-space font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-[#e3cfa3]">Espace client</span>
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
              className="sp-logout inline-flex items-center gap-[0.45rem] text-[0.78rem] font-semibold text-[rgba(243,239,230,0.62)] hover:text-[#e3cfa3] transition-colors duration-300"
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
            <span className="dh-eyebrow inline-flex items-center gap-[0.55rem] font-sans text-[0.64rem] font-bold tracking-[0.2em] uppercase text-[#c93b18] mb-[0.7rem]">
              <span className="mark w-[22px] h-[1.4px] bg-[#c93b18]"></span>
              Tableau de bord
            </span>
            <h1 className="font-serif font-semibold text-[clamp(1.9rem,3.4vw,2.6rem)] tracking-[-0.015em] text-[#15172b] leading-[1.05]">
              Vos études <em className="not-italic italic text-[#c93b18]">photovoltaïques</em>
            </h1>
            <p className="dh-sub text-[0.92rem] text-[#454a63] mt-[0.5rem]">Retrouvez l'ensemble de vos simulations et téléchargez vos rapports.</p>
          </div>
          <a className="btn-new inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.86rem] p-[0.9rem_1.6rem] rounded-[6px] bg-[#c93b18] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#e0552e]" href="/">
            <Plus size={16} />
            Nouvelle étude
          </a>
        </div>

        {/* Stats Strip */}
        <div className="dash-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.1rem] mb-[2.4rem]">
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <FileText size={14} className="text-[#c93b18]" />
              Études réalisées
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{studies.length}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Zap size={14} className="text-[#c93b18]" />
              Puissance cumulée
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">
              {totalPw % 1 === 0 ? totalPw : totalPw.toFixed(1)}<small className="font-sans text-[0.8rem] font-medium text-[#7a7e95] ml-[0.25rem]">kWc</small>
            </div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Calendar size={14} className="text-[#c93b18]" />
              Dernière étude
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{lastStudyDate}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <UserCheck size={14} className="text-[#c93b18]" />
              Profil
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">Particulier</div>
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
                <a className="btn-new inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.86rem] p-[0.9rem_1.6rem] rounded-[6px] bg-[#c93b18] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#e0552e]" href="/">
                  <Plus size={16} />
                  Lancer une étude
                </a>
              </div>
            ) : (
              studies.map((study) => (
                <div key={study._id} className="study-row flex items-center gap-[1.3rem] p-[1.3rem_1.7rem] border-b border-[#e8e8ea] last:border-b-0 hover:bg-[#f5f5f7] transition-colors duration-300">
                  <span className="sr-ic w-[48px] h-[48px] shrink-0 rounded-[12px] bg-[#0b0e1d] text-[#e3cfa3] flex items-center justify-center">
                    <Zap size={24} />
                  </span>
                  <div className="sr-body flex-1 min-w-0">
                    <div className="sr-title text-[0.96rem] font-bold text-[#15172b] tracking-[-0.005em] line-clamp-1">
                      Étude installation PV <span className="text-[#c93b18]">{study.puissance} kWc</span>
                    </div>
                    <div className="sr-meta flex items-center gap-[0.55rem] flex-wrap text-[0.8rem] text-[#454a63] mt-[0.3rem]">
                      <span className="line-clamp-1">{study.adresse}</span>
                      <span className="sr-sep w-[3px] h-[3px] rounded-full bg-[#7a7e95] shrink-0"></span>
                      <span className="text-[#7a7e95]">Réalisée le {new Date(study.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <a 
                    className="sr-dl inline-flex items-center gap-[0.55rem] shrink-0 font-sans font-semibold text-[0.8rem] p-[0.7rem_1.25rem] rounded-[6px] bg-[#0b0e1d] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#141832]"
                    href={`/rapport?id=${study._id}`}
                    target="_blank"
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
