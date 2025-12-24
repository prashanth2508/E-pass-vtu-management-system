
import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  ShieldCheck, 
  MapPin,
  CheckCircle2,
  XCircle,
  Hash,
  User as UserIcon,
  LogOut,
  LogIn,
  Zap,
  History,
  Navigation,
  ArrowRight,
  Download,
  Trash2,
  FileText
} from 'lucide-react';
import { TransitLog, TransitDirection } from '../types';

const SecurityFlow: React.FC = () => {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [lastLoggedTime, setLastLoggedTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [passLogs, setPassLogs] = useState<TransitLog[]>([]);
  const [sessionLogs, setSessionLogs] = useState<TransitLog[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadAllLogs();
    return () => clearInterval(timer);
  }, []);

  const loadAllLogs = () => {
    const allLogs: TransitLog[] = JSON.parse(localStorage.getItem('omnipass_transit_logs') || '[]');
    setSessionLogs(allLogs);
  };

  useEffect(() => {
    if (!scanResult) {
      const timer = setTimeout(() => {
        initScanner();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
          scannerRef.current = null;
        }
      };
    }
  }, [scanResult]);

  const initScanner = () => {
    const element = document.getElementById('security-reader');
    if (element && !scannerRef.current) {
      try {
        scannerRef.current = new Html5QrcodeScanner('security-reader', { fps: 10, qrbox: 250 }, false);
        scannerRef.current.render(
          (data) => {
            try {
              const parsed = JSON.parse(data);
              setScanResult(parsed);
              
              // Load history for this specific pass
              const allLogs: TransitLog[] = JSON.parse(localStorage.getItem('omnipass_transit_logs') || '[]');
              const relevantLogs = allLogs.filter(l => l.passId === parsed.id);
              setPassLogs(relevantLogs);
              
              if (parsed.expectedInTime) {
                const expDate = new Date(parsed.expectedInTime);
                const isLate = new Date() > expDate;
                setIsValid(!isLate);
              } else {
                setIsValid(true);
              }
              
              if (navigator.vibrate) navigator.vibrate(200);
              
              if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Error clearing scanner", e));
                scannerRef.current = null;
              }
            } catch (e) {
              console.error("Invalid Pass QR Format", e);
            }
          },
          () => {}
        );
      } catch (err) {
        console.error("Scanner initialization failed", err);
      }
    }
  };

  const handleLogTransit = async () => {
    if (!scanResult) return;
    setIsLogging(true);
    
    const alreadyExited = passLogs.some(l => l.direction === 'EXIT');
    const direction: TransitDirection = alreadyExited ? 'ENTRY' : 'EXIT';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastLoggedTime(timeStr);
    
    const newLog: TransitLog = {
      id: 'LOG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      studentId: scanResult.studentId || 'N/A',
      studentName: scanResult.studentName,
      usn: scanResult.usn,
      passId: scanResult.id,
      passType: scanResult.passType || 'GATE',
      hostel: scanResult.hostel,
      direction: direction,
      timestamp: now.toISOString(),
      securityOfficer: 'Officer John'
    };

    // Store in Website (LocalStorage)
    const existingLogs = JSON.parse(localStorage.getItem('omnipass_transit_logs') || '[]');
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem('omnipass_transit_logs', JSON.stringify(updatedLogs));
    setSessionLogs(updatedLogs);

    setTimeout(() => {
      setIsLogging(false);
      setLogSuccess(true);
      setTimeout(() => reset(), 2500);
    }, 800);
  };

  const exportToCSV = () => {
    if (sessionLogs.length === 0) return alert("No logs available to export.");
    
    const headers = ['Transit ID', 'Student Name', 'USN', 'Pass ID', 'Direction', 'Hostel', 'Timestamp'];
    const rows = sessionLogs.map(log => [
      log.id,
      `"${log.studentName}"`,
      log.usn,
      log.passId,
      log.direction,
      log.hostel,
      new Date(log.timestamp).toLocaleString()
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Gate_Transit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLogs = () => {
    if (window.confirm("Are you sure you want to clear all stored transit logs from this device?")) {
      localStorage.removeItem('omnipass_transit_logs');
      setSessionLogs([]);
    }
  };

  const reset = () => {
    setScanResult(null);
    setIsValid(null);
    setLogSuccess(false);
    setLastLoggedTime(null);
    setPassLogs([]);
  };

  const actualExit = passLogs.find(l => l.direction === 'EXIT');
  const actualEntry = passLogs.find(l => l.direction === 'ENTRY');

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter italic text-cyan-400">Sentinel Terminal</h1>
          <p className="text-gray-400">Gate security verification and local transit storage</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <ShieldCheck className="w-3 h-3 text-cyan-500" /> Secure Local Storage
          </div>
          <div className="text-[14px] font-mono text-cyan-400/80 bg-cyan-400/5 px-4 py-1 rounded-full border border-cyan-400/10">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Scanner & Profile Section */}
        <div className="space-y-6">
          {!scanResult ? (
            <div className="flex flex-col items-center">
              <div className="w-full relative glass rounded-[3rem] overflow-hidden border-white/10 aspect-square mb-8">
                <div id="security-reader" className="w-full h-full"></div>
                <div className="scan-line"></div>
              </div>
              <div className="flex items-center gap-6 p-8 glass rounded-[2.5rem] border-white/5 w-full">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 animate-pulse">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">Scanner Ready</h3>
                  <p className="text-gray-500 text-sm italic">Scan student QR to log transit...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`animate-in zoom-in-95 duration-300 p-8 glass rounded-[3rem] border-2 transition-all shadow-2xl relative overflow-hidden ${
              isValid ? 'border-green-500/30' : 'border-red-500/30'
            }`}>
              {/* Overlay Success State */}
              {logSuccess && (
                <div className="absolute inset-0 bg-gray-950/98 z-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
                   <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(34,197,94,0.4)]">
                      <CheckCircle2 className="w-12 h-12 text-gray-950" />
                   </div>
                   <h3 className="text-4xl font-black uppercase italic text-white mb-2 tracking-tighter">TRANSIT LOGGED</h3>
                   <p className="text-cyan-400 font-mono text-2xl font-black mb-2">{lastLoggedTime}</p>
                   <p className="text-gray-600 text-xs font-bold uppercase tracking-[0.3em] italic">Record saved to browser storage</p>
                </div>
              )}

              <div className="mb-8">
                 <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-8">Security Clearance</div>
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 relative overflow-hidden">
                       {scanResult.photo ? (
                         <img src={scanResult.photo} className="w-full h-full object-cover" alt="Student Profile" />
                       ) : (
                         <UserIcon className="w-10 h-10 text-gray-700" />
                       )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-1 leading-tight uppercase italic">{scanResult.studentName}</h2>
                      <p className="text-xs font-mono text-cyan-500/70">{scanResult.usn}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{scanResult.hostel}</p>
                    </div>
                 </div>
              </div>

              <div className="mb-8 p-6 glass border border-white/5 rounded-3xl bg-white/[0.02]">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Out Log</span>
                    <div className={`text-xl font-mono font-black ${actualExit ? 'text-white' : 'text-white/10'}`}>
                      {actualExit ? new Date(actualExit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">In Log</span>
                    <div className={`text-xl font-mono font-black ${actualEntry ? 'text-white' : 'text-white/10'}`}>
                      {actualEntry ? new Date(actualEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {actualEntry ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-black italic text-green-500 uppercase">Cycle Complete: Student Returned</p>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogTransit}
                    disabled={isLogging}
                    className={`w-full py-6 rounded-3xl font-black text-xl uppercase tracking-tighter italic transition-all flex items-center justify-center gap-4 active:scale-95 border-2 ${
                      actualExit 
                        ? 'bg-green-500 text-gray-950 hover:bg-green-400 border-green-400' 
                        : 'bg-red-500 text-white hover:bg-red-400 border-red-400'
                    }`}
                  >
                    {isLogging ? <div className="w-6 h-6 border-4 border-gray-950/30 border-t-gray-950 rounded-full animate-spin"></div> : (
                      <>
                        {actualExit ? <LogIn className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
                        {actualExit ? 'LOG ENTRY' : 'LOG EXIT'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={reset} 
                  className="w-full py-3 text-[10px] font-black text-gray-700 hover:text-white transition-all uppercase tracking-[0.4em]"
                >
                   Discard and Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Local History & Export Section */}
        <div className="space-y-6">
          <div className="glass rounded-[3rem] p-8 border-white/5 flex flex-col h-[600px] overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Live Session Logs</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={clearLogs}
                  className="p-2 hover:bg-red-500/10 text-gray-600 hover:text-red-500 rounded-lg transition-colors"
                  title="Clear All Logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportToCSV}
                  className="bg-cyan-500 text-gray-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {sessionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50">
                  <FileText className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No records yet</p>
                </div>
              ) : (
                sessionLogs.map((log, idx) => (
                  <div 
                    key={log.id} 
                    className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all animate-in slide-in-from-right-4 duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        log.direction === 'ENTRY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {log.direction === 'ENTRY' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs uppercase italic">{log.studentName}</div>
                        <div className="text-[9px] font-mono text-gray-500">{log.usn} • {log.hostel}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-white/80">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{log.direction}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{sessionLogs.length} Total Records</span>
              <span className="text-[9px] font-black text-cyan-500/50 italic">Sentinel v2.5 Stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityFlow;
