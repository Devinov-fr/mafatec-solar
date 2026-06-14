"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (data: any) => void;
  studyData?: {
    puissance: string;
    adresse: string;
    production?: number;
    irradiation?: number;
    variabilite?: number;
  };
}

/* ── Inline SVG arrows matching the JS file exactly ── */
const ArrowSVG = ({ size = 16 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    width={size}
    height={size}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ArrowLeftSVG = ({ size = 16 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    width={size}
    height={size}
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const MailSVG = ({ size = 20 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M4 5h16v14H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const LockSVG = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const EyeSVG = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-[15px] h-[15px]"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ── Profil icons matching JS UNI_ICONS (inline SVG instead of <img>) ── */
const ParticulierIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" width="76" height="76">
    <path d="M36 9 58 16v18c0 13-9.5 21.5-22 26-12.5-4.5-22-13-22-26V16z"
      fill="currentColor" fillOpacity=".04" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="36" cy="25" r="4.4" fill="#d9b25a" fillOpacity=".22" stroke="#d9b25a" strokeOpacity=".7" strokeWidth="1.2" />
    <g stroke="#d9b25a" strokeOpacity=".6" strokeWidth="1" strokeLinecap="round">
      <line x1="36" y1="17.6" x2="36" y2="19.4" /><line x1="36" y1="30.6" x2="36" y2="32.4" />
      <line x1="28.6" y1="25" x2="30.4" y2="25" /><line x1="41.6" y1="25" x2="43.4" y2="25" />
      <line x1="30.9" y1="19.9" x2="32.2" y2="21.2" /><line x1="39.8" y1="28.8" x2="41.1" y2="30.1" />
      <line x1="41.1" y1="19.9" x2="39.8" y2="21.2" /><line x1="32.2" y1="28.8" x2="30.9" y2="30.1" />
    </g>
    <path d="M25 44 36 35 47 44" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M37.6 40 33 48h3l-1.2 5 5.6-7.2h-3z" fill="#e0552e" opacity=".95" />
    <line x1="27" y1="52" x2="45" y2="52" stroke="#d9b25a" strokeOpacity=".5" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const ProfessionnelIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" width="76" height="76">
    <path d="M36 8 59 21v26L36 60 13 47V21z"
      fill="currentColor" fillOpacity=".04" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="26" y="34" width="6" height="16" rx="1" fill="#6ea8d8" fillOpacity=".18" stroke="#6ea8d8" strokeOpacity=".6" strokeWidth="1.1" />
    <rect x="33.5" y="28" width="6" height="22" rx="1" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.3" />
    <rect x="41" y="38" width="6" height="12" rx="1" fill="#6ea8d8" fillOpacity=".18" stroke="#6ea8d8" strokeOpacity=".6" strokeWidth="1.1" />
    <rect x="33.5" y="24.5" width="6" height="3.5" rx=".8" fill="#d9b25a" fillOpacity=".34" stroke="#d9b25a" strokeOpacity=".6" strokeWidth="1" />
    <line x1="36.5" y1="20" x2="36.5" y2="24.5" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="36.5" cy="18.7" r="2" fill="#e0552e" fillOpacity=".9" />
    <line x1="24" y1="50" x2="48" y2="50" stroke="#d9b25a" strokeOpacity=".5" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="21.5" cy="30" r="1.4" fill="#6ea8d8" />
    <circle cx="50.5" cy="30" r="1.4" fill="#6ea8d8" />
    <path d="M21.5 30 26 36M50.5 30 46.5 38" stroke="#6ea8d8" strokeOpacity=".4" strokeWidth="1" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Step dots — pill for active, small circle for done/inactive
   Matches JS: <span class="dot active">, <span class="dot done">, <span class="dot">
   Colors driven by Tailwind conditional classes (part=red, pro=blue)
───────────────────────────────────────────────────────────────────────────── */
const StepDots = ({
  current,
  isPro,
}: {
  current: 1 | 2 | 3;
  isPro: boolean;
}) => {
  const activePill = isPro ? "bg-[var(--logo-blue)]" : "bg-[var(--red-500)]";
  const doneDot = "bg-green-500";
  const inactiveDot = "bg-slate-200";

  const dot = (idx: 1 | 2 | 3) => {
    const isActive = current === idx;
    const isDone = current > idx;
    return (
      <span
        key={idx}
        className={[
          "inline-block rounded-full transition-all duration-300",
          isActive ? `w-7 h-2 ${activePill}` : `w-2 h-2 ${isDone ? doneDot : inactiveDot}`,
        ].join(" ")}
      />
    );
  };

  return (
    <div className="modal-steps flex justify-center items-center gap-1.5 mb-8">
      {([1, 2, 3] as const).map(dot)}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   LEAD MODAL
───────────────────────────────────────────────────────────────────────────── */
const LeadModal = ({ isOpen, onClose, onUnlock, studyData }: LeadModalProps) => {
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

  if (!isOpen) return null;

  const isPro = universe === "pro";

  /* accent helpers — Tailwind class strings */
  const accentText  = isPro ? "text-[var(--logo-blue)]"   : "text-[var(--red-500)]";
  const accentBg    = isPro ? "bg-[var(--logo-blue)]"     : "bg-[var(--red-500)]";
  const accentBorder = isPro ? "border-[var(--logo-blue)]" : "border-[var(--red-500)]";
  const markBg      = isPro ? "bg-[var(--logo-blue)]"     : "bg-[var(--red-500)]";
  const inputFocus  = isPro
    ? "focus:border-[var(--logo-blue)]"
    : "focus:border-[var(--red-500)]";
  const promiseBg   = isPro ? "bg-[rgba(30,64,175,0.04)]" : "bg-[rgba(224,85,46,0.04)]";

  /* ── handlers ── */
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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, universe, studyData }),
      });
      if (response.ok) {
        await response.json();
        setSubmissionResult({ isNew: true, activationLink: "activation/demo-token" });
        Cookies.set("mafatec-etude-unlocked", "true", { expires: 7 });
        setStep(3);
        onUnlock({ ...formData, universe });
      } else {
        alert("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
      }
    } catch {
      alert("Une erreur de connexion est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── STEP 1 — univers ── */
  const renderStep1 = () => (
    <div className="step active" data-step="1">
      <div className="modal-head text-center">
        <span className="modal-eyebrow text-[var(--red-500)] flex justify-center items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase mb-5">
          <span className="mark w-[26px] h-px bg-[var(--red-500)]" />
          Étude complète
        </span>
        <h3 className="text-[1.8rem] font-[var(--serif)] font-medium leading-[1.2] mb-4">
          Vous êtes{" "}
          <em className="not-italic text-[var(--red-500)]">particulier</em>{" "}
          ou{" "}
          <em className="not-italic text-[var(--red-500)]">professionnel</em>
          &#8201;?
        </h3>
        <p className="text-[0.88rem] leading-[1.55] text-[var(--text-soft)] max-w-[420px] mx-auto mb-6">
          Indiquez votre profil pour personnaliser votre rapport et accéder à
          l'ensemble des résultats de votre étude.
        </p>
        {/* Step 1 dots — isPro is null here, always red */}
        <div className="modal-steps flex justify-center items-center gap-1.5 mb-8">
          <span className="inline-block rounded-full transition-all duration-300 w-7 h-2 bg-[var(--red-500)]" />
          <span className="inline-block rounded-full transition-all duration-300 w-2 h-2 bg-slate-200" />
          <span className="inline-block rounded-full transition-all duration-300 w-2 h-2 bg-slate-200" />
        </div>
      </div>

      <div className="modal-body">
        <div className="universe-choice grid grid-cols-1 md:grid-cols-2 gap-[0.9rem]">

          {/* Particulier */}
          <button
            onClick={() => handleUniverseSelect("part")}
            className="uni-card part group flex flex-col items-center p-8 rounded-[var(--r-lg)] bg-white border border-[var(--line-warm)] text-center transition-all hover:border-[var(--red-500)] hover:shadow-[var(--sh-md)]"
          >
            <span className="uni-ic mb-4 text-[var(--red-500)]">
              <ParticulierIcon />
            </span>
            <h4 className="text-[1.1rem] font-bold text-[var(--red-500)] mb-1">Particulier</h4>
            <p className="text-[0.74rem] text-[var(--muted)]">Pour votre résidence ou logement.</p>
            <span className="uni-go mt-5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--red-500)] flex items-center gap-1.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
              Continuer <ArrowSVG size={12} />
            </span>
          </button>

          {/* Professionnel */}
          <button
            onClick={() => handleUniverseSelect("pro")}
            className="uni-card pro group flex flex-col items-center p-8 rounded-[var(--r-lg)] bg-white border border-[var(--line-warm)] text-center transition-all hover:border-[var(--logo-blue)] hover:shadow-[var(--sh-md)]"
          >
            <span className="uni-ic mb-4 text-[var(--logo-blue)]">
              <ProfessionnelIcon />
            </span>
            <h4 className="text-[1.1rem] font-bold text-[var(--logo-blue)] mb-1">Professionnel</h4>
            <p className="text-[0.74rem] text-[var(--muted)]">Pour votre entreprise ou bâtiment tertiaire.</p>
            <span className="uni-go mt-5 text-[0.66rem] font-bold tracking-[0.1em] uppercase text-[var(--logo-blue)] flex items-center gap-1.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
              Continuer <ArrowSVG size={12} />
            </span>
          </button>

        </div>
      </div>
    </div>
  );

  /* ── STEP 2 — formulaire ── */
  const renderStep2 = () => (
    <div className="step active" data-step="2">
      <div className="modal-head text-center">
        <span className={`modal-eyebrow flex justify-center items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.32em] uppercase mb-5 ${accentText}`}>
          <span className={`mark w-[26px] h-px ${markBg}`} />
          Recevez votre rapport
        </span>
        <h3 className="text-[1.6rem] font-[var(--serif)] font-medium leading-[1.2] mb-3">
          Votre étude <em className={`not-italic ${accentText}`}>vous attend</em>
        </h3>
        <p className="text-[0.84rem] text-[var(--text-soft)] max-w-[380px] mx-auto mb-6">
          Renseignez vos coordonnées : votre rapport complet vous est envoyé gratuitement.
        </p>
        <StepDots current={2} isPro={isPro} />
      </div>

      <div className="modal-body">
        {/* Back link — stacked above tag, matching JS layout */}
        <button
          onClick={() => setStep(1)}
          className="modal-back flex items-center gap-1.5 text-[0.66rem] font-bold tracking-widest uppercase text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-2"
        >
          <ArrowLeftSVG size={14} /> Changer de profil
        </button>

        {/* Universe tag — below back link, separate element */}
        <span className={`modal-universe-tag inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white mb-5 ${accentBg}`}>
          {isPro ? "Professionnel" : "Particulier"}
        </span>

        <form onSubmit={handleSubmit} className="mform space-y-4" noValidate>
          <div className="frow grid grid-cols-2 gap-3">
            <div className="field">
              <label className="block text-[11px] font-bold uppercase text-[var(--text-soft)] mb-1">
                Prénom <span className="text-[var(--red-500)]">*</span>
              </label>
              <input
                type="text"
                name="prenom"
                autoComplete="given-name"
                value={formData.prenom}
                onChange={handleInputChange}
                className={[
                  "w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors",
                  errors.prenom ? "border-[var(--red-500)] err" : `border-[var(--line-warm)] ${inputFocus}`,
                ].join(" ")}
              />
            </div>
            <div className="field">
              <label className="block text-[11px] font-bold uppercase text-[var(--text-soft)] mb-1">
                Nom <span className="text-[var(--red-500)]">*</span>
              </label>
              <input
                type="text"
                name="nom"
                autoComplete="family-name"
                value={formData.nom}
                onChange={handleInputChange}
                className={[
                  "w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors",
                  errors.nom ? "border-[var(--red-500)] err" : `border-[var(--line-warm)] ${inputFocus}`,
                ].join(" ")}
              />
            </div>
          </div>

          {/* Entreprise — always rendered, hidden when part (matches JS always-in-DOM approach) */}
          <div className={`field ${!isPro ? "hidden" : ""}`}>
            <label className="block text-[11px] font-bold uppercase text-[var(--text-soft)] mb-1">
              Entreprise <span className="text-[var(--red-500)]">*</span>
            </label>
            <input
              type="text"
              name="entreprise"
              autoComplete="organization"
              value={formData.entreprise}
              onChange={handleInputChange}
              className={[
                "w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors",
                errors.entreprise ? "border-[var(--red-500)] err" : `border-[var(--line-warm)] ${inputFocus}`,
              ].join(" ")}
            />
          </div>

          <div className="field">
            <label className="block text-[11px] font-bold uppercase text-[var(--text-soft)] mb-1">
              Adresse email <span className="text-[var(--red-500)]">*</span>
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              value={formData.email}
              onChange={handleInputChange}
              className={[
                "w-full py-3 px-4 rounded-[5px] bg-white text-[0.9rem] outline-none border transition-colors",
                errors.email ? "border-[var(--red-500)] err" : `border-[var(--line-warm)] ${inputFocus}`,
              ].join(" ")}
            />
          </div>

          {/* Promise box */}
          <div className={`mform-promise flex gap-3 p-4 rounded-xl border border-[var(--line-warm)] mt-2 ${promiseBg}`}>
            <span className={`shrink-0 mt-0.5 ${accentText}`}>
              <MailSVG size={18} />
            </span>
            <p className="text-[0.72rem] text-[var(--text-soft)] leading-[1.6] m-0">
              <strong className="text-[var(--text)] font-semibold">100% gratuit.</strong>{" "}
              Votre rapport PDF complet — production, irradiation, calepinage et diagramme
              solaire — vous sera envoyé à l'adresse renseignée, avec tous les détails de l'étude.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "btn-submit w-full py-4 px-9 rounded-[var(--r-sm)] text-white font-bold tracking-wide",
              "flex items-center justify-center gap-2.5",
              "transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 shadow-[var(--sh-md)]",
              accentBg,
            ].join(" ")}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Envoi en cours...
              </>
            ) : (
              <>
                Recevoir mon étude gratuite
                <ArrowSVG size={18} />
              </>
            )}
          </button>

          <p className="mform-fine text-[0.62rem] text-center text-[var(--muted)] leading-relaxed mt-3">
            En validant, vous acceptez d'être recontacté par MAFATEC.{" "}
            Aucune donnée n'est cédée à des tiers.
          </p>
        </form>
      </div>
    </div>
  );

  /* ── STEP 3 — confirmation ── */
  const renderStep3 = () => {
    const isNew       = submissionResult?.isNew;
    const isActivated = submissionResult?.user?.activated;
    const email       = formData.email;

    /* Icon circle — matches JS fillStep3 logic */
    let iconBg     = "#fef2f2";
    let iconBorder = "#fecaca";
    let iconColor  = "text-[#e0552e]";
    if (!isNew && !isActivated) {
      iconBg = "#eff6ff"; iconBorder = "#bfdbfe"; iconColor = "text-[var(--logo-blue)]";
    } else if (!isNew && isActivated) {
      iconBg = "#f0fdf4"; iconBorder = "#bbf7d0"; iconColor = "text-green-600";
    }

    /* Activation button colour — red for new (JS btn-step3 default), navy for existing */
    const activateBtnClass = isNew
      ? "bg-[var(--red-500)] text-white hover:brightness-105"
      : "bg-[#1e293b] text-white hover:bg-black";

    /* demoBox — equivalent of JS demoBox() */
    const DemoBox = ({ href, cta }: { href: string; cta: string }) => (
      <div className="step3-demo bg-[#f5f5f7] border border-[var(--line-warm)] rounded-xl p-6 text-left space-y-4 mt-6">
        <span className="s3d-label flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
          <MailSVG size={14} /> Lien d'activation (simulation d'email)
        </span>
        <a
          href={href}
          className={[
            "btn-step3 w-full py-3.5 px-6 rounded-[var(--r-sm)] font-bold text-[0.8rem]",
            "flex items-center justify-center gap-2 transition-all",
            activateBtnClass,
          ].join(" ")}
        >
          {cta} <ArrowSVG size={16} />
        </a>
        <span className="s3d-note text-[10px] text-[var(--muted)] block leading-normal italic">
          Dans la version finale, ce lien est transmis uniquement par email.
          Affiché ici pour vous permettre de tester le parcours.
        </span>
      </div>
    );

    let title: React.ReactNode;
    let msg: React.ReactNode;
    let extra: React.ReactNode = null;

    if (!submissionResult) {
      title = <>Étude <em className="not-italic text-[var(--red-500)]">envoyée</em>&#8201;!</>;
      msg   = <>Votre étude photovoltaïque complète a été envoyée par email à <span className="email font-bold text-[var(--text)]">{email}</span>.</>;
    } else if (isNew) {
      title = <>Compte <em className="not-italic text-[var(--red-500)]">créé</em> &amp; étude envoyée</>;
      msg = (
        <>
          Votre rapport a été envoyé par email à <span className="email font-bold text-[var(--text)]">{email}</span>.<br />
          Comme c'est votre première étude, un <strong>compte a été créé</strong> : un email d'activation contenant
          un <strong>lien unique valable 3 jours</strong> vous permet de définir votre mot de passe et d'accéder à votre espace.
        </>
      );
      extra = <DemoBox href={`espace/${submissionResult.activationLink}`} cta="Activer mon compte" />;
    } else if (!isActivated) {
      title = <>Étude <em className="not-italic text-[var(--logo-blue)]">ajoutée</em> à votre compte</>;
      msg = (
        <>
          Votre rapport a été envoyé par email à <span className="email font-bold text-[var(--text)]">{email}</span>. Cette étude a été enregistrée sur votre compte.<br />
          Votre compte n'est <strong>pas encore activé</strong> — utilisez le lien d'activation (valable 3 jours) pour définir votre mot de passe.
        </>
      );
      extra = <DemoBox href={`espace/connexion.html?email=${encodeURIComponent(email)}`} cta="Activer mon compte" />;
    } else {
      title = <>Étude <em className="not-italic text-[var(--logo-blue)]">ajoutée</em> à votre espace</>;
      msg = (
        <>
          Votre rapport a été envoyé par email à <span className="email font-bold text-[var(--text)]">{email}</span>. Cette étude a été{" "}
          <strong>enregistrée sur votre compte</strong> — connectez-vous pour retrouver l'ensemble de vos études.
        </>
      );
      extra = (
        <a
          href={`espace/connexion.html?email=${encodeURIComponent(email)}`}
          className="btn-step3 ghost w-full mt-6 py-3.5 px-6 rounded-[var(--r-sm)] font-bold text-[0.8rem] flex items-center justify-center gap-2 border-2 border-[var(--line-warm)] text-[var(--text)] hover:bg-[#f5f5f7] transition-all"
        >
          Accéder à mon espace <ArrowSVG size={16} />
        </a>
      );
    }

    return (
      <div className="step active" data-step="3">
        <div className="modal-body">
          <div className="modal-success text-center py-4">
            <span
              className={`success-ic w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-6 ${iconColor}`}
              style={{ backgroundColor: iconBg, border: `1px solid ${iconBorder}` }}
            >
              <MailSVG size={32} />
            </span>
            <h3 className="text-[1.8rem] font-[var(--serif)] font-medium leading-[1.2] mb-4">
              {title}
            </h3>
            <p className="text-[0.88rem] leading-[1.65] text-[var(--text-soft)] max-w-[420px] mx-auto">
              {msg}
            </p>
            {extra}
            <button
              onClick={() => location.reload()}
              className="btn-success-close w-full mt-8 py-4 px-9 rounded-[var(--r-sm)] bg-[#f5f5f7] text-[var(--text)] font-bold tracking-wide hover:bg-slate-200 transition-all"
            >
              Nouvelle étude
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ── MODAL SHELL ── */
  return (
    <div
      className="modal-scrim fixed inset-0 z-[500] bg-[rgba(7,9,18,0.62)] backdrop-blur-[6px] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto bg-white rounded-[var(--r-xl)] shadow-[var(--sh-lg)]">
        <button
          onClick={onClose}
          className="modal-close absolute top-5 right-5 p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors z-10"
          aria-label="Fermer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={22} height={22}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
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

/* ─────────────────────────────────────────────────────────────────────────────
   GATE — matches JS gateWrap() + unlockAll() pattern
───────────────────────────────────────────────────────────────────────────── */
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
  if (isUnlocked) return <>{children}</>;

  return (
    <div className="gate relative">
      {/* Blurred content behind the gate */}
      <div className="gate-content pointer-events-none select-none blur-[9px] saturate-[0.85] opacity-[0.62] transition-all duration-500">
        {children}
      </div>

      {/* Overlay */}
      <div className="gate-overlay absolute inset-0 z-[5] flex flex-col items-center justify-center text-center p-6 gap-[0.9rem] bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(245,245,247,0.55),rgba(245,245,247,0.2))]">
        <span className="gate-lock w-[46px] h-[46px] rounded-full flex items-center justify-center bg-white border border-[var(--line-warm)] text-[var(--red-500)] shadow-sm">
          <LockSVG />
        </span>
        <span className="gate-msg font-[var(--serif)] font-medium text-[1.05rem] text-[var(--text)] max-w-[360px] leading-[1.35]">
          {title}
        </span>
        <span className="gate-note text-[0.78rem] text-[var(--text-soft)] max-w-[340px] leading-relaxed">
          {message}
        </span>
        <button
          onClick={onUnlock}
          className="btn-unlock inline-flex items-center gap-[0.6rem] font-sans font-semibold text-[0.82rem] tracking-wide px-[1.7rem] py-[0.8rem] rounded-[var(--r-sm)] bg-[var(--red-500)] text-white transition-all hover:-translate-y-0.5 hover:brightness-105 shadow-[var(--sh-sm)]"
        >
          <EyeSVG />
          Voir cette information
        </button>
      </div>
    </div>
  );
};