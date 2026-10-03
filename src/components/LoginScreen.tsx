import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Compass,
  Gauge,
  Cpu,
  Layers
} from 'lucide-react';
import {
  AuthSession,
  signInWithPassword,
  signUpWithPassword,
  sendMagicLink,
  createGuestSession
} from '../utils/supabaseAuth';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your driver / pit crew email.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'magiclink') {
        const res = await sendMagicLink(email);
        if (!res.success) {
          throw new Error(res.error || 'Failed to send magic link');
        }
        setSuccessMessage('🏎️ Magic access link dispatched! Check your email inbox.');
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        if (!password || password.length < 6) {
          throw new Error('Password must contain at least 6 characters.');
        }

        const res = await signUpWithPassword(email, password);
        if (res.error) {
          throw new Error(res.error);
        }

        if (res.session) {
          onLoginSuccess(res.session);
          return;
        }

        if (res.requiresConfirmation) {
          setSuccessMessage('🏁 Account created! Please confirm your email, or enter via Paddock Demo.');
          setIsLoading(false);
          return;
        }
      }

      // Default: Sign In with Password
      if (!password) {
        throw new Error('Please enter your security access password.');
      }

      const res = await signInWithPassword(email, password);
      if (res.error) {
        throw new Error(res.error);
      }

      if (res.session) {
        onLoginSuccess(res.session);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Access Denied. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestBypass = () => {
    const session = createGuestSession(email.split('@')[0] || 'Sigma Driver');
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* High-Octane Background Grid & Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Emblem & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-black p-0.5 shadow-2xl shadow-red-600/40 ring-2 ring-red-500/50 transform hover:scale-105 transition duration-300">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <span className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-red-200 to-red-500">
                  F1
                </span>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-mono font-bold tracking-wider text-white shadow-md">
              BD
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>FORMULA 1 BD</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/80 font-mono font-bold uppercase tracking-widest">
                Paddock Club
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              High-Definition Creator Studio • Supabase Vault • Meta Graph API
            </p>
          </div>

          {/* Sigma Telemetry Telemetry Bar */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Supabase Auth Live
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3 h-3 text-red-400" />
              256-Bit Vault
            </span>
            <span>•</span>
            <span className="text-pink-400">@formula1.bd</span>
          </div>
        </div>

        {/* Auth Glass Card */}
        <div className="p-7 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/80 space-y-6 relative group">
          {/* Subtle Red Edge Highlight */}
          <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-950/90 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                mode === 'signin'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                mode === 'signup'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setMode('magiclink'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                mode === 'magiclink'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Driver Email</span>
                <span className="text-[10px] text-slate-500 font-mono lowercase">verified identity</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@formula1.bd"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200 font-mono"
                />
              </div>
            </div>

            {mode !== 'magiclink' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Security Password</span>
                  <span className="text-[10px] text-slate-500 font-mono">min 6 chars</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition duration-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition duration-200 transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Gauge className="w-4 h-4 animate-spin" />
                  <span>Verifying Telemetry...</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <span>Enter Paddock Club</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Initialize Driver Account</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Dispatch Magic Link</span>
                </>
              )}
            </button>
          </form>

          {/* Paddock Club Demo Fast-Track Bypass */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleGuestBypass}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition duration-200 group/demo"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 group-hover/demo:animate-bounce" />
              <span>Enter as Paddock Guest Driver (One-Click Demo)</span>
            </button>
          </div>
        </div>

        {/* Bottom Badges & Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 font-mono">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-600" />
            Supabase Project: bnhbebhffosechglrlhf
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Formula 1 BD Engine v2.4
          </span>
        </div>
      </div>
    </div>
  );
};
