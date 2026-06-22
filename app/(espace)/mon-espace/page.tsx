'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Plus, 
  Download, 
  FileText, 
  User as UserIcon, 
  Zap, 
  Calendar, 
  UserCheck, 
  Building,
  Search,
  X,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function MonEspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studies, setStudies] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [filterPuissance, setFilterPuissance] = useState('');
  const [filterAdresse, setFilterAdresse] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [selectingFrom, setSelectingFrom] = useState(true);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [addressInputValue, setAddressInputValue] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

  // Get unique addresses from studies
  const uniqueAddresses = useMemo(() => {
    const addresses = studies
      .map(study => study.adresse)
      .filter(Boolean)
      .filter((address, index, self) => self.indexOf(address) === index);
    return addresses;
  }, [studies]);

  // Filter addresses based on input
  const filteredAddresses = useMemo(() => {
    if (!addressInputValue) return uniqueAddresses;
    const query = addressInputValue.toLowerCase().trim();
    return uniqueAddresses.filter(address => 
      address.toLowerCase().includes(query)
    );
  }, [uniqueAddresses, addressInputValue]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (status === 'authenticated') {
      fetchUserProfile();
      fetchStudies();
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
    };

    if (showAddressDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddressDropdown]);

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

  // Determine user type
  const isPro = userProfile?.type === 'pro';
  
  // Dynamic colors based on user type
  const primaryColor = isPro ? '#3a55b0' : '#c93b18';
  const primaryColorHover = isPro ? '#4a6bd0' : '#e0552e';
  const primaryColorBg = isPro ? 'bg-[#3a55b0]' : 'bg-[#c93b18]';
  const primaryColorHoverBg = isPro ? 'hover:bg-[#4a6bd0]' : 'hover:bg-[#e0552e]';
  const primaryColorText = isPro ? 'text-[#3a55b0]' : 'text-[#c93b18]';
  const primaryColorBorder = isPro ? 'border-[#3a55b0]' : 'border-[#c93b18]';
  const primaryColorLight = isPro ? 'rgba(58, 85, 176, 0.15)' : 'rgba(201, 59, 24, 0.15)';
  const primaryColorLightBg = isPro ? 'bg-[rgba(58,85,176,0.08)]' : 'bg-[rgba(201,59,24,0.08)]';
  const primaryColorLightHover = isPro ? 'hover:bg-[rgba(58,85,176,0.12)]' : 'hover:bg-[rgba(201,59,24,0.12)]';

  // Enhanced search and filter logic
  const filteredStudies = useMemo(() => {
    return studies.filter(study => {
      const studyDate = new Date(study.createdAt);
      const formattedDate = studyDate.toLocaleDateString('fr-FR');
      const formattedDateLong = studyDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const formattedDateShort = studyDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      
      // Extract address parts
      const addressParts = study.adresse?.split(',') || [];
      const street = addressParts[0]?.trim() || '';
      const city = addressParts[1]?.trim() || '';
      const postalCode = addressParts[1]?.match(/\d{5}/)?.[0] || '';
      const country = addressParts[2]?.trim() || '';
      
      // Build the full searchable text
      const searchableText = `
        étude installation pv ${study.puissance} kwc
        ${study.puissance} kwc
        ${study.adresse || ''}
        ${street}
        ${city}
        ${postalCode}
        ${country}
        ${formattedDate}
        ${formattedDateLong}
        ${formattedDateShort}
        réalisée le ${formattedDate}
        ${study._id || ''}
      `.toLowerCase();

      // Search query matching
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const searchTerms = query.split(/\s+/);
        const allTermsMatch = searchTerms.every(term => 
          searchableText.includes(term)
        );
        if (!allTermsMatch) return false;
      }

      // Filter by date range
      if (dateRange.from || dateRange.to) {
        const studyDateObj = new Date(study.createdAt);
        studyDateObj.setHours(0, 0, 0, 0);
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (studyDateObj < fromDate) return false;
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (studyDateObj > toDate) return false;
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

      return true;
    });
  }, [studies, searchQuery, dateRange, filterPuissance, filterAdresse]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    clearDateRange();
    setFilterPuissance('');
    setFilterAdresse('');
    setAddressInputValue('');
  };

  // Check if any filter is active
  const hasActiveFilters = searchQuery || dateRange.from || dateRange.to || filterPuissance || filterAdresse;

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (dateRange.from) count++;
    if (dateRange.to) count++;
    if (filterPuissance) count++;
    if (filterAdresse) count++;
    return count;
  };

  // Render calendar content with dynamic colors
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

      let className = `h-9 w-9 rounded-full text-sm font-medium transition-colors cursor-pointer relative`;
      
      if (isSelected) {
        className += ` ${primaryColorBg} text-white`;
      } else if (isInRange && !isSelected) {
        className += ` ${primaryColorLightBg} ${primaryColorText}`;
      } else if (isToday && !isSelected) {
        className += ` border-2 ${primaryColorBorder} ${primaryColorText}`;
      } else {
        className += ` text-[#15172b] hover:${primaryColorBg} hover:text-white`;
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
            className={`p-1 ${primaryColorLightHover} rounded-lg transition-colors`}
          >
            <ChevronLeft size={20} className={primaryColorText} />
          </button>
          <span className="font-semibold text-[#15172b]">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className={`p-1 ${primaryColorLightHover} rounded-lg transition-colors`}
          >
            <ChevronRight size={20} className={primaryColorText} />
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
              <div className={`w-3 h-3 rounded ${primaryColorBg}`}></div>
              <span>Sélectionné</span>
            </div>
            <div className={`flex items-center gap-1.5`}>
              <div className={`w-3 h-3 rounded ${primaryColorLightBg} border ${primaryColorBorder}`}></div>
              <span>Plage</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTempDateRange({ from: null, to: null });
                setSelectingFrom(true);
              }}
              className={`text-xs ${primaryColorText} ${primaryColorLightHover} transition-colors px-2 py-1 rounded-lg`}
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
              className={`text-xs font-medium text-white ${primaryColorBg} px-3 py-1 rounded-lg ${primaryColorHoverBg} transition-colors`}
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  const lastStudyDate = studies.length > 0 
    ? new Date(studies[0].createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—';

  const userTypeLabel = isPro ? 'PRO' : 'Particulier';
  const UserTypeIcon = isPro ? Building : UserCheck;

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
        <div className="dash-stats grid grid-cols-1 sm:grid-cols-2 gap-[1.1rem] mb-[2.4rem]">
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <FileText size={14} className={primaryColorText} />
              Études réalisées
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{studies.length}</div>
          </div>
          <div className="dstat bg-white border border-[#e8e8ea] rounded-[12px] p-[1.4rem_1.5rem] shadow-[0_2px_14px_rgba(11,14,29,0.06)]">
            <div className="ds-k text-[0.64rem] font-bold tracking-[0.14em] uppercase text-[#7a7e95] mb-[0.6rem] flex items-center gap-[0.45rem]">
              <Calendar size={14} className={primaryColorText} />
              Dernière étude
            </div>
            <div className="ds-v font-serif font-medium text-[1.9rem] text-[#15172b] tracking-[-0.01em] line-clamp-1">{lastStudyDate}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="studies-panel bg-white border border-[#e8e8ea] rounded-[18px] overflow-hidden shadow-[0_18px_50px_rgba(11,14,29,0.12)]">
          <div className="sp-h flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-[1.3rem_1.7rem] border-b border-[#e8e8ea]">
            <h2 className="font-serif font-semibold text-[1.2rem] text-[#15172b] tracking-[-0.01em]">
              Mes études
              <span className="ml-2 text-[0.76rem] text-[#7a7e95] font-semibold">
                ({filteredStudies.length} étude{filteredStudies.length > 1 ? 's' : ''})
              </span>
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7e95]" strokeWidth={1.8} />
                <input
                  type="text"
                  placeholder="Rechercher une étude..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[220px] pl-9 pr-3 py-2 text-sm border border-[#e8e8ea] rounded-lg bg-white outline-none transition-all focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.08)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7e95] hover:text-[#c93b18]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap ${
                  showFilters || hasActiveFilters
                    ? `${primaryColorBg} text-white border-transparent`
                    : 'border-[#e8e8ea] text-[#454a63] hover:border-[#c93b18] hover:text-[#c93b18]'
                }`}
                style={showFilters || hasActiveFilters ? { backgroundColor: primaryColor } : {}}
              >
                <SlidersHorizontal size={14} />
                Filtres
                {hasActiveFilters && (
                  <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    showFilters ? 'bg-white text-[#c93b18]' : 'bg-[#c93b18] text-white'
                  }`}>
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-[1.3rem_1.7rem] border-b border-[#e8e8ea] bg-[#f8f8fa]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      className={`w-full pl-9 pr-3 py-2 text-sm text-left border rounded-lg bg-white outline-none transition-all ${primaryColorBorder} hover:border-[${primaryColor}] focus:border-[${primaryColor}]`}
                      style={{ borderColor: showCalendar ? primaryColor : '#e8e8ea' }}
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

                {/* Puissance Filter */}
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
                    className={`w-full px-3 py-2 text-sm border ${primaryColorBorder} rounded-lg bg-white outline-none transition-all focus:border-[${primaryColor}] focus:shadow-[0_0_0_3px_${primaryColorLight}]`}
                  />
                </div>

                {/* Adresse Filter with Dropdown */}
                <div className="relative" ref={addressDropdownRef}>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-[#7a7e95] mb-1">
                    Adresse
                  </label>
                  <div className="relative">
                    <input
                      ref={addressInputRef}
                      type="text"
                      placeholder="Rechercher par adresse..."
                      value={addressInputValue || filterAdresse}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAddressInputValue(value);
                        setFilterAdresse(value);
                        if (value.trim().length > 0) {
                          setShowAddressDropdown(true);
                        }
                      }}
                      onFocus={() => {
                        if (addressInputValue || filterAdresse) {
                          setShowAddressDropdown(true);
                        } else if (uniqueAddresses.length > 0) {
                          setShowAddressDropdown(true);
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm border ${primaryColorBorder} rounded-lg bg-white outline-none transition-all focus:border-[${primaryColor}] focus:shadow-[0_0_0_3px_${primaryColorLight}] pr-8`}
                    />
                    <ChevronDown 
                      size={16} 
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${primaryColorText} cursor-pointer transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`}
                      onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                    />
                    {(addressInputValue || filterAdresse) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddressInputValue('');
                          setFilterAdresse('');
                          setShowAddressDropdown(false);
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-[#7a7e95] hover:text-[#c93b18]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Address Dropdown */}
                  {showAddressDropdown && filteredAddresses.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 z-[99999] w-full max-h-[200px] overflow-y-auto bg-white rounded-lg border border-[#e8e8ea] shadow-lg">
                      {filteredAddresses.map((address, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setAddressInputValue(address);
                            setFilterAdresse(address);
                            setShowAddressDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:${primaryColorLightBg} ${primaryColorLightHover} transition-colors border-b border-[#e8e8ea] last:border-b-0 ${filterAdresse === address ? primaryColorLightBg : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-[#454a63] truncate">{address}</span>
                            {filterAdresse === address && (
                              <Check size={14} className={`${primaryColorText} shrink-0 mt-0.5`} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showAddressDropdown && filteredAddresses.length === 0 && addressInputValue && (
                    <div className="absolute top-full left-0 mt-1 z-[99999] w-full bg-white rounded-lg border border-[#e8e8ea] shadow-lg p-3 text-center">
                      <p className="text-sm text-[#7a7e95]">Aucune adresse trouvée</p>
                    </div>
                  )}

                  {/* Show address count badge */}
                  {uniqueAddresses.length > 0 && !addressInputValue && !filterAdresse && (
                    <div className="mt-1">
                      <span className="text-[10px] text-[#7a7e95]">
                        {uniqueAddresses.length} adresse{uniqueAddresses.length > 1 ? 's' : ''} disponible{uniqueAddresses.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
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
                      className={`text-sm ${primaryColorText} ${primaryColorLightHover} transition-colors font-medium px-2 py-1 rounded-lg`}
                    >
                      Effacer les filtres
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className={`text-sm font-medium px-4 py-1.5 rounded-lg text-white transition-all ${primaryColorBg} ${primaryColorHoverBg}`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Studies List */}
          <div id="list">
            {filteredStudies.length === 0 ? (
              <div className="dash-empty text-center p-[4rem_2rem]">
                <div className="de-ic w-[64px] h-[64px] rounded-full mx-auto mb-[1.4rem] bg-[#f5f5f7] border border-[#e8e8ea] flex items-center justify-center text-[#7a7e95]">
                  <FileText size={28} />
                </div>
                <h3 className="font-serif font-medium text-[1.3rem] text-[#15172b] mb-[0.5rem]">
                  {studies.length === 0 ? 'Aucune étude pour le moment' : 'Aucune étude ne correspond'}
                </h3>
                <p className="text-[0.88rem] text-[#454a63] max-w-[42ch] mx-auto mb-[1.6rem] leading-[1.6]">
                  {studies.length === 0 
                    ? 'Lancez votre première étude photovoltaïque gratuite : elle apparaîtra ici, avec son rapport téléchargeable.'
                    : 'Aucune étude ne correspond à vos critères. Essayez de modifier votre recherche ou vos filtres.'
                  }
                </p>
                {studies.length === 0 ? (
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
                ) : (
                  <button
                    onClick={clearFilters}
                    className={`inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.86rem] p-[0.9rem_1.6rem] rounded-[6px] ${primaryColorText} border ${primaryColorBorder} ${primaryColorLightHover} transition-all`}
                    style={{ borderColor: primaryColor }}
                  >
                    <X size={16} />
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              filteredStudies.map((study) => {
                const studyDate = new Date(study.createdAt);
                const formattedDate = studyDate.toLocaleDateString('fr-FR');
                
                return (
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
                        <span className="text-[#7a7e95]">Réalisée le {formattedDate}</span>
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
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Calendar Portal */}
      {showCalendar && createPortal(
        <div 
          ref={calendarRef}
          className={`fixed z-[999999] bg-white rounded-xl shadow-2xl border ${primaryColorBorder} w-[320px]`}
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
    </div>
  );
}