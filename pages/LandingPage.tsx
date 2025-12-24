
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  Users
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="py-12 md:py-24 flex flex-col items-center text-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-cyan-400 text-sm font-semibold mb-8 animate-pulse">
        <Zap className="w-4 h-4" />
        V2.0 SMART CAMPUS ENGINE LIVE
      </div>

      <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter">
        SECURE. <span className="text-cyan-400 neon-text italic">FLUID.</span><br />INTELLIGENT.
      </h1>
      
      <p className="max-w-2xl text-gray-400 text-lg md:text-xl mb-12 leading-relaxed">
        The next generation of hostel security. No forms, no friction. 
        Just scan, verify, and move.
      </p>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-24">
        <Link to="/student" className="group">
          <div className="h-full glass p-8 rounded-[2rem] border-white/10 hover:border-cyan-500/50 hover:bg-white/5 transition-all text-left relative overflow-hidden">
            <div className="bg-cyan-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <QrCode className="text-gray-950" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Student Portal</h3>
            <p className="text-gray-400 text-sm mb-6">Scan Identity QR to unlock your profile and request passes.</p>
            <div className="flex items-center text-cyan-400 font-bold group-hover:gap-3 transition-all gap-2">
              Launch Scanner <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link to="/login/warden" className="group">
          <div className="h-full glass p-8 rounded-[2rem] border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition-all text-left relative overflow-hidden">
            <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-gray-950" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Warden Hub</h3>
            <p className="text-gray-400 text-sm mb-6">Real-time approval dashboard for hostel managers.</p>
            <div className="flex items-center text-purple-400 font-bold group-hover:gap-3 transition-all gap-2">
              Secure Login <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        <Link to="/security" className="group">
          <div className="h-full glass p-8 rounded-[2rem] border-white/10 hover:border-green-500/50 hover:bg-white/5 transition-all text-left relative overflow-hidden">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="text-gray-950" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Security Desk</h3>
            <p className="text-gray-400 text-sm mb-6">Verify gate passes and monitor campus exits.</p>
            <div className="flex items-center text-green-400 font-bold group-hover:gap-3 transition-all gap-2">
              Access Terminal <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Stats/Features Banner */}
      <div className="w-full glass rounded-[3rem] p-12 border-white/5 flex flex-wrap justify-around gap-8 text-left">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-white/5">
            <Clock className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">5s Flow</div>
            <div className="text-gray-500 text-xs">Request-to-Approval</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-white/5">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">2.4k+</div>
            <div className="text-gray-500 text-xs">Active Student IDs</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-white/5">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">100%</div>
            <div className="text-gray-500 text-xs">QR Encryption</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
