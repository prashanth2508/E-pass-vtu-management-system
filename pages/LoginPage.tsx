
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginPageProps {
  setUser: (user: UserType) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setUser }) => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simulate auth with specific credentials for Warden
    setTimeout(() => {
      let isAuthorized = false;
      let userData: UserType | null = null;

      if (role === 'warden') {
        if (identifier === 'Chiefwarden' && password === 'vtu@chiefwarden123') {
          isAuthorized = true;
          userData = {
            id: 'WARDEN-001',
            name: 'Chief Warden',
            role: 'WARDEN',
            hostelId: 'Main Administration'
          };
        } else {
          setError('Invalid Warden Credentials. Access Denied.');
          setLoading(false);
          return;
        }
      } else {
        // Simple bypass for other roles if they still exist in the system
        isAuthorized = true;
        userData = {
          id: 'USR' + Math.floor(Math.random() * 1000),
          name: role === 'admin' ? 'System Administrator' : 'Staff Member',
          role: role?.toUpperCase() as any,
          hostelId: undefined
        };
      }

      if (isAuthorized && userData) {
        setUser(userData);
        localStorage.setItem('omnipass_user', JSON.stringify(userData));
        setLoading(false);
        navigate(`/${role}`);
      }
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500 rounded-3xl mb-8 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          <ShieldCheck className="w-10 h-10 text-gray-950" />
        </div>
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">{role} Portal</h1>
        <p className="text-gray-400">Secure OmniPass Access Control</p>
      </div>

      <div className="glass p-8 md:p-12 rounded-[3rem] border-white/10 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 animate-in shake duration-500">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block tracking-widest">Identifier / ID</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-medium text-white"
                placeholder={role === 'warden' ? 'warden id' : `Your ${role} ID`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block tracking-widest">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all font-medium text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-4 group shadow-[0_10px_20px_rgba(34,211,238,0.2)]"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-gray-400 border-t-gray-950 rounded-full animate-spin"></div>
            ) : (
              <>
                AUTHENTICATE
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] italic">
            Session activity is encrypted and monitored.
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/')}
        className="w-full text-center mt-12 text-gray-500 font-bold hover:text-white transition-colors text-xs tracking-widest uppercase"
      >
        CANCEL AND RETURN
      </button>
    </div>
  );
};

export default LoginPage;
