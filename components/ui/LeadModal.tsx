"use client";

import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, Check, Mail, Building2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (data: any) => void;
}

const LeadModal = ({ isOpen, onClose, onUnlock }: LeadModalProps) => {
  const [step, setStep] = useState(1);
  const [universe, setUniverse] = useState<"part" | "pro" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleUniverseSelect = (u: "part" | "pro") => {
    setUniverse(u);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.prenom.trim()) newErrors.prenom = true;
    if (!formData.nom.trim()) newErrors.nom = true;
    if (universe === "pro" && !formData.entreprise.trim()) newErrors.entreprise = true;
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            universe,
          }),
        });

        if (response.ok) {
          Cookies.set("mafatec-etude-unlocked", "true", { expires: 7 });
          setStep(3);
          onUnlock({ ...formData, universe });
        } else {
          const errorData = await response.json();
          alert("Une erreur est survenue lors de l'envoi. Veuillez r&eacute;essayer.");
        }
      } catch (error) {
        alert("Une erreur de connexion est survenue.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="step-1 space-y-8">
      <div className="text-center">
        <span className="eyebrow mb-[1.2rem] justify-center text-[var(--red-500)] flex items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase">
          <span className="mark w-[26px] h-px bg-[var(--red-500)]" />
          Acc&egrave;s complet
        </span>
        <h3 className="modal-h text-[1.8rem] font-[var(--serif)] font-medium leading-[1.2] mb-4">
          Vous &ecirc;tes <span className="italic text-[var(--red-500)] not-italic-sans">particulier</span> ou<br/>
          <span className="italic text-[var(--logo-blue)] not-italic-sans">professionnel</span> ?
        </h3>
        <p className="modal-sub text-[0.88rem] leading-[1.55] text-[var(--text-soft)] max-w-[380px] mx-auto">
          S&eacute;lectionnez votre profil pour d&eacute;verrouiller l&apos;ensemble des r&eacute;sultats de votre &eacute;tude.
        </p>
      </div>

      <div className="profile-grid grid grid-cols-1 md:grid-cols-2 gap-[0.9rem]">
        <button onClick={() => handleUniverseSelect("part")} className="p-card group relative flex flex-col items-center p-8 rounded-[var(--r-lg)] bg-white border border-[var(--line-warm)] text-center transition-all hover:border-[var(--red-500)] hover:shadow-[var(--sh-md)]">
          <div className="p-ic mb-4 text-[var(--red-500)]">
            <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M36 9 58 16v18c0 13-9.5 21.5-22 26-12.5-4.5-22-13-22-26V16z" fill="currentColor" fillOpacity=".04" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.8" strokeLinejoin="round"></path><circle cx="36" cy="25" r="4.4" fill="#d9b25a" fillOpacity=".22" stroke="#d9b25a" strokeOpacity=".7" strokeWidth="1.2"></circle><g stroke="#d9b25a" strokeOpacity=".6" strokeWidth="1" strokeLinecap="round"><line x1="36" y1="17.6" x2="36" y2="19.4"></line><line x1="36" y1="30.6" x2="36" y2="32.4"></line><line x1="28.6" y1="25" x2="30.4" y2="25"></line><line x1="41.6" y1="25" x2="43.4" y2="25"></line><line x1="30.9" y1="19.9" x2="32.2" y2="21.2"></line><line x1="39.8" y1="28.8" x2="41.1" y2="30.1"></line><line x1="41.1" y1="19.9" x2="39.8" y2="21.2"></line><line x1="32.2" y1="28.8" x2="30.9" y2="30.1"></line></g><path d="M25 44 36 35 47 44" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path><path d="M37.6 40 33 48h3l-1.2 5 5.6-7.2h-3z" fill="#e0552e" opacity=".95"></path><line x1="27" y1="52" x2="45" y2="52" stroke="#d9b25a" strokeOpacity=".5" stroke-width="1.3" stroke-linecap="round"></line></svg>
          </div>
          <span className="p-label text-[1.1rem] font-bold text-[var(--red-500)] mb-1">Particulier</span>
          <span className="p-desc text-[0.74rem] text-[var(--muted)]">R&eacute;sidence ou logement</span>
          <div className="p-cta mt-5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--red-500)] flex items-center gap-1.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            Choisir <ArrowRight size={12} />
          </div>
        </button>

        <button onClick={() => handleUniverseSelect("pro")} className="p-card group relative flex flex-col items-center p-8 rounded-[var(--r-lg)] bg-white border border-[var(--line-warm)] text-center transition-all hover:border-[var(--logo-blue)] hover:shadow-[var(--sh-md)]">
          <div className="p-ic mb-4 text-[var(--logo-blue)]">
            <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M36 8 59 21v26L36 60 13 47V21z" fill="currentColor" fillOpacity=".04" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.8" strokeLinejoin="round"></path><rect x="26" y="34" width="6" height="16" rx="1" fill="#6ea8d8" fillOpacity=".18" stroke="#6ea8d8" strokeOpacity=".6" strokeWidth="1.1"></rect><rect x="33.5" y="28" width="6" height="22" rx="1" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.3"></rect><rect x="41" y="38" width="6" height="12" rx="1" fill="#6ea8d8" fillOpacity=".18" stroke="#6ea8d8" strokeOpacity=".6" strokeWidth="1.1"></rect><rect x="33.5" y="24.5" width="6" height="3.5" rx=".8" fill="#d9b25a" fillOpacity=".34" stroke="#d9b25a" strokeOpacity=".6" strokeWidth="1"></rect><line x1="36.5" y1="20" x2="36.5" y2="24.5" stroke="currentColor" strokeOpacity=".5" stroke-width="1.2" stroke-linecap="round"></line><circle cx="36.5" cy="18.7" r="2" fill="#e0552e" fillOpacity=".9"></circle><line x1="24" y1="50" x2="48" y2="50" stroke="#d9b25a" strokeOpacity=".5" stroke-width="1.3" stroke-linecap="round"></line><circle cx="21.5" cy="30" r="1.4" fill="#6ea8d8"></circle><circle cx="50.5" cy="30" r="1.4" fill="#6ea8d8"></circle><path d="M21.5 30 26 36M50.5 30 46.5 38" stroke="#6ea8d8" strokeOpacity=".4" stroke-width="1"></path></svg>
          </div>
          <span className="p-label text-[1.1rem] font-bold text-[var(--logo-blue)] mb-1">Professionnel</span>
          <span className="p-desc text-[0.74rem] text-[var(--muted)]">Entreprise ou tertiaire</span>
          <div className="p-cta mt-5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--logo-blue)] flex items-center gap-1.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            Choisir <ArrowRight size={12} />
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const isPro = universe === "pro";
    const accent = isPro ? "var(--logo-blue)" : "var(--red-500)";
    
    return (
      <div className="step-2 space-y-7">
        <div className="text-center">
          <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[0.66rem] font-bold tracking-widest uppercase text-[var(--muted)] hover:text-[var(--text)] transition-colors mx-auto mb-4">
            <ArrowLeft size={14} /> Revenir au profil
          </button>
          <h3 className="modal-h text-[1.6rem] font-[var(--serif)] font-medium leading-[1.2] mb-3">
            Votre &eacute;tude <span className="italic" style={{ color: accent }}>vous attend</span>
          </h3>
          <p className="modal-sub text-[0.84rem] text-[var(--text-soft)] max-w-[340px] mx-auto">
            Renseignez vos coordonn&eacute;es pour d&eacute;verrouiller et recevoir votre rapport complet par email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="field-sm">
              <label>Pr&eacute;nom <span className="text-[var(--red-500)]">*</span></label>
              <input name="prenom" value={formData.prenom} onChange={handleInputChange} className={errors.prenom ? "border-[var(--red-500)]" : ""} placeholder="Ex: Jean" />
            </div>
            <div className="field-sm">
              <label>Nom <span className="text-[var(--red-500)]">*</span></label>
              <input name="nom" value={formData.nom} onChange={handleInputChange} className={errors.nom ? "border-[var(--red-500)]" : ""} placeholder="Ex: Dupont" />
            </div>
          </div>

          {isPro && (
            <div className="field-sm">
              <label>Entreprise <span className="text-[var(--red-500)]">*</span></label>
              <input name="entreprise" value={formData.entreprise} onChange={handleInputChange} className={errors.entreprise ? "border-[var(--red-500)]" : ""} placeholder="Nom de votre soci&eacute;t&eacute;" />
            </div>
          )}

          <div className="field-sm">
            <label>Adresse email <span className="text-[var(--red-500)]">*</span></label>
            <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={errors.email ? "border-[var(--red-500)]" : ""} placeholder="vous@exemple.fr" />
          </div>

          <div className="form-info flex gap-3 p-4 bg-[var(--paper-2)] border border-[var(--line-warm)] rounded-xl">
            <div className="fi-ic shrink-0 mt-0.5" style={{ color: accent }}><Mail size={16} /></div>
            <div className="fi-txt text-[0.72rem] text-[var(--text-soft)] leading-[1.5]">
              <strong className="text-[var(--text)] font-semibold">100% gratuit.</strong> Votre rapport PDF complet (production, calepinage, etc.) vous sera envoy&eacute; imm&eacute;diatement.
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-visualize w-full py-4 px-9 rounded-[var(--r-sm)] text-white font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all duration-400 ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:brightness-105" style={{ backgroundColor: accent }}>
            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Envoi en cours...</> : <>Recevoir mon &eacute;tude gratuite <ArrowRight size={16} /></>}
          </button>
          
          <p className="form-foot text-[0.62rem] text-center text-[var(--muted)] leading-relaxed">
            En validant, vous acceptez d&apos;&ecirc;tre recontact&eacute; par MAFATEC.<br/>Aucune donn&eacute;e n&apos;est c&eacute;d&eacute;e &agrave; des tiers.
          </p>
        </form>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="step-3 space-y-7 text-center py-4">
      <div className="mx-auto w-[68px] h-[68px] rounded-full flex items-center justify-center bg-green-50 border border-green-100 text-green-500 mb-6">
        <Check size={36} />
      </div>
      
      <div className="space-y-4">
        <h3 className="modal-h text-[1.8rem] font-[var(--serif)] font-medium leading-[1.2]">
          &Eacute;tude <span className="italic text-green-600 not-italic-sans">envoy&eacute;e</span> !
        </h3>
        <div className="modal-sub text-[0.88rem] leading-[1.65] text-[var(--text-soft)] max-w-[360px] mx-auto space-y-3">
          <p>Votre rapport complet a &eacute;t&eacute; envoy&eacute; par email &agrave; <br/><strong className="text-[var(--text)]">{formData.email}</strong>.</p>
          <p>Vous pouvez maintenant acc&eacute;der &agrave; l&apos;ensemble des r&eacute;sultats interactifs sur cette page.</p>
        </div>
      </div>

      <div className="pt-4">
        <button onClick={onClose} className="btn-visualize py-4 px-12 rounded-[var(--r-sm)] bg-[var(--ink-900)] text-white font-semibold tracking-wide transition-all duration-400 ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:bg-[var(--ink-850)] shadow-[var(--sh-md)]">
          Voir mon &eacute;tude
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-scrim fixed inset-0 z-[500] bg-[rgba(7,9,18,0.62)] backdrop-blur-[6px] flex items-center justify-center p-6 opacity-100 visible transition-all duration-400">
      <div className="modal relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-[var(--r-xl)] shadow-[var(--sh-lg)] animate-in fade-in zoom-in-95 duration-500 ease-[var(--ease-lux)]">
        <button onClick={onClose} className="modal-close absolute top-5 right-5 p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors z-10">
          <X size={22} />
        </button>

        <div className="modal-in p-8 md:p-12">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default LeadModal;

// FIXED: Gate component with proper unlocked state handling
export const Gate = ({
  children,
  isUnlocked,
  onUnlock,
  title,
  message,
}: {
  children: React.ReactNode;
  isUnlocked: boolean;
  onUnlock: () => void;
  title: string;
  message: string;
}) => {
  // If unlocked, render children directly without any wrapper or blur
  if (isUnlocked) {
    return <>{children}</>;
  }

  // If locked, show the gate overlay with blurred content
  return (
    <div className="gate relative group">
      <div className="gate-content filter blur-[9px] saturate-[0.85] opacity-[0.62] pointer-events-none select-none transition-all duration-600 ease-[var(--ease-lux)]">
        {children}
      </div>

      <div className="gate-overlay absolute inset-0 z-[5] flex flex-col items-center justify-center text-center p-6 gap-[0.9rem] bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(245,245,247,0.55),rgba(245,245,247,0.2))] transition-opacity duration-500">
        <div className="gate-lock w-[46px] h-[46px] rounded-full flex items-center justify-center bg-white border border-[var(--line-warm)] text-[var(--red-500)] shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect x="4" y="11" width="16" height="10" rx="2"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
        </div>
        <div className="gate-msg font-[var(--serif)] font-medium text-[1.05rem] text-[var(--text)] max-w-[360px] leading-[1.35]">
          {title}
        </div>
        <div className="gate-note text-[0.78rem] text-[var(--text-soft)] max-w-[340px] leading-relaxed -mt-[0.3rem]">
          {message}
        </div>
        <button
          onClick={onUnlock}
          className="btn-unlock inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.82rem] tracking-wide px-[1.7rem] py-[0.8rem] rounded-[var(--r-sm)] bg-[var(--red-500)] text-white transition-all duration-[0.4s] ease-[var(--ease-lux)] hover:-translate-y-0.5 hover:brightness-105 shadow-[var(--sh-sm)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          D&eacute;verrouiller
        </button>
      </div>
    </div>
  );
};