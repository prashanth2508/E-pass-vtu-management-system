mport React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Phone,
  Users,
  Building,
  Calendar,
  Info
} from 'lucide-react';
import { TransitLog, TransitDirection, GatePassRequest } from '../types';

const SecurityFlow: React.FC = () => {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [fullDetails, setFullDetails] = useState<GatePassRequest | null>(null);
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
              
              // CRITICAL: Fetch full record from system storage using the scan ID
              const allRequests: GatePassRequest[] = JSON.parse(localStorage.getItem('omnipass_requests') || '[]');
              const foundDetails = allRequests.find(r => r.id === parsed.id);
              
              if (foundDetails) {
                setFullDetails(foundDetails);
                
                // Load history for this specific pass
                const allLogs: TransitLog[] = JSON.parse(localStorage.getItem('omnipass_transit_logs') || '[]');
                const relevantLogs = allLogs.filter(l => l.passId === foundDetails.id);
                setPassLogs(relevantLogs);
                
                // Validate expiry
                const expDate = new Date(foundDetails.expectedInTime);
                const isLate = new Date() > expDate;
                setIsValid(!isLate);
              } else {
                setIsValid(false);
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
    if (!fullDetails) return;
    setIsLogging(true);
    
    const alreadyExited = passLogs.some(l => l.direction === 'EXIT');
    const direction: TransitDirection = alreadyExited ? 'ENTRY' : 'EXIT';

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastLoggedTime(timeStr);
    
    const newLog: TransitLog = {
      id: 'LOG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      studentId: fullDetails.studentId || 'N/A',
      studentName: fullDetails.studentName,
      usn: fullDetails.usn,
      passId: fullDetails.id,
      passType: fullDetails.passType || 'GATE',
      hostel: fullDetails.hostel,
      direction: direction,
      timestamp: now.toISOString(),
      securityOfficer: 'Officer John'
    };

    // Store in LocalStorage
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
    link.href = url;
    link.download = `Gate_Transit_Log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLogs = () => {
    if (window.confirm("Are you sure? This will delete all local records.")) {
      localStorage.removeItem('omnipass_transit_logs');
      setSessionLogs([]);
    }
  };

  const reset = () => {
    setScanResult(null);
    setFullDetails(null);
    setIsValid(null);
    setLogSuccess(false);
    setLastLoggedTime(null);
    setPassLogs([]);
  };

  const actualExit = passLogs.find(l => l.direction === 'EXIT');
  const actualEntry = passLogs.find(l => l.direction === 'ENTRY');

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter italic text-cyan-400">Sentinel terminal</h1>
          <p className="text-gray-400">Identity verification and movement logging protocol</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
              <div className="text-[14px] font-mono text-cyan-400 bg-cyan-400/5 px-4 py-1.5 rounded-full border border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Scanner & Identity Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {!fullDetails ? (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md relative glass rounded-[3rem] overflow-hidden border-white/10 aspect-square mb-8">
                <div id="security-reader" className="w-full h-full"></div>
                <div className="scan-line"></div>
              </div>
              <div className="flex items-center gap-6 p-10 glass rounded-[2.5rem] border-white/5 w-full max-w-md bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 animate-pulse border border-cyan-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Scanner Active</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Ready for student QR...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`animate-in zoom-in-95 duration-500 glass rounded-[3rem] border-2 transition-all shadow-2xl relative overflow-hidden flex flex-col ${
              isValid ? 'border-green-500/30' : 'border-red-500/30'
            }`}>
              {/* Overlay Success State */}
              {logSuccess && (
                <div className="absolute inset-0 bg-gray-950/98 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                   <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(34,197,94,0.4)]">
                      <CheckCircle2 className="w-12 h-12 text-gray-950" />
                   </div>
                   <h3 className="text-4xl font-black uppercase italic text-white mb-2 tracking-tighter">TRANSIT VERIFIED</h3>
                   <p className="text-cyan-400 font-mono text-2xl font-black mb-2">{lastLoggedTime}</p>
                   <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] italic">System Record Updated</p>
                </div>
              )}

              {/* Main Identity Dossier Header */}
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-10">
                  {/* Big Profile Photo */}
                  <div className="relative group">
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-2xl relative z-10">
                      {fullDetails.photo ? (
                        <img src={fullDetails.photo} className="w-full h-full object-cover" alt="Student Mugshot" />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                           <UserIcon className="w-16 h-16 text-gray-700" />
                        </div>
                      )}
                    </div>
                    {/* Holographic Seal */}
                    <div className={`absolute -bottom-4 -right-4 z-20 p-4 rounded-2xl shadow-xl border ${
                      isValid ? 'bg-green-500 text-gray-950 border-green-400' : 'bg-red-500 text-white border-red-400'
                    }`}>
                      {isValid ? <ShieldCheck size={24} /> : <XCircle size={24} />}
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isValid ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {isValid ? 'Clearance Active' : 'Late / Invalid'}
                        </span>
                        <span className="bg-cyan-500 text-gray-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {fullDetails.passType} Pass
                        </span>
                      </div>
                      <h2 className="text-5xl font-black text-white uppercase italic leading-none tracking-tighter">{fullDetails.studentName}</h2>
                      <p className="text-cyan-400 font-mono text-xl font-bold mt-2 uppercase flex items-center gap-2">
                        <Hash className="w-5 h-5" /> {fullDetails.usn}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Building size={10} /> Branch / Dept</div>
                        <div className="text-sm font-bold text-gray-200">{fullDetails.branch || 'Computer Science'}</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={10} /> Residence</div>
                        <div className="text-sm font-bold text-gray-200">{fullDetails.hostel} • {fullDetails.roomNo}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extended Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  {/* Left Column: Contacts */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">Verified Contacts</h4>
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><Phone size={14} /></div>
                           <span className="text-xs font-bold text-gray-400">Student</span>
                         </div>
                         <span className="text-sm font-mono font-black text-white">{fullDetails.phone || '+91 00000 00000'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Users size={14} /></div>
                           <span className="text-xs font-bold text-gray-400">Parent/Guardian</span>
                         </div>
                         <span className="text-sm font-mono font-black text-white">{fullDetails.parentPhone || '+91 00000 00000'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Purpose */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">Movement Rationale</h4>
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 h-full">
                       <div className="flex items-start gap-4 mb-3">
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Info size={14} /></div>
                          <p className="text-sm font-medium italic text-gray-300 leading-relaxed">
                            "{fullDetails.reason || 'Reason not specified.'}"
                          </p>
                       </div>
                       <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[9px] font-black text-gray-600 uppercase">Authorized By</span>
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{fullDetails.approvedBy || 'Chief Warden'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Schedule & Actions */}
                <div className="mt-10 pt-10 border-t border-white/5">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2">Approved Out Window</span>
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase font-black">EXIT</div>
                            <div className="text-sm font-black">{new Date(fullDetails.outTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                          </div>
                          <div className="w-8 h-[1px] bg-white/10"></div>
                          <div className="text-center">
                            <div className="text-[10px] text-orange-500 uppercase font-black">CURFEW</div>
                            <div className="text-sm font-black text-orange-500">{new Date(fullDetails.expectedInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-4">
                         {actualEntry ? (
                            <div className="bg-green-500/20 border border-green-500/30 p-6 rounded-3xl flex items-center justify-center gap-4 animate-in slide-in-from-bottom-4">
                               <CheckCircle2 className="text-green-500" />
                               <span className="text-sm font-black text-green-500 uppercase italic tracking-widest">Transit Cycle Completed Successfully</span>
                            </div>
                         ) : (
                            <button 
                              onClick={handleLogTransit}
                              disabled={isLogging}
                              className={`w-full py-6 rounded-[2rem] font-black text-2xl uppercase tracking-tighter italic transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl border-b-4 group ${
                                actualExit 
                                  ? 'bg-green-500 text-gray-950 hover:bg-green-400 border-green-700' 
                                  : 'bg-red-500 text-white hover:bg-red-400 border-red-800'
                              }`}
                            >
                              {isLogging ? <Loader2 className="animate-spin" /> : (
                                <>
                                  {actualExit ? <LogIn className="w-8 h-8 group-hover:scale-125 transition-transform" /> : <LogOut className="w-8 h-8 group-hover:scale-125 transition-transform" />}
                                  {actualExit ? 'VERIFY ENTRY' : 'VERIFY EXIT'}
                                  <ArrowRight className="w-6 h-6" />
                                </>
                              )}
                            </button>
                         )}
                         <button onClick={reset} className="w-full text-[10px] font-black text-gray-700 hover:text-white transition-all uppercase tracking-[0.4em]">Discard Identity Dossier</button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local History Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[3rem] p-8 border-white/5 flex flex-col h-[700px] overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Session history</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={clearLogs}
                  className="p-2 hover:bg-red-500/10 text-gray-600 hover:text-red-500 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={exportToCSV}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {sessionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50">
                  <FileText className="w-12 h-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No records in cache</p>
                </div>
              ) : (
                sessionLogs.map((log, idx) => (
                  <div 
                    key={log.id} 
                    className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all animate-in slide-in-from-right-4 duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        log.direction === 'ENTRY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {log.direction === 'ENTRY' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs uppercase italic truncate max-w-[120px]">{log.studentName}</div>
                        <div className="text-[9px] font-mono text-gray-500">{log.usn}</div>
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

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
               <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">{sessionLogs.length} Records Localized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin h-8 w-8 ${className}`} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default SecurityFlow;
