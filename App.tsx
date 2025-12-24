
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  QrCode, 
  ShieldCheck, 
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import LandingPage from './pages/LandingPage';
import StudentFlow from './pages/StudentFlow';
import WardenFlow from './pages/WardenFlow';
import SecurityFlow from './pages/SecurityFlow';
import CommandCenter from './pages/CommandCenter';
import LoginPage from './pages/LoginPage';
import { User, GatePassRequest, RequestStatus } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const savedUser = localStorage.getItem('omnipass_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Initialize notifiedIds with existing approved/rejected requests to avoid spamming on reload
    const stored = localStorage.getItem('omnipass_requests');
    if (stored) {
      const requests: GatePassRequest[] = JSON.parse(stored);
      requests.forEach(req => {
        if (req.status !== RequestStatus.PENDING) {
          notifiedIds.current.add(`${req.id}-${req.status}`);
        }
      });
    }
  }, []);

  // Notification Monitor Logic
  useEffect(() => {
    const checkRequests = () => {
      const stored = localStorage.getItem('omnipass_requests');
      if (!stored) return;

      const requests: GatePassRequest[] = JSON.parse(stored);
      
      requests.forEach(req => {
        const notifyKey = `${req.id}-${req.status}`;
        
        // If status is final (Approved/Rejected) and we haven't notified for THIS specific status yet
        if (req.status !== RequestStatus.PENDING && !notifiedIds.current.has(notifyKey)) {
          
          if (req.status === RequestStatus.APPROVED) {
            setNotification({
              message: `Your ${req.passType} Pass (${req.id}) has been APPROVED!`,
              type: 'success'
            });
          } else if (req.status === RequestStatus.REJECTED) {
            setNotification({
              message: `Your ${req.passType} Pass (${req.id}) was REJECTED.`,
              type: 'error'
            });
          }
          
          notifiedIds.current.add(notifyKey);
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setNotification(prev => prev?.message.includes(req.id) ? null : prev);
          }, 5000);
        }
      });
    };

    const interval = setInterval(checkRequests, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('omnipass_user');
    setUser(null);
    window.location.hash = '#/';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-gray-100 selection:bg-cyan-500/30">
        
        {/* Notification Banner */}
        {notification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-top-4 duration-300">
            <div className={`glass p-4 rounded-2xl border flex items-center gap-4 shadow-2xl ${
              notification.type === 'success' ? 'border-green-500/30 bg-green-500/5' : 
              notification.type === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-cyan-500/30 bg-cyan-500/5'
            }`}>
              <div className={`p-2 rounded-xl ${
                notification.type === 'success' ? 'bg-green-500/20 text-green-500' : 
                notification.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 size={20} /> : 
                 notification.type === 'error' ? <XCircle size={20} /> : <Bell size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">System Update</p>
                <p className="text-sm font-bold">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        {user && (
          <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 py-3 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-cyan-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                <ShieldCheck className="w-5 h-5 text-gray-950" />
              </div>
              <span className="font-bold tracking-tight text-xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                OmniPass
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                {user.role === 'WARDEN' && <Link to="/warden" className="hover:text-cyan-400 transition-colors">Approvals</Link>}
                {user.role === 'ADMIN' && <Link to="/admin" className="hover:text-cyan-400 transition-colors">Terminal</Link>}
                <Link to="/security" className="hover:text-cyan-400 transition-colors">Gate Scan</Link>
              </div>
              <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
                <span className="text-sm font-medium">{user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </nav>
        )}

        <main className={`${user ? 'pt-20' : ''} pb-10 px-4 max-w-7xl mx-auto`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/student" element={<StudentFlow />} />
            <Route path="/warden" element={user?.role === 'WARDEN' ? <WardenFlow user={user} /> : <Navigate to="/login/warden" />} />
            <Route path="/security" element={<SecurityFlow />} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <CommandCenter /> : <Navigate to="/login/admin" />} />
            <Route path="/login/:role" element={<LoginPage setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Floating Action Button (Mobile Only) */}
        {!user && window.location.hash === '#/' && (
          <div className="fixed bottom-10 left-0 right-0 flex justify-center z-40 px-4 md:hidden">
            <Link 
              to="/student"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all active:scale-95"
            >
              <QrCode className="w-6 h-6" />
              SCAN IDENTITY QR
            </Link>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
