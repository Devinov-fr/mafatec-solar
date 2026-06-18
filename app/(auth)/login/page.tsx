'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { User, Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const roleParam = searchParams.get('role');
    if (emailParam) setEmail(emailParam);
    if (roleParam === 'admin') setRole('admin');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('No user found')) {
          toast.error('Aucun compte trouvé pour cette adresse. Lancez une étude pour créer votre compte.');
        } else if (result.error.includes('activate')) {
          toast.info("Votre compte n'est pas encore activé. Vérifiez l'email d'activation reçu lors de votre première étude.");
        } else {
          toast.error('Mot de passe incorrect ou erreur de connexion.');
        }
      } else {
        toast.success('Connexion réussie');
        router.push(role === 'admin' ? '/admin' : '/mon-espace');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

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
              Espace client & administration
            </span>
            <h2 className="font-serif font-medium text-[2.4rem] leading-[1.08] tracking-[-0.01em] text-[#f3efe6] mb-[1.2rem]">
              Retrouvez toutes vos <em className="not-italic italic text-[#e3cfa3]">études solaires</em> en un seul endroit
            </h2>
            <p className="text-[0.95rem] leading-[1.7] text-[rgba(243,239,230,0.62)] max-w-[38ch]">
              Consultez l'historique de vos simulations photovoltaïques, téléchargez vos rapports détaillés et lancez de nouvelles études en quelques clics.
            </p>
            <div className="aa-feats mt-8 flex flex-col gap-[0.9rem]">
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#e3cfa3] shrink-0" />
                Historique complet de vos études
              </span>
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#e3cfa3] shrink-0" />
                Rapports PDF téléchargeables à tout moment
              </span>
              <span className="flex items-center gap-[0.7rem] text-[0.86rem] text-[#f3efe6]">
                <Check className="w-[17px] h-[17px] text-[#e3cfa3] shrink-0" />
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
              {role === 'admin' ? 'Espace administration' : 'Connexion à votre espace'}
            </h1>
            <p className="text-[0.86rem] text-[#454a63] font-sans leading-[1.55]">
              {role === 'admin' ? 'Accédez à la supervision de toutes les études.' : 'Accédez à votre tableau de bord pour suivre vos études.'}
            </p>
          </div>

          <div className="auth-seg flex gap-[0.4rem] p-[0.32rem] bg-[#f5f5f7] border border-[#e8e8ea] rounded-[10px] mb-[1.8rem]">
            <button 
              type="button" 
              onClick={() => setRole('user')}
              className={`flex-1 inline-flex items-center justify-center gap-[0.45rem] p-[0.7rem_1rem] rounded-[7px] font-sans font-semibold text-[0.8rem] transition-all duration-300 ${role === 'user' ? 'bg-[#0b0e1d] text-white' : 'text-[#454a63] hover:text-[#0b0e1d]'}`}
            >
              <User size={15} />
              Client
            </button>
            <button 
              type="button" 
              onClick={() => setRole('admin')}
              className={`flex-1 inline-flex items-center justify-center gap-[0.45rem] p-[0.7rem_1rem] rounded-[7px] font-sans font-semibold text-[0.8rem] transition-all duration-300 ${role === 'admin' ? 'bg-[#0b0e1d] text-white' : 'text-[#454a63] hover:text-[#0b0e1d]'}`}
            >
              <Shield size={15} />
              Administration
            </button>
          </div>

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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-auth w-full inline-flex items-center justify-center gap-[0.6rem] font-sans font-semibold text-[0.92rem] p-[1rem_1.5rem] rounded-[6px] bg-[#c93b18] text-white transition-all duration-[0.35s] ease-lux hover:-translate-y-[2px] hover:bg-[#e0552e] disabled:opacity-50 disabled:translate-y-0"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          {role === 'user' ? (
            <div className="auth-foot mt-[1.5rem] text-center text-[0.8rem] text-[#454a63] font-sans">
              Pas encore de compte&thinsp;? <a href="/" className="text-[#c93b18] font-semibold hover:underline">Lancez une étude gratuite</a> pour le créer.
            </div>
          ) : (
            <div className="auth-demo mt-[1.5rem] p-[0.9rem_1rem] rounded-[8px] bg-[#f5f5f7] border border-dashed border-[#e8e8ea] text-[0.72rem] text-[#7a7e95] leading-[1.6] font-sans">
              <strong className="text-[#454a63] font-bold">Accès administration</strong><br />
              Email : admin@mafatec.com · Mot de passe : Admin2025
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
