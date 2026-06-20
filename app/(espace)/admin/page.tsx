// app/(espace)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Search, User as UserIcon, FileText, Download, Users, Zap, CheckCircle, ShieldCheck, Mail, Upload, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studies, setStudies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilter, setExportFilter] = useState<'all' | 'particulier' | 'pro'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?role=admin');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session.user as any)?.role;
      console.log('User role:', userRole);
      
      if (userRole !== 'admin') {
        toast.error('Accès réservé aux administrateurs');
        router.push('/mon-espace');
        return;
      }
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studiesRes, usersRes] = await Promise.all([
        fetch('/api/admin/studies'),
        fetch('/api/admin/users')
      ]);
      
      const studiesData = await studiesRes.json();
      const usersData = await usersRes.json();
      
      if (studiesData.success) setStudies(studiesData.studies);
      if (usersData.success) setUsers(usersData.users);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportEmails = async () => {
    setIsExporting(true);
    try {
      // Filter users based on selected type
      let filteredUsers = users;
      if (exportFilter === 'particulier') {
        // Check for both 'part' and 'particulier' to be safe
        filteredUsers = users.filter(user => user.type === 'part' || user.type === 'particulier' || user.type === 'personal');
      } else if (exportFilter === 'pro') {
        // Check for both 'pro' and 'professional' to be safe
        filteredUsers = users.filter(user => user.type === 'pro' || user.type === 'professional');
      }

      console.log('Filter:', exportFilter);
      console.log('Total users:', users.length);
      console.log('Filtered users:', filteredUsers.length);
      console.log('User types:', users.map(u => u.type));

      if (filteredUsers.length === 0) {
        toast.warning('Aucun client à exporter pour le filtre sélectionné');
        setShowExportModal(false);
        setIsExporting(false);
        return;
      }

      // Prepare data for Excel with proper headers
      const excelData = filteredUsers.map((user: any) => {
        const row: any = {
          'Nom': user.nom || '',
          'Prénom': user.prenom || '',
          'Adresse e-mail': user.email || ''
        };

        // Add Entreprise only for professional clients
        const isPro = user.type === 'pro' || user.type === 'professional';
        if (isPro) {
          row['Entreprise'] = user.entreprise || '';
        } else {
          row['Entreprise'] = ''; // Empty for non-professional clients
        }

        return row;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const cols = [
        { wch: 20 }, // Nom
        { wch: 20 }, // Prénom
        { wch: 35 }, // Adresse e-mail
        { wch: 30 }  // Entreprise
      ];
      ws['!cols'] = cols;

      // Append sheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');

      // Generate Excel file as binary
      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false
      });
      
      // Create blob and download
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filterLabel = exportFilter === 'all' ? 'tous' : exportFilter === 'pro' ? 'professionnels' : 'particuliers';
      link.setAttribute('href', url);
      link.setAttribute('download', `clients-${filterLabel}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`${filteredUsers.length} clients exportés avec succès au format Excel`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Une erreur est survenue lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login?role=admin');
  };

  // Helper function to get user type label
  const getUserTypeLabel = (type: string) => {
    if (type === 'pro' || type === 'professional') return 'PRO';
    if (type === 'part' || type === 'particulier' || type === 'personal') return 'PART';
    return type?.toUpperCase() || '?';
  };

  // Helper function to check if user is professional
  const isProfessional = (type: string) => {
    return type === 'pro' || type === 'professional';
  };

  if (status === 'loading' || (isLoading && studies.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  const filteredStudies = studies.filter(st => {
    const hay = `${st.userEmail} ${st.adresse} ${st.puissance}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <div className="dash min-h-screen bg-[#f5f5f7] font-sans">
      <header className="sp-top sticky top-0 z-50 bg-[rgba(11,14,29,0.96)] backdrop-blur-[18px] text-[#f3efe6] border-b border-[rgba(255,255,255,0.08)]">
        <div className="sp-top-in max-w-[1200px] mx-auto px-[2.2rem] h-[68px] flex items-center justify-between gap-4">
          <a className="sp-brand flex items-center gap-[0.8rem]" href="/">
            <img src="/logo-mafatec-blanc.png" alt="MAFATEC" className="h-[26px]" />
            <span className="sp-divider w-px h-[22px] bg-[rgba(201,169,106,0.28)]"></span>
            <span className="sp-space font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-[#A82E12]">Administration</span>
          </a>
          <div className="sp-top-right flex items-center gap-[1.3rem]">
            <div className="sp-user flex items-center gap-[0.6rem] text-[0.82rem] text-[rgba(243,239,230,0.62)]">
              <span className="sp-ava w-[30px] h-[30px] rounded-full bg-[#c93b18] text-white flex items-center justify-center text-[0.72rem] font-bold tracking-[0.02em]">AD</span>
              <span className="hidden sm:inline"><strong className="text-[#f3efe6] font-semibold uppercase tracking-wider">Administration</strong></span>
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
            <span className="dh-eyebrow inline-flex items-center gap-[0.55rem] font-sans text-[0.64rem] font-bold tracking-[0.2em] uppercase text-[#c93b18] mb-[0.7rem]">
              <span className="mark w-[22px] h-[1.4px] bg-[#c93b18]"></span>
              Supervision
            </span>
            <h1 className="font-serif font-semibold text-[clamp(1.9rem,3.4vw,2.6rem)] tracking-[-0.015em] text-[#15172b] leading-[1.05]">
              Toutes les <em className="not-italic italic text-[#c93b18]">études</em> réalisées
            </h1>
            <p className="dh-sub text-[0.92rem] text-[#454a63] mt-[0.5rem]">Suivi des simulations et des clients ayant lancé une étude photovoltaïque.</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={users.length === 0}
            className="inline-flex items-center gap-3 px-6 py-3 bg-[#0b0e1d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a1f3a] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <FileSpreadsheet size={18} className="text-[#c93b18]" />
            Exporter vers Excel
          </button>
        </div>

        <div className="dash-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.1rem] mb-[2.4rem]">
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <FileText size={14} className="text-[#c93b18]" />
              Études totales
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{studies.length}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Users size={14} className="text-[#c93b18]" />
              Clients
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{users.length}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <CheckCircle size={14} className="text-[#c93b18]" />
              Comptes activés
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{users.filter(u => u.activated).length}</div>
          </div>
        </div>

        <div className="admin-table-wrap bg-white border border-[#e8e8ea] rounded-[18px] overflow-hidden shadow-[0_18px_50px_rgba(11,14,29,0.12)]">
          <div className="admin-toolbar flex items-center justify-between gap-[1rem] p-[1.2rem_1.6rem] border-b border-[#e8e8ea] flex-wrap">
            <h2 className="font-serif font-semibold text-[1.2rem] text-[#15172b]">Registre des études</h2>
            <div className="admin-search relative flex items-center min-w-[260px]">
              <Search className="absolute left-[0.85rem] w-[16px] h-[16px] text-[#7a7e95]" size={16} />
              <input 
                type="search" 
                placeholder="Rechercher un client, une adresse…" 
                className="w-full p-[0.7rem_0.9rem_0.7rem_2.5rem] border border-[#e8e8ea] rounded-[8px] bg-[#f5f5f7] text-[0.85rem] text-[#15172b] font-sans outline-none transition-all duration-300 focus:border-[#c93b18] focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="admin-table-scroll overflow-x-auto">
            <table className="admin-table w-full border-collapse text-[0.84rem]">
              <thead>
                <tr className="bg-[#0b0e1d] text-[#f3efe6]">
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Client</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Profil</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Entreprise</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Installation</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Adresse</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Date</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Compte</th>
                  <th className="text-left font-sans font-semibold text-[0.64rem] tracking-[0.1em] uppercase p-[0.95rem_1.3rem] whitespace-nowrap">Rapport</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-[3.5rem] text-[#7a7e95]">
                      {search ? 'Aucune étude ne correspond à votre recherche.' : 'Aucune étude enregistrée pour le moment.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudies.map((study) => {
                    const user = users.find(u => u.email === study.userEmail) || {};
                    const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();
                    const userType = user.type || '';
                    const isPro = isProfessional(userType);
                    
                    return (
                      <tr key={study._id} className="border-b border-[#e8e8ea] last:border-b-0 hover:bg-[#f5f5f7] transition-colors duration-200">
                        <td className="p-[1rem_1.3rem]">
                          <div className="at-person flex items-center gap-[0.7rem]">
                            <span className="at-ava w-[34px] h-[34px] rounded-full flex-shrink-0 bg-[#2a2e72] text-white flex items-center justify-center text-[0.72rem] font-bold">
                              {initials || '?'}
                            </span>
                            <div>
                              <div className="at-name font-bold text-[#15172b] line-clamp-1">{user.prenom} {user.nom}</div>
                              <div className="at-mail text-[0.76rem] text-[#7a7e95] mt-[0.1rem] line-clamp-1">{study.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-[1rem_1.3rem]">
                          <span className={`badge-type inline-flex items-center gap-[0.35rem] text-[0.64rem] font-bold tracking-[0.06em] uppercase p-[0.28rem_0.6rem] rounded-[3px] ${isPro ? 'text-[#3a55b0] bg-[rgba(58,85,176,0.12)]' : 'text-[#a82e12] bg-[rgba(201,59,24,0.11)]'}`}>
                            {isPro ? 'PRO' : 'PART'}
                          </span>
                        </td>
                        <td className="p-[1rem_1.3rem]">
                          <span className={user.entreprise ? "text-[#15172b]" : "text-[#7a7e95]"}>{user.entreprise || '—'}</span>
                        </td>
                        <td className="p-[1rem_1.3rem] font-bold text-[#15172b] whitespace-nowrap">{study.puissance} kWc</td>
                        <td className="p-[1rem_1.3rem]">
                          <div className="at-addr text-[#454a63] max-w-[240px] line-clamp-2 leading-[1.4]">{study.adresse}</div>
                        </td>
                        <td className="p-[1rem_1.3rem] text-[#7a7e95] whitespace-nowrap">
                          {new Date(study.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="p-[1rem_1.3rem]">
                          {user.activated ? (
                            <span className="badge-status on inline-flex items-center gap-[0.4rem] text-[0.66rem] font-bold p-[0.28rem_0.6rem] rounded-[20px] text-[#1f7a52] bg-[rgba(31,138,91,0.11)]">
                              <span className="bsdot w-[6px] h-[6px] rounded-full bg-[#1f8a5b]"></span>
                              ACTIVÉ
                            </span>
                          ) : (
                            <span className="badge-status off inline-flex items-center gap-[0.4rem] text-[0.66rem] font-bold p-[0.28rem_0.6rem] rounded-[20px] text-[#7a7e95] bg-[#f5f5f7]">
                              <span className="bsdot w-[6px] h-[6px] rounded-full bg-[#7a7e95]"></span>
                              ATTENTE
                            </span>
                          )}
                        </td>
                        <td className="p-[1rem_1.3rem]">
                          <a 
                            className="at-dl inline-flex items-center gap-[0.45rem] font-sans font-semibold text-[0.76rem] p-[0.55rem_1rem] rounded-[6px] bg-[#0b0e1d] text-white hover:bg-[#141832] transition-colors duration-300"
                            href={`/rapport?id=${study._id}`}
                            target="_blank"
                          >
                            <Download size={14} />
                            PDF
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#15172b]">Exporter les clients</h3>
                <p className="text-sm text-[#7a7e95] mt-1">Choisissez le type de clients à exporter</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-[#7a7e95] hover:text-[#15172b] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-[#e8e8ea] rounded-lg cursor-pointer hover:bg-[#f5f5f7] transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportFilter === 'all'}
                  onChange={(e) => setExportFilter('all')}
                  className="w-4 h-4 text-[#c93b18] border-[#d0d0d5] focus:ring-[#c93b18]"
                />
                <div>
                  <div className="font-medium text-[#15172b]">Les deux</div>
                  <div className="text-xs text-[#7a7e95]">Tous les clients (particuliers et professionnels)</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#e8e8ea] rounded-lg cursor-pointer hover:bg-[#f5f5f7] transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="particulier"
                  checked={exportFilter === 'particulier'}
                  onChange={(e) => setExportFilter('particulier')}
                  className="w-4 h-4 text-[#c93b18] border-[#d0d0d5] focus:ring-[#c93b18]"
                />
                <div>
                  <div className="font-medium text-[#15172b]">Particuliers</div>
                  <div className="text-xs text-[#7a7e95]">Clients particuliers uniquement</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#e8e8ea] rounded-lg cursor-pointer hover:bg-[#f5f5f7] transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="pro"
                  checked={exportFilter === 'pro'}
                  onChange={(e) => setExportFilter('pro')}
                  className="w-4 h-4 text-[#c93b18] border-[#d0d0d5] focus:ring-[#c93b18]"
                />
                <div>
                  <div className="font-medium text-[#15172b]">Professionnels</div>
                  <div className="text-xs text-[#7a7e95]">Clients professionnels uniquement</div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#e8e8ea] rounded-lg text-[#7a7e95] hover:bg-[#f5f5f7] transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleExportEmails}
                disabled={isExporting}
                className="flex-1 px-4 py-2.5 bg-[#0b0e1d] text-white rounded-lg hover:bg-[#1a1f3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Export...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={18} />
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}