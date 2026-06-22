'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ArrowRight, Check, AlertCircle, X } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  const doPasswordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setTokenError('Token de réinitialisation manquant');
      toast.error('Token de réinitialisation manquant');
      return;
    }

    const verifyToken = async () => {
      try {
        const url = `/api/verify-reset-token?token=${encodeURIComponent(token)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.email) {
          setEmail(data.email);
        }

        setIsValidToken(data.valid);

        if (!data.valid) {
          const errorMsg = data.error || 'Ce lien de réinitialisation est invalide ou a expiré';
          setTokenError(errorMsg);
          toast.error(errorMsg);
        } else {
          toast.success('Lien valide ! Vous pouvez maintenant réinitialiser votre mot de passe.');
        }
      } catch (error) {
        setIsValidToken(false);
        setTokenError('Erreur lors de la vérification du token');
        toast.error('Erreur lors de la vérification du token');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isPasswordValid) {
      toast.error('Le mot de passe ne respecte pas les critères requis');
      return;
    }

    if (!doPasswordsMatch) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Votre mot de passe a été réinitialisé avec succès');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('❌ Error during password reset:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    let count = 0;
    if (hasMinLength) count++;
    if (hasUpperCase) count++;
    if (hasLowerCase) count++;
    if (hasNumber) count++;
    if (hasSpecialChar) count++;
    return count;
  };

  const strength = getPasswordStrength();

  // Loading state
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c93b18] mx-auto"></div>
          <p className="mt-4 text-[#454a63]">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-serif font-semibold text-[#15172b] mb-2">
            Lien invalide
          </h1>
          <p className="text-[#454a63] mb-6">
            {tokenError || 'Ce lien de réinitialisation est invalide ou a expiré.'}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-[#c93b18] text-white rounded-lg font-semibold hover:bg-[#e0552e] transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Valid token - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-semibold text-[#15172b] mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-[#454a63]">
            Créez un nouveau mot de passe pour votre compte
          </p>
          {email && (
            <p className="text-sm text-[#7a7e95] mt-2">
              Pour : <span className="font-medium text-[#15172b]">{email}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[0.74rem] font-semibold text-[#15172b] block mb-1">
              Nouveau mot de passe <span className="text-[#c93b18]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7e95]" strokeWidth={1.8} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTouched(true);
                }}
                placeholder="••••••••"
                required
                className="w-full p-3 pl-10 border border-[#e8e8ea] rounded-lg focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7e95] hover:text-[#15172b]"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Password requirements */}
            {touched && password.length > 0 && (
              <div className="mt-3 space-y-1.5 text-xs">
                <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-600' : 'text-[#7a7e95]'}`}>
                  {hasMinLength ? <Check size={14} /> : <X size={14} />}
                  <span>Minimum 8 caractères</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUpperCase ? 'text-green-600' : 'text-[#7a7e95]'}`}>
                  {hasUpperCase ? <Check size={14} /> : <X size={14} />}
                  <span>Au moins une majuscule</span>
                </div>
                <div className={`flex items-center gap-2 ${hasLowerCase ? 'text-green-600' : 'text-[#7a7e95]'}`}>
                  {hasLowerCase ? <Check size={14} /> : <X size={14} />}
                  <span>Au moins une minuscule</span>
                </div>
                <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-600' : 'text-[#7a7e95]'}`}>
                  {hasNumber ? <Check size={14} /> : <X size={14} />}
                  <span>Au moins un chiffre</span>
                </div>
                <div className={`flex items-center gap-2 ${hasSpecialChar ? 'text-green-600' : 'text-[#7a7e95]'}`}>
                  {hasSpecialChar ? <Check size={14} /> : <X size={14} />}
                  <span>Au moins un caractère spécial (@, #, $, etc.)</span>
                </div>
              </div>
            )}

            {/* Password strength meter */}
            <div className="pw-meter flex gap-[0.3rem] mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <span 
                  key={i} 
                  className={`flex-1 h-[4px] rounded-[2px] transition-all duration-300 ${
                    i <= strength 
                      ? strength <= 2 ? 'bg-[#c93b18]' 
                        : strength <= 3 ? 'bg-[#e8a838]' 
                        : 'bg-[#1f8a5b]'
                      : 'bg-[#e8e8ea]'
                  }`}
                ></span>
              ))}
            </div>
            {password.length > 0 && (
              <p className="text-[10px] text-[#7a7e95] mt-1">
                {strength <= 2 ? 'Mot de passe faible' : strength <= 3 ? 'Mot de passe moyen' : 'Mot de passe fort'}
              </p>
            )}
          </div>

          <div>
            <label className="text-[0.74rem] font-semibold text-[#15172b] block mb-1">
              Confirmer le mot de passe <span className="text-[#c93b18]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7e95]" strokeWidth={1.8} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full p-3 pl-10 border border-[#e8e8ea] rounded-lg focus:border-[#c93b18] focus:shadow-[0_0_0_3px_rgba(201,59,24,0.15)] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7e95] hover:text-[#15172b]"
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-xs mt-1 ${doPasswordsMatch ? 'text-green-600' : 'text-[#c93b18]'}`}>
                {doPasswordsMatch ? '✅ Les mots de passe correspondent' : '❌ Les mots de passe ne correspondent pas'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#c93b18] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#e0552e] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                En cours...
              </>
            ) : (
              <>
                Réinitialiser le mot de passe
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-[0.8rem] text-[#454a63] hover:text-[#c93b18] transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}