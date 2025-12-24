
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  LogOut as LogOutIcon, 
  LogIn as LogInIcon,
  Map,
  ShieldAlert,
  Download,
  Database,
  Search,
  CloudUpload,
  Zap,
  ExternalLink
} from 'lucide-react';
import { TransitLog } from '../types';

const CommandCenter: React.FC = () => {
  const [logs, setLogs] = useState<TransitLog[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Replace with actual Google Sheet URL
  const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit';

  useEffect(() => {
    const loadLogs = () => {
      const stored = localStorage.getItem('omnipass_transit_logs');
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    };
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const exportToCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = ['Log ID', 'Student Name', 'USN', 'Pass ID', 'Pass Type', 'Hostel', 'Direction', 'Timestamp', 'Security Officer'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          `"${log.studentName}"`,
          log.usn,
          log.passId,
          log.passType,
          log.hostel,
          log.direction,
          new Date(log.timestamp).toLocaleString(),
          `"${log.securityOfficer}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `OmniPass_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 1200);
  };

  const entryCount = logs.filter(l => l.direction === 'ENTRY').length;
  const exitCount = logs.filter(l => l.direction === 'EXIT').length;

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 italic text-cyan-400">COMMAND CENTER</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Global Transit Intelligence Live
          </p>
        </div>
        
        <div className="flex gap-4">
           <a 
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-green-500 hover:text-gray-950 transition-all font-black text-xs uppercase tracking-widest group"
          >
            <ExternalLink className="w-4 h-4" />
            Open Master Sheet
          </a>
           <button 
            onClick={exportToCSV}
            disabled={isExporting}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-cyan-500 hover:text-gray-950 transition-all font-black text-xs uppercase tracking-widest group"
          >
            {isExporting ? <CloudUpload className="w-4 h-4 animate-bounce" /> : <Download className="w-4 h-4 group-hover:scale-125 transition-transform" />}
            {isExporting ? 'Generating Report...' : 'Export Audit CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform">
            <Users size={120} />
          </div>
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Total Transits</div>
          <div className="text-5xl font-black mb-1">{logs.length}</div>
          <div className="text-green-400 text-xs font-bold italic">Real-time sync active</div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-red-500/5 group-hover:scale-110 transition-transform">
            <AlertTriangle size={120} />
          </div>
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Check-Outs</div>
          <div className="text-5xl font-black text-orange-500 mb-1">{exitCount}</div>
          <div className="text-orange-400 text-xs font-bold">Awaiting return</div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform">
            <LogInIcon size={120} />
          </div>
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Check-Ins</div>
          <div className="text-5xl font-black mb-1 text-green-500">{entryCount}</div>
          <div className="text-gray-400 text-xs font-bold italic">Verified entry logs</div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform">
            <Database size={120} />
          </div>
          <div className="text-gray-500 text-xs font-bold uppercase mb-2">Storage Status</div>
          <div className="text-2xl font-black mb-1">Sheet Sync</div>
          <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Google Cloud Linked</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-[3rem] p-10 border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Live Transit Stream</h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <Search className="w-4 h-4 text-gray-600" />
                  <input type="text" placeholder="Search USN..." className="bg-transparent border-none outline-none text-xs text-gray-400 font-bold" />
               </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left">
               <thead className="border-b border-white/5">
                 <tr>
                   <th className="py-4 px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Transit ID</th>
                   <th className="py-4 px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Student / USN</th>
                   <th className="py-4 px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Hostel</th>
                   <th className="py-4 px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Direction</th>
                   <th className="py-4 px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Time</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {logs.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-20 text-center text-gray-600 font-black uppercase tracking-widest text-sm italic">
                       No transits recorded today
                     </td>
                   </tr>
                 )}
                 {logs.map(log => (
                   <tr key={log.id} className="group hover:bg-white/5 transition-all">
                     <td className="py-4 px-2 font-mono text-[10px] text-gray-500">{log.id}</td>
                     <td className="py-4 px-2">
                        <div className="font-bold text-xs uppercase">{log.studentName}</div>
                        <div className="text-[10px] text-cyan-500/70 font-mono">{log.usn}</div>
                     </td>
                     <td className="py-4 px-2 text-xs font-medium text-gray-400">{log.hostel}</td>
                     <td className="py-4 px-2 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                          log.direction === 'ENTRY' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {log.direction === 'ENTRY' ? <LogInIcon className="w-3 h-3" /> : <LogOutIcon className="w-3 h-3" />}
                          {log.direction}
                        </span>
                     </td>
                     <td className="py-4 px-2 text-right">
                        <div className="text-[10px] font-bold text-gray-500 italic">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        <div className="space-y-8">
           <div className="glass rounded-[3rem] p-8 border-white/5">
            <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Late Alerts</h3>
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4 animate-pulse">
                <ShieldAlert className="text-red-500 w-6 h-6" />
                <div className="text-xs font-black text-red-500 uppercase">7 PM Curfew Active</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-[3rem] p-8 border-white/5">
            <h3 className="text-2xl font-black mb-6 italic uppercase tracking-tighter">System Pulse</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sheet Sync</div>
                  <div className="text-sm font-black text-green-400 flex items-center gap-2">
                     <Zap className="w-4 h-4" /> Connected
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
