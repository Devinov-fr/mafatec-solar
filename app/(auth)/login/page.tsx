'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // If already authenticated, redirect based on role
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      if (userRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/mon-espace');
      }
    }
  }, [status, session, router]);

  const handleLogoClick = () => {
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!email || !password) {
      const errorMsg = 'Veuillez remplir tous les champs';
      setLoginError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('SignIn result:', result);

      // Check if there's an error
      if (result?.error) {
        let errorMsg = '';
        
        // The error from NextAuth is typically "CredentialsSignin"
        // We need to handle this and display a user-friendly message
        if (result.error === 'CredentialsSignin') {
          // Since we can't get the specific error from the backend,
          // we'll try to fetch the user to determine if they exist
          try {
            // Try to check if user exists by attempting to get their profile
            const checkUserRes = await fetch('/api/auth/check-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            
            const userData = await checkUserRes.json();
            
            if (userData.exists === false) {
              errorMsg = 'Aucun compte trouvé pour cette adresse email. Lancez une étude pour créer votre compte.';
            } else if (userData.activated === false) {
              errorMsg = "Votre compte n'est pas encore activé. Vérifiez l'email d'activation reçu lors de votre première étude.";
            } else {
              errorMsg = 'Mot de passe incorrect. Veuillez réessayer.';
            }
          } catch (checkError) {
            // Fallback error message if we can't check the user status
            errorMsg = 'Erreur de connexion. Veuillez vérifier vos identifiants.';
          }
        } else {
          // Handle other types of errors
          const errorLower = result.error.toLowerCase();
          if (errorLower.includes('user') || errorLower.includes('found') || errorLower.includes('exist')) {
            errorMsg = 'Aucun compte trouvé pour cette adresse email. Lancez une étude pour créer votre compte.';
          } else if (errorLower.includes('activate') || errorLower.includes('active')) {
            errorMsg = "Votre compte n'est pas encore activé. Vérifiez l'email d'activation reçu lors de votre première étude.";
          } else if (errorLower.includes('password') || errorLower.includes('incorrect')) {
            errorMsg = 'Mot de passe incorrect. Veuillez réessayer.';
          } else {
            errorMsg = 'Erreur de connexion. Veuillez vérifier vos identifiants.';
          }
        }
        
        setLoginError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      // If no error, login was successful
      toast.success('Connexion réussie');
      
      // Wait a moment for session to be established
      setTimeout(async () => {
        try {
          // Fetch user profile to check role
          const res = await fetch('/api/me/profile');
          const data = await res.json();
          
          if (data.success && data.user) {
            // Redirect based on role
            if (data.user.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/mon-espace');
            }
          } else {
            // Fallback: redirect to mon-espace if we can't fetch profile
            router.push('/mon-espace');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          router.push('/mon-espace');
        }
      }, 500);
    } catch (error) {
      console.error('Login submission error:', error);
      const errorMsg = 'Une erreur est survenue lors de la connexion. Veuillez réessayer.';
      setLoginError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!email) {
      const errorMsg = 'Veuillez saisir votre adresse email';
      setLoginError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsResetLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Un email de réinitialisation vous a été envoyé.');
        setShowResetForm(false);
        setLoginError(null);
      } else {
        const errorMsg = data.error || 'Une erreur est survenue';
        setLoginError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Une erreur est survenue';
      setLoginError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="auth-wrap min-h-screen flex bg-[#0b0e1d] font-sans selection:bg-[#c93b18] selection:text-white">
      {/* Aside Éditorial */}
      <aside className="auth-aside relative flex-[0_0_42%] max-w-[560px] overflow-hidden text-[#f3efe6] hidden md:flex flex-col p-[3.4rem_3.2rem] grain">
        <div className="auth-aside-bg absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_60%_at_18%_96%,rgba(42,46,114,0.6),transparent_62%),_radial-gradient(ellipse_60%_56%_at_92%_8%,rgba(201,59,24,0.18),transparent_60%)]"></div>
        <div className="auth-aside-in relative z-10 flex flex-col h-full">
          <button 
            onClick={handleLogoClick}
            className="self-start cursor-pointer hover:opacity-80 transition-opacity duration-300"
            aria-label="Retour à l'accueil"
          >
            <img className="logo h-[30px]" src="/logo-mafatec-blanc.png" alt="MAFATEC" />
          </button>
          <div className="mt-auto">
            <span className="aa-eyebrow flex items-center gap-[0.6rem] font-sans text-[0.66rem] font-semibold tracking-[0.28em] uppercase text-[#A82E12] mb-[1.6rem]">
              <span className="mark w-[26px] h-px bg-[#A82E12]"></span>
              Espace client
            </span>
            <h2 className="font-serif font-medium text-[2.4rem] leading-[1.08] tracking-[-0.01em] text-[#f3efe6] mb-[1.2rem]">
              Retrouvez toutes vos <em className="not-italic italic text-[#A82E12]">études solaires</em> en un seul endroit
            </h2>
            <p className="text-[0.95rem] leading-[1.7] text-[rgba(243,239,230,0.62)] max-w-[38ch]">
              Consultez l'historique de vos simulations photovoltaïques, téléchargez vos rapports détaillés et lancez de nouvelles études en quelques clics.
            </p>
            <div className="aa-feats mt-8 flex flex-col gap-[0.9rem]">
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#A82E12] shrink-0" />
                Historique complet de vos études
              </span>
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#A82E12] shrink-0" />
                Rapports PDF téléchargeables à tout moment
              </span>
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#A82E12] shrink-0" />
                Vos données protégées & jamais cédées
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="auth-main flex-1 bg-[#f5f5f7] flex items-center justify-center p-[3rem_2rem]">
        <div className="auth-card w-full max-w-[430px] bg-white border border-[#e8e8ea] rounded-[26px] p-[2.8rem_2.6rem] shadow-[0_40px_90px_rgba(11,14,29,0.22)]">
          <div className="ac-head mb-[1.8rem]">
            <h1 className="font-serif font-semibold text-[1.7rem] tracking-[-0.01em] text-[#15172b] mb-[0.5rem]">
              {showResetForm ? 'Réinitialiser le mot de passe' : 'Connexion à votre espace'}
            </h1>
            <p className="text-[0.86rem] text-[#454a63] font-sans leading-[1.55]">
              {showResetForm 
                ? 'Saisissez votre adresse email pour recevoir un lien de réinitialisation.'
                : 'Accédez à votre tableau de bord pour suivre vos études.'
              }
            </p>
          </div>

          {/* Display error message in the UI */}
          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              
              <p>{loginError}</p>
            </div>
          )}

          {showResetForm ? (
            <form onSubmit={handleResetPassword} className="space-y-[1.15rem]">
              <div className="afield flex flex-col gap-[0.45rem]">
                <label className="text-[0.74rem] font-semibold text-[#15172b]">
                  Adresse email <span className="text-[#c93b18] ml-[1px]">*</span>
                </label>
                <div className="inwrap relative flex items-center">
                  <Mail className="absolute left-[0.95rem] w-[16px] h-[16px] text-[#7a7e95] pointer-events-none" strokeWidth={1.8} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email" 
                    placeholder="vous@exemple.fr" 
                    required 
                    className="w-full p-[0.85rem_1rem_0.85rem_2.65rem] border border-[#e8e8ea] rounded-[8px] bg-[#ffffff] text-[0.92rem] text-[#15172b] font-sans outline-none transition-all duration-300 focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)]"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isResetLoading}
                className="btn-auth w-full inline-flex items-center justify-center gap-[0.6rem] font-sans font-semibold text-[0.92rem] p-[1rem_1.5rem] rounded-[6px] bg-[#c93b18] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#e0552e] disabled:opacity-50 disabled:translate-y-0"
              >
                {isResetLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                {!isResetLoading && <ArrowRight size={16} />}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setLoginError(null);
                }}
                className="w-full text-[0.8rem] text-[#454a63] hover:text-[#c93b18] transition-colors"
              >
                ← Retour à la connexion
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-[1.15rem]">
                <div className="afield flex flex-col gap-[0.45rem]">
                  <label className="text-[0.74rem] font-semibold text-[#15172b]">
                    Adresse email <span className="text-[#c93b18] ml-[1px]">*</span>
                  </label>
                  <div className="inwrap relative flex items-center">
                    <Mail className="absolute left-[0.95rem] w-[16px] h-[16px] text-[#7a7e95] pointer-events-none" strokeWidth={1.8} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setLoginError(null);
                      }}
                      autoComplete="email" 
                      placeholder="vous@exemple.fr" 
                      required 
                      className="w-full p-[0.85rem_1rem_0.85rem_2.65rem] border border-[#e8e8ea] rounded-[8px] bg-[#ffffff] text-[0.92rem] text-[#15172b] font-sans outline-none transition-all duration-300 focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)]"
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError(null);
                      }}
                      autoComplete="current-password" 
                      placeholder="••••••••" 
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
                </div>
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowResetForm(true);
                      setLoginError(null);
                    }}
                    className="text-[0.75rem] text-[#7a7e95] hover:text-[#c93b18] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-auth w-full inline-flex items-center justify-center gap-[0.6rem] font-sans font-semibold text-[0.92rem] p-[1rem_1.5rem] rounded-[6px] bg-[#c93b18] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#e0552e] disabled:opacity-50 disabled:translate-y-0"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="auth-foot mt-[1.5rem] text-center text-[0.8rem] text-[#454a63] font-sans">
                Pas encore de compte&thinsp;? <a href="/" className="text-[#c93b18] font-semibold hover:underline">Lancez une étude gratuite</a> pour le créer.
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}