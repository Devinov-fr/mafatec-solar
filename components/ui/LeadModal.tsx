'use client';

import React, { useState, useEffect } from "react";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (data: any) => void;
  studyData?: any;
}

const LeadModal = ({ isOpen, onClose, onUnlock, studyData }: LeadModalProps) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [universe, setUniverse] = useState<"part" | "pro" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    isNew?: boolean;
    user?: { activated?: boolean };
    activationLink?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    entreprise: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Log what data we're receiving
  console.log('🔵 LeadModal received studyData:', studyData);
  console.log('🔵 studyData keys:', Object.keys(studyData || {}));

  if (!isOpen) return null;

  const isPro = universe === "pro";

  const handleUniverseSelect = (u: "part" | "pro") => {
    setUniverse(u);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }));
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.prenom.trim()) newErrors.prenom = true;
    if (!formData.nom.trim()) newErrors.nom = true;
    if (isPro && !formData.entreprise.trim()) newErrors.entreprise = true;
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const firstErr = document.querySelector<HTMLInputElement>(".err");
      firstErr?.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      console.log('📤 ========== SENDING TO API ==========');
      console.log('📤 studyData received:', studyData);
      
      // CRITICAL: Build params and results from studyData
      const params = {
        inclinaison: studyData?.inclinaison || "35",
        azimut: studyData?.azimut || "0",
        systemLosses: studyData?.systemLosses || "14",
        pertes: studyData?.systemLosses || "14",
        panels: studyData?.panels || [],
        obstacles: studyData?.obstacles || [],
        voltageDropResult: studyData?.voltageDropResult || null,
        calepinageImage: studyData?.calepinageImage || null,
      };

      const results = {
        production: studyData?.production || 0,
        irradiation: studyData?.irradiation || 0,
        variabilite: studyData?.variabilite || 0,
        monthly: studyData?.monthly || [],
        fullData: studyData?.data || {},
      };

      console.log('📤 params being sent:', params);
      console.log('📤 results being sent:', results);
      console.log('📤 results.monthly length:', results.monthly?.length || 0);
      console.log('📤 params.panels length:', params.panels?.length || 0);

      const payload = {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        entreprise: formData.entreprise,
        type: universe,
        universe: universe,
        studyData: {
          // Basic info
          puissance: studyData?.puissance || "0",
          adresse: studyData?.adresse || "Adresse non définie",
          lat: studyData?.lat || 0,
          lng: studyData?.lng || 0,
          
          // PARAMS - This is critical!
          params: params,
          
          // RESULTS - This is critical!
          results: results,
          
          // Keep flat values for backward compatibility
          inclinaison: studyData?.inclinaison || "35",
          azimut: studyData?.azimut || "0",
          systemLosses: studyData?.systemLosses || "14",
          panels: studyData?.panels || [],
          obstacles: studyData?.obstacles || [],
          voltageDropResult: studyData?.voltageDropResult || null,
          calepinageImage: studyData?.calepinageImage || null,
          production: studyData?.production || 0,
          irradiation: studyData?.irradiation || 0,
          variabilite: studyData?.variabilite || 0,
          monthly: studyData?.monthly || [],
          data: studyData?.data || {},
        }
      };

      console.log('📤 Full payload being sent:', JSON.stringify(payload, null, 2));

      const response = await fetch("/api/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      console.log('📥 API Response:', data);
      
      if (response.ok && data.success) {
        setSubmissionResult({ 
          isNew: data.isNew, 
          user: { activated: !data.isNew },
          activationLink: data.activationToken ? `activate?token=${data.activationToken}&email=${encodeURIComponent(formData.email)}` : undefined
        });
        setStep(3);
        onUnlock({ 
          ...formData, 
          universe,
          studyId: data.studyId,
          reportUrl: data.reportUrl
        });
        toast.success("Votre étude a été envoyée par email !");
      } else {
        toast.error(data.error || "Une erreur est survenue lors de l'envoi.");
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error("Une erreur de connexion est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── STEP 1 ── */
  const renderStep1 = () => (
    <div className="step active" data-step="1">
      <div className="modal-head text-center">
        <span className="modal-eyebrow flex justify-center items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase mb-5 text-[#c93b18]">
          <span className="mark w-[26px] h-px bg-[#c93b18]" />
          Étude complète
        </span>
        <h3 className="text-[1.8rem] font-serif font-medium leading-[1.2] mb-4 text-[#15172b]">
          Vous êtes <em className="not-italic italic text-[#c93b18]">particulier</em> ou <em className="not-italic italic text-[#c93b18]">professionnel</em>&thinsp;?
        </h3>
        <p className="text-[0.88rem] leading-[1.55] text-[#454a63] max-w-[420px] mx-auto mb-6">
          Indiquez votre profil pour personnaliser votre rapport et accéder à
          l'ensemble des résultats de votre étude.
        </p>
        <div className="modal-steps flex justify-center items-center gap-1.5 mb-8">
          <span className="inline-block rounded-full transition-all duration-300 w-7 h-2 bg-[#c93b18]" />
          <span className="inline-block rounded-full transition-all duration-300 w-2 h-2 bg-slate-200" />
          <span className="inline-block rounded-full transition-all duration-300 w-2 h-2 bg-slate-200" />
        </div>
      </div>

      <div className="modal-body">
        <div className="universe-choice grid grid-cols-1 md:grid-cols-2 gap-[0.9rem]">
          <button onClick={() => handleUniverseSelect("part")} className="group flex flex-col items-center p-8 rounded-[18px] bg-white border border-[#e8e8ea] text-center transition-all hover:border-[#c93b18] hover:shadow-[0_18px_50px_rgba(11,14,29,0.12)]">
            <span className="mb-4 text-[#c93b18]"><img src="/assets/profil-particulier.svg" alt="" width="76" height="76" /></span>
            <h4 className="text-[1.1rem] font-bold text-[#c93b18] mb-1">Particulier</h4>
            <p className="text-[0.74rem] text-[#7a7e95]">Pour votre résidence ou logement.</p>
            <span className="mt-5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[#c93b18] flex items-center gap-1.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
              Continuer <ArrowRight size={12} />
            </span>
          </button>
          <button onClick={() => handleUniverseSelect("pro")} className="group flex flex-col items-center p-8 rounded-[18px] bg-white border border-[#e8e8ea] text-center transition-all hover:border-[#3a55b0] hover:shadow-[0_18px_50px_rgba(11,14,29,0.12)]">
            <span className="mb-4 text-[#3a55b0]"><img src="/assets/profil-professionnel.svg" alt="" width="76" height="76" /></span>
            <h4 className="text-[1.1rem] font-bold text-[#3a55b0] mb-1">Professionnel</h4>
            <p className="text-[0.74rem] text-[#7a7e95]">Pour votre entreprise ou bâtiment tertiaire.</p>
            <span className="mt-5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[#3a55b0] flex items-center gap-1.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
              Continuer <ArrowRight size={12} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  /* ── STEP 2 ── */
  const renderStep2 = () => (
    <div className="step active" data-step="2">
      <div className="modal-head text-center">
        <span className={`modal-eyebrow flex justify-center items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase mb-5 ${isPro ? 'text-[#3a55b0]' : 'text-[#c93b18]'}`}>
          <span className={`mark w-[26px] h-px ${isPro ? 'bg-[#3a55b0]' : 'bg-[#c93b18]'}`} />
          Recevez votre rapport
        </span>
        <h3 className="text-[1.6rem] font-serif font-medium leading-[1.2] mb-3 text-[#15172b]">
          Votre étude <em className="not-italic italic">vous attend</em>
        </h3>
        <p className="text-[0.84rem] text-[#454a63] max-w-[380px] mx-auto mb-6">
          Renseignez vos coordonnées : votre rapport complet vous est envoyé gratuitement.
        </p>
        <div className="modal-steps flex justify-center items-center gap-1.5 mb-8">
          <span className="inline-block rounded-full w-2 h-2 bg-green-500" />
          <span className={`inline-block rounded-full w-7 h-2 ${isPro ? 'bg-[#3a55b0]' : 'bg-[#c93b18]'}`} />
          <span className="inline-block rounded-full w-2 h-2 bg-slate-200" />
        </div>
      </div>

      <div className="modal-body">
        <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[0.66rem] font-bold tracking-widest uppercase text-[#7a7e95] hover:text-[#15172b] transition-colors mb-2">
          ← Changer de profil
        </button>
        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white mb-5 ${isPro ? 'bg-[#3a55b0]' : 'bg-[#c93b18]'}`}>
          {isPro ? "Professionnel" : "Particulier"}
        </span>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-[#454a63]">Prénom <span className="text-[#c93b18]">*</span></label>
              <input type="text" name="prenom" autoComplete="given-name" value={formData.prenom} onChange={handleInputChange} className={`w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors ${errors.prenom ? "border-[#c93b18] err" : "border-[#e8e8ea] focus:border-[#c93b18]"}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase text-[#454a63]">Nom <span className="text-[#c93b18]">*</span></label>
              <input type="text" name="nom" autoComplete="family-name" value={formData.nom} onChange={handleInputChange} className={`w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors ${errors.nom ? "border-[#c93b18] err" : "border-[#e8e8ea] focus:border-[#c93b18]"}`} />
            </div>
          </div>

          <div className={`flex flex-col gap-1 ${!isPro ? "hidden" : ""}`}>
            <label className="text-[11px] font-bold uppercase text-[#454a63]">Entreprise <span className="text-[#c93b18]">*</span></label>
            <input type="text" name="entreprise" autoComplete="organization" value={formData.entreprise} onChange={handleInputChange} className={`w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors ${errors.entreprise ? "border-[#c93b18] err" : "border-[#e8e8ea] focus:border-[#c93b18]"}`} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-[#454a63]">Adresse email <span className="text-[#c93b18]">*</span></label>
            <input type="email" name="email" autoComplete="email" placeholder="vous@exemple.fr" value={formData.email} onChange={handleInputChange} className={`w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors ${errors.email ? "border-[#c93b18] err" : "border-[#e8e8ea] focus:border-[#c93b18]"}`} />
          </div>

          <div className={`flex gap-3 p-4 rounded-xl border border-[#e8e8ea] mt-2 ${isPro ? 'bg-[rgba(30,64,175,0.04)]' : 'bg-[rgba(224,85,46,0.04)]'}`}>
            <Mail size={18} className={isPro ? 'text-[#3a55b0]' : 'text-[#c93b18]'} />
            <p className="text-[0.72rem] text-[#454a63] leading-[1.6] m-0">
              <strong className="text-[#15172b] font-semibold">100% gratuit.</strong> Votre rapport PDF complet — production, irradiation, calepinage et diagramme solaire — vous sera envoyé à l'adresse renseignée.
            </p>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full py-4 px-9 rounded-[6px] text-white font-bold tracking-wide flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 shadow-[0_18px_50px_rgba(11,14,29,0.12)] ${isPro ? 'bg-[#3a55b0]' : 'bg-[#c93b18]'}`}>
            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Envoi en cours...</> : <>Recevoir mon étude gratuite <ArrowRight size={18} /></>}
          </button>
          <p className="text-[0.62rem] text-center text-[#7a7e95] leading-relaxed mt-3">En validant, vous acceptez d'être recontacté par MAFATEC. Aucune donnée n'est cédée à des tiers.</p>
        </form>
      </div>
    </div>
  );

  /* ── STEP 3 ── */
  const renderStep3 = () => {
    const isNew = submissionResult?.isNew;
    const isActivated = submissionResult?.user?.activated;
    const email = formData.email;
    const tokenLink = submissionResult?.activationLink;

    let title = <>Étude <em className="not-italic text-[#c93b18]">envoyée</em>&thinsp;!</>;
    let msg = <>Votre étude photovoltaïque complète a été envoyée par email à <span className="font-bold text-[#15172b]">{email}</span>.</>;
    let extra = null;

    if (isNew) {
      title = <>Compte <em className="not-italic italic text-[#c93b18]">créé</em> &amp; étude envoyée</>;
      msg = (
        <>
          Votre rapport a été envoyé par email à <span className="font-bold text-[#15172b]">{email}</span>.<br />
          Comme c'est votre première étude, un <strong>compte a été créé</strong> : un email d'activation contenant un <strong>lien unique valable 3 jours</strong> vous permet de définir votre mot de passe.
        </>
      );

      if (tokenLink) {
        extra = (
          <div className="bg-[#f5f5f7] border border-[#e8e8ea] rounded-xl p-6 text-left space-y-4 mt-6">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7a7e95]">
              <Mail size={14} /> Lien d'activation
            </span>
            <a href={tokenLink} className="w-full py-3.5 px-6 rounded-[6px] bg-[#c93b18] text-white font-bold text-[0.8rem] flex items-center justify-center gap-2 transition-all hover:brightness-105">
              Activer mon compte <ArrowRight size={16} />
            </a>
          </div>
        );
      }
    } else if (!isActivated) {
      title = <>Étude <em className="not-italic text-[#3a55b0]">ajoutée</em> à votre compte</>;
      msg = (
        <>
          Votre rapport a été envoyé par email à <span className="font-bold text-[#15172b]">{email}</span>. Cette étude a été enregistrée sur votre compte.<br />
          Votre compte n'est <strong>pas encore activé</strong> — utilisez le lien d'activation (valable 3 jours) pour définir votre mot de passe.
        </>
      );
      extra = (
        <div className="bg-[#f5f5f7] border border-[#e8e8ea] rounded-xl p-6 text-left space-y-4 mt-6">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7a7e95]">
            <Mail size={14} /> Lien d'activation
          </span>
          <a href={`/login?email=${encodeURIComponent(email)}`} className="w-full py-3.5 px-6 rounded-[6px] bg-[#3a55b0] text-white font-bold text-[0.8rem] flex items-center justify-center gap-2 transition-all hover:bg-black">
            Activer mon compte <ArrowRight size={16} />
          </a>
        </div>
      );
    } else {
      title = <>Étude <em className="not-italic text-[#3a55b0]">ajoutée</em> à votre espace</>;
      msg = (
        <>
          Votre rapport a été envoyé par email à <span className="font-bold text-[#15172b]">{email}</span>. Cette étude a été <strong>enregistrée sur votre compte</strong> — connectez-vous pour retrouver l'ensemble de vos études.
        </>
      );
      extra = (
        <button onClick={() => router.push('/login')} className="w-full mt-6 py-3.5 px-6 rounded-[6px] font-bold text-[0.8rem] flex items-center justify-center gap-2 border-2 border-[#e8e8ea] text-[#15172b] hover:bg-[#f5f5f7] transition-all">
          Accéder à mon espace <ArrowRight size={16} />
        </button>
      );
    }

    return (
      <div className="step active" data-step="3">
        <div className="modal-body">
          <div className="text-center py-4">
            <span className={`w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-6 bg-white border border-[#e8e8ea] ${isNew ? 'text-[#c93b18]' : 'text-[#3a55b0]'}`}>
              <Mail size={32} />
            </span>
            <h3 className="text-[1.8rem] font-serif font-medium leading-[1.2] mb-4 text-[#15172b]">{title}</h3>
            <p className="text-[0.88rem] leading-[1.65] text-[#454a63] max-w-[420px] mx-auto">{msg}</p>
            {extra}
            <button onClick={() => { window.location.reload(); }} className="w-full mt-8 py-4 px-9 rounded-[6px] bg-[#f5f5f7] text-[#15172b] font-bold tracking-wide hover:bg-slate-200 transition-all">
              Nouvelle étude
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-scrim fixed inset-0 z-[500] bg-[rgba(7,9,18,0.62)] backdrop-blur-[6px] flex items-center justify-center p-6">
      <div className="modal relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-[26px] shadow-[0_40px_90px_rgba(11,14,29,0.22)]">
        <div className="p-8 md:p-12">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default LeadModal;

export const Gate = ({ children, isUnlocked, onUnlock, title, message }: any) => {
  if (isUnlocked) return <>{children}</>;
  return (
    <div className="gate relative">
      <div className="gate-content pointer-events-none select-none blur-[9px] saturate-[0.85] opacity-[0.62] transition-all duration-500">{children}</div>
      <div className="gate-overlay absolute inset-0 z-[5] flex flex-col items-center justify-center text-center p-6 gap-[0.9rem] bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(245,245,247,0.55),rgba(245,245,247,0.2))]">
        <span className="w-[46px] h-[46px] rounded-full flex items-center justify-center bg-white border border-[#e8e8ea] text-[#c93b18] shadow-sm"><Mail size={20} /></span>
        <span className="font-serif font-medium text-[1.05rem] text-[#15172b] max-w-[360px] leading-[1.35]">{title}</span>
        <span className="text-[0.78rem] text-[#454a63] max-w-[340px] leading-relaxed">{message}</span>
        <button onClick={onUnlock} className="inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.82rem] tracking-wide px-[1.7rem] py-[0.8rem] rounded-[6px] bg-[#c93b18] text-white transition-all hover:-translate-y-0.5 hover:brightness-105 shadow-sm">Voir cette information</button>
      </div>
    </div>
  );
};