// app/(espace)/admin/page.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Search, 
  User as UserIcon, 
  FileText, 
  Download, 
  Users, 
  Zap, 
  CheckCircle, 
  ShieldCheck, 
  Mail, 
  Upload, 
  FileSpreadsheet, 
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Building,
  UserCheck
} from 'lucide-react';
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
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [filterPuissance, setFilterPuissance] = useState('');
  const [filterAdresse, setFilterAdresse] = useState('');
  const [filterEntreprise, setFilterEntreprise] = useState('');
  
  // Calendar states
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [selectingFrom, setSelectingFrom] = useState(true);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
        setTempDateRange({ from: null, to: null });
        setSelectingFrom(true);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Update calendar position when opened
  useEffect(() => {
    if (showCalendar && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [showCalendar]);

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
      let filteredUsers = users;
      if (exportFilter === 'particulier') {
        filteredUsers = users.filter(user => user.type === 'part' || user.type === 'particulier' || user.type === 'personal');
      } else if (exportFilter === 'pro') {
        filteredUsers = users.filter(user => user.type === 'pro' || user.type === 'professional');
      }

      console.log('Filter:', exportFilter);
      console.log('Total users:', users.length);
      console.log('Filtered users:', filteredUsers.length);

      if (filteredUsers.length === 0) {
        toast.warning('Aucun client à exporter pour le filtre sélectionné');
        setShowExportModal(false);
        setIsExporting(false);
        return;
      }

      const excelData = filteredUsers.map((user: any) => {
        const row: any = {
          'Nom': user.nom || '',
          'Prénom': user.prenom || '',
          'Adresse e-mail': user.email || ''
        };

        const isPro = user.type === 'pro' || user.type === 'professional';
        if (isPro) {
          row['Entreprise'] = user.entreprise || '';
        } else {
          row['Entreprise'] = '';
        }

        return row;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const cols = [
        { wch: 20 },
        { wch: 20 },
        { wch: 35 },
        { wch: 30 }
      ];
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, 'Clients');

      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false
      });
      
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

  const isProfessional = (type: string) => {
    return type === 'pro' || type === 'professional';
  };

  // Calendar functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (date: Date) => {
    if (selectingFrom) {
      setTempDateRange({ from: date, to: null });
      setSelectingFrom(false);
    } else {
      if (date < tempDateRange.from!) {
        setTempDateRange({ from: date, to: tempDateRange.from });
      } else {
        setTempDateRange({ from: tempDateRange.from, to: date });
      }
      setDateRange(tempDateRange.from && date ? 
        { from: tempDateRange.from, to: date > tempDateRange.from ? date : tempDateRange.from } : 
        { from: tempDateRange.from, to: null }
      );
      setShowCalendar(false);
      setSelectingFrom(true);
    }
  };

  const clearDateRange = () => {
    setDateRange({ from: null, to: null });
    setTempDateRange({ from: null, to: null });
    setSelectingFrom(true);
  };

  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) return 'Sélectionner une période';
    if (dateRange.from && !dateRange.to) return `Du ${dateRange.from.toLocaleDateString('fr-FR')}`;
    if (dateRange.from && dateRange.to) {
      if (dateRange.from.getTime() === dateRange.to.getTime()) {
        return `Le ${dateRange.from.toLocaleDateString('fr-FR')}`;
      }
      return `Du ${dateRange.from.toLocaleDateString('fr-FR')} au ${dateRange.to.toLocaleDateString('fr-FR')}`;
    }
    return 'Sélectionner une période';
  };

  const isDateInRange = (date: Date) => {
    if (!tempDateRange.from) return false;
    if (!tempDateRange.to) return date.getTime() === tempDateRange.from.getTime();
    return date >= tempDateRange.from && date <= tempDateRange.to;
  };

  const isDateSelected = (date: Date) => {
    if (!dateRange.from) return false;
    if (!dateRange.to) return date.getTime() === dateRange.from.getTime();
    return date >= dateRange.from && date <= dateRange.to;
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  // Render calendar content
  const renderCalendarContent = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      const isInRange = isDateInRange(date);
      const isSelected = isDateSelected(date);
      const isToday = date.getTime() === today.getTime();

      let className = 'h-9 w-9 rounded-full text-sm font-medium transition-colors cursor-pointer relative';
      
      if (isSelected) {
        className += ' bg-[#c93b18] text-white';
      } else if (isInRange && !isSelected) {
        className += ' bg-[rgba(201,59,24,0.08)] text-[#c93b18]';
      } else if (isToday && !isSelected) {
        className += ' border-2 border-[#c93b18] text-[#c93b18]';
      } else {
        className += ' text-[#15172b] hover:bg-[#c93b18] hover:text-white';
      }

      days.push(
        <button
          key={i}
          onClick={() => handleDateSelect(date)}
          className={className}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-[#454a63]" />
          </button>
          <span className="font-semibold text-[#15172b]">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-[#454a63]" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="h-9 w-9 flex items-center justify-center text-xs font-medium text-[#7a7e95]">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e8e8ea]">
          <div className="flex items-center gap-3 text-xs text-[#7a7e95]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#c93b18]"></div>
              <span>Sélectionné</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[rgba(201,59,24,0.08)] border border-[#c93b18]"></div>
              <span>Plage</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTempDateRange({ from: null, to: null });
                setSelectingFrom(true);
              }}
              className="text-xs text-[#7a7e95] hover:text-[#c93b18] transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => {
                if (tempDateRange.from && tempDateRange.to) {
                  setDateRange(tempDateRange);
                  setShowCalendar(false);
                  setSelectingFrom(true);
                } else if (tempDateRange.from) {
                  setDateRange({ from: tempDateRange.from, to: tempDateRange.from });
                  setShowCalendar(false);
                  setSelectingFrom(true);
                }
              }}
              className="text-xs font-medium text-white bg-[#c93b18] px-3 py-1 rounded-lg hover:bg-[#e0552e] transition-colors"
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to clear filters
  const clearFilters = () => {
    clearDateRange();
    setFilterPuissance('');
    setFilterAdresse('');
    setFilterEntreprise('');
    setSearch('');
  };

  // Check if any filter is active
  const hasActiveFilters = dateRange.from || dateRange.to || filterPuissance || filterAdresse || filterEntreprise || search;

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (dateRange.from) count++;
    if (dateRange.to) count++;
    if (filterPuissance) count++;
    if (filterAdresse) count++;
    if (filterEntreprise) count++;
    if (search) count++;
    return count;
  };

  // Filtered studies with all filters
  const filteredStudies = useMemo(() => {
    return studies.filter(study => {
      const user = users.find(u => u.email === study.userEmail) || {};
      
      // Search query
      if (search) {
        const query = search.toLowerCase().trim();
        const searchableText = `
          ${study.userEmail || ''}
          ${study.adresse || ''}
          ${study.puissance || ''}
          ${user.prenom || ''}
          ${user.nom || ''}
          ${user.entreprise || ''}
        `.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Filter by date range
      if (dateRange.from || dateRange.to) {
        const studyDate = new Date(study.createdAt);
        studyDate.setHours(0, 0, 0, 0);
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (studyDate < fromDate) return false;
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (studyDate > toDate) return false;
        }
      }

      // Filter by puissance
      if (filterPuissance) {
        const studyPw = parseFloat(String(study.puissance).replace(',', '.'));
        const filterPw = parseFloat(filterPuissance);
        if (isNaN(studyPw) || isNaN(filterPw) || studyPw !== filterPw) return false;
      }

      // Filter by adresse
      if (filterAdresse) {
        if (!study.adresse?.toLowerCase().includes(filterAdresse.toLowerCase())) return false;
      }

      // Filter by entreprise
      if (filterEntreprise) {
        if (!user.entreprise?.toLowerCase().includes(filterEntreprise.toLowerCase())) return false;
      }

      return true;
    });
  }, [studies, users, search, dateRange, filterPuissance, filterAdresse, filterEntreprise]);

  if (status === 'loading' || (isLoading && studies.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  // Calculate stats
  const totalStudies = studies.length;
  const totalUsers = users.length;
  const totalPart = users.filter(u => u.type === 'part' || u.type === 'particulier' || u.type === 'personal').length;
  const totalPro = users.filter(u => u.type === 'pro' || u.type === 'professional').length;
  const totalActivated = users.filter(u => u.activated).length;

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

        {/* Stats - Updated with new labels */}
        <div className="dash-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.1rem] mb-[2.4rem]">
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <FileText size={14} className="text-[#c93b18]" />
              Études totales
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{totalStudies}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <UserIcon size={14} className="text-[#c93b18]" />
              Clients particuliers
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{totalPart}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Building size={14} className="text-[#c93b18]" />
              Clients professionnels
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{totalPro}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <CheckCircle size={14} className="text-[#c93b18]" />
              Comptes activés
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{totalActivated}</div>
          </div>
        </div>

        <div className="admin-table-wrap bg-white border border-[#e8e8ea] rounded-[18px] overflow-hidden shadow-[0_18px_50px_rgba(11,14,29,0.12)]">
          <div className="admin-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-[1.2rem_1.6rem] border-b border-[#e8e8ea]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h2 className="font-serif font-semibold text-[1.2rem] text-[#15172b]">Registre des études</h2>
              <span className="text-xs text-[#7a7e95] bg-[#f5f5f7] px-2 py-1 rounded-full">
                {filteredStudies.length}
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="admin-search relative flex items-center flex-1 sm:flex-none">
                <Search className="absolute left-[0.85rem] w-[16px] h-[16px] text-[#7a7e95]" size={16} />
                <input 
                  type="search" 
                  placeholder="Rechercher..." 
                  className="w-full sm:w-[220px] p-[0.7rem_0.9rem_0.7rem_2.5rem] border border-[#e8e8ea] rounded-[8px] bg-[#f5f5f7] text-[0.85rem] text-[#15172b] font-sans outline-none transition-all duration-300 focus:border-[#c93b18] focus:bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${
                  showFilters || hasActiveFilters
                    ? 'bg-[#c93b18] text-white border-transparent'
                    : 'border-[#e8e8ea] text-[#454a63] hover:border-[#c93b18] hover:text-[#c93b18]'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filtres
                {hasActiveFilters && (
                  <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-white text-[#c93b18]">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-[1.3rem_1.7rem] border-b border-[#e8e8ea] bg-[#f8f8fa]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Date Range Picker */}
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[#7a7e95] mb-1">
                    Période
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7e95]" strokeWidth={1.8} />
                    <button
                      ref={buttonRef}
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full pl-9 pr-3 py-2 text-sm text-left border border-[#e8e8ea] rounded-lg bg-white outline-none transition-all focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.08)] hover:border-[#c93b18]"
                    >
                      <span className={dateRange.from || dateRange.to ? 'text-[#15172b]' : 'text-[#7a7e95]'}>
                        {formatDateRange()}
                      </span>
                    </button>
                    {(dateRange.from || dateRange.to) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearDateRange();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7e95] hover:text-[#c93b18]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Puissance */}
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[#7a7e95] mb-1">
                    Puissance (kWc)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 9"
                    value={filterPuissance}
                    onChange={(e) => setFilterPuissance(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e8e8ea] rounded-lg bg-white outline-none transition-all focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.08)]"
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[#7a7e95] mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    placeholder="Rechercher par adresse..."
                    value={filterAdresse}
                    onChange={(e) => setFilterAdresse(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e8e8ea] rounded-lg bg-white outline-none transition-all focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.08)]"
                  />
                </div>

                {/* Entreprise */}
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[#7a7e95] mb-1">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    placeholder="Nom de l'entreprise..."
                    value={filterEntreprise}
                    onChange={(e) => setFilterEntreprise(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e8e8ea] rounded-lg bg-white outline-none transition-all focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.08)]"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e8e8ea]">
                <span className="text-xs text-[#7a7e95]">
                  {filteredStudies.length} résultat{filteredStudies.length > 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#7a7e95] hover:text-[#c93b18] transition-colors font-medium"
                    >
                      Effacer les filtres
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-sm font-medium px-4 py-1.5 rounded-lg text-white bg-[#c93b18] hover:bg-[#e0552e] transition-all"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          )}
          
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
                      {search || hasActiveFilters ? 'Aucune étude ne correspond à vos critères.' : 'Aucune étude enregistrée pour le moment.'}
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

      {/* Calendar Portal */}
      {showCalendar && createPortal(
        <div 
          ref={calendarRef}
          className="fixed z-[999999] bg-white rounded-xl shadow-2xl border border-[#c93b18] w-[320px]"
          style={{
            top: calendarPosition.top,
            left: calendarPosition.left,
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
          }}
        >
          {renderCalendarContent()}
        </div>,
        document.body
      )}

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