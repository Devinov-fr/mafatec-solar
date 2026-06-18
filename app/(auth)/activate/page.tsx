'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle, ArrowLeft } from 'lucide-react';

function ActivateForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userPrenom, setUserPrenom] = useState('');
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!token || !emailParam) {
      setError('Token ou email manquant');
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/activation/${token}`);
        const data = await res.json();
        if (!data.success) {
          setError(data.error || 'Lien invalide ou expiré');
        } else {
          // If API doesn't return prenom yet, we'll just use a generic welcome
          setUserPrenom(data.prenom || '');
        }
      } catch (err) {
        setError('Erreur lors de la validation du lien');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, emailParam]);

  useEffect(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setStrength(s);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/activation/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        toast.success('Compte activé avec succès !');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error(data.error || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>
      </div>
    );
  }

  return (
    <div className="auth-card w-full max-w-[430px] bg-white border border-[#e8e8ea] rounded-[26px] p-[2.8rem_2.6rem] shadow-[0_40px_90px_rgba(11,14,29,0.22)]">
      <div className="ac-head mb-[1.8rem]">
        <h1 className="font-serif font-semibold text-[1.7rem] tracking-[-0.01em] text-[#15172b] mb-[0.5rem]">
          {success ? 'Compte activé !' : error ? 'Lien invalide' : 'Activez votre compte'}
        </h1>
        <p className="text-[0.86rem] text-[#454a63] font-sans leading-[1.55]">
          {success 
            ? 'Votre compte est activé. Redirection vers la connexion...' 
            : error 
              ? 'Impossible de vérifier ce lien d\'activation.' 
              : `Bonjour ${userPrenom ? <strong>{userPrenom}</strong> : ''}, créez votre mot de passe pour activer votre espace.`
          }
        </p>
      </div>

      {error && (
        <div className="auth-msg show err flex items-start gap-[0.6rem] p-[0.85rem_1rem] rounded-[8px] text-[0.82rem] leading-[1.5] mb-[1.2rem] bg-[rgba(201,59,24,0.08)] border border-[rgba(201,59,24,0.26)] text-[#a82e12]">
          <AlertCircle className="w-[17px] h-[17px] shrink-0 mt-[0.08rem]" />
          <span>{error === 'Token invalid or expired' ? "Ce lien d'activation a expiré (valable 3 jours). Relancez une étude avec la même adresse email pour recevoir un nouveau lien." : error}</span>
        </div>
      )}

      {success && (
        <div className="auth-msg show ok flex items-start gap-[0.6rem] p-[0.85rem_1rem] rounded-[8px] text-[0.82rem] leading-[1.5] mb-[1.2rem] bg-[rgba(31,138,91,0.08)] border border-[rgba(31,138,91,0.28)] text-[#1f7a52]">
          <Check className="w-[17px] h-[17px] shrink-0 mt-[0.08rem]" />
          <span>Votre compte est activé. Redirection vers votre espace…</span>
        </div>
      )}

      {!error && !success && (
        <form onSubmit={handleSubmit} className="space-y-[1.15rem]">
          <div className="afield flex flex-col gap-[0.45rem]">
            <label className="text-[0.74rem] font-semibold text-[#15172b]">Adresse email</label>
            <div className="inwrap relative flex items-center">
              <Mail className="absolute left-[0.95rem] w-[16px] h-[16px] text-[#7a7e95] pointer-events-none" strokeWidth={1.8} />
              <input 
                type="email" 
                value={emailParam || ''}
                readOnly
                className="w-full p-[0.85rem_1rem_0.85rem_2.65rem] border border-[#e8e8ea] rounded-[8px] bg-[#f5f5f7] text-[0.92rem] text-[#7a7e95] font-sans outline-none cursor-default"
              />
            </div>
          </div>

          <div className="afield flex flex-col gap-[0.45rem]">
            <label className="text-[0.74rem] font-semibold text-[#15172b]">
              Mot de passe <span className="text-[#c93b18] ml-[1px]">*</span>
            </label>
            <div className="inwrap relative flex items-center">
              <Lock className="absolute left-[0.95rem] w-[16px] h-[16px] text-[#7a7e95] pointer-events-none" strokeWidth={1.8} />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" 
                placeholder="Minimum 8 caractères" 
                required 
                className="w-full p-[0.85rem_1rem_0.85rem_2.65rem] border border-[#e8e8ea] rounded-[8px] bg-[#ffffff] text-[0.92rem] text-[#15172b] font-sans outline-none transition-all duration-300 focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)]"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="pw-toggle absolute right-[0.7rem] w-[30px] h-[30px] flex items-center justify-center rounded-[6px] text-[#7a7e95] hover:text-[#15172b] hover:bg-[#f5f5f7] transition-all duration-300"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {/* Password strength meter */}
            <div className="pw-meter flex gap-[0.3rem] mt-[0.5rem]">
              {[1, 2, 3, 4].map((i) => (
                <span 
                  key={i} 
                  className={`flex-1 h-[4px] rounded-[2px] transition-all duration-300 ${
                    i <= strength 
                      ? strength === 1 ? 'bg-[#c93b18]' 
                        : strength === 2 ? 'bg-[#a8884a]' 
                        : 'bg-[#1f8a5b]' 
                      : 'bg-[#e8e8ea]'
                  }`}
                ></span>
              ))}
            </div>
          </div>

          <div className="afield flex flex-col gap-[0.45rem]">
            <label className="text-[0.74rem] font-semibold text-[#15172b]">
              Confirmer le mot de passe <span className="text-[#c93b18] ml-[1px]">*</span>
            </label>
            <div className="inwrap relative flex items-center">
              <Lock className="absolute left-[0.95rem] w-[16px] h-[16px] text-[#7a7e95] pointer-events-none" strokeWidth={1.8} />
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password" 
                placeholder="Ressaisissez le mot de passe" 
                required 
                className="w-full p-[0.85rem_1rem_0.85rem_2.65rem] border border-[#e8e8ea] rounded-[8px] bg-[#ffffff] text-[0.92rem] text-[#15172b] font-sans outline-none transition-all duration-300 focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)]"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-auth w-full inline-flex items-center justify-center gap-[0.6rem] font-sans font-semibold text-[0.92rem] p-[1rem_1.5rem] rounded-[6px] bg-[#c93b18] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#e0552e] disabled:opacity-50 disabled:translate-y-0"
          >
            {isLoading ? 'Activation...' : 'Activer mon compte'}
            {!isLoading && <Check size={16} />}
          </button>
        </form>
      )}

      {(error || success) && (
        <div className="auth-foot mt-[1.5rem] text-center text-[0.8rem] text-[#454a63] font-sans">
          <button 
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-1.5 text-[#c93b18] font-semibold hover:underline"
          >
            <ArrowLeft size={14} /> Retour à la connexion
          </button>
        </div>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="auth-wrap min-h-screen flex bg-[#0b0e1d] font-sans selection:bg-[#c93b18] selection:text-white">
      {/* Aside Éditorial */}
      <aside className="auth-aside relative flex-[0_0_42%] max-w-[560px] overflow-hidden text-[#f3efe6] hidden md:flex flex-col p-[3.4rem_3.2rem] grain">
        <div className="auth-aside-bg absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_60%_at_18%_96%,rgba(42,46,114,0.6),transparent_62%),_radial-gradient(ellipse_60%_56%_at_92%_8%,rgba(201,59,24,0.18),transparent_60%)]"></div>
        <div className="auth-aside-in relative z-10 flex flex-col h-full">
          <img className="logo h-[30px] mb-auto self-start" src="/logo-mafatec-blanc.png" alt="MAFATEC" />
          <div className="mt-auto">
            <span className="aa-eyebrow flex items-center gap-[0.6rem] font-sans text-[0.66rem] font-semibold tracking-[0.28em] uppercase text-[#e3cfa3] mb-[1.6rem]">
              <span className="mark w-[26px] h-px bg-[#c9a96a]"></span>
              Activation de votre compte
            </span>
            <h2 className="font-serif font-medium text-[2.4rem] leading-[1.08] tracking-[-0.01em] text-[#f3efe6] mb-[1.2rem]">
              Plus qu'une étape pour <em className="not-italic italic text-[#e3cfa3]">activer</em> votre espace
            </h2>
            <p className="text-[0.95rem] leading-[1.7] text-[rgba(243,239,230,0.62)] max-w-[38ch]">
              Choisissez votre mot de passe pour finaliser la création de votre compte. Vous pourrez ensuite retrouver toutes vos études et lancer de nouvelles simulations à tout moment.
            </p>
            <div className="aa-feats mt-8 flex flex-col gap-[0.9rem]">
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Lock className="w-[17px] h-[17px] text-[#e3cfa3] shrink-0" />
                Lien sécurisé valable 3 jours
              </span>
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#e3cfa3] shrink-0" />
                Accès immédiat à vos études
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="auth-main flex-1 bg-[#f5f5f7] flex items-center justify-center p-[3rem_2rem]">
        <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18]"></div>}>
          <ActivateForm />
        </Suspense>
      </main>
    </div>
  );
}
