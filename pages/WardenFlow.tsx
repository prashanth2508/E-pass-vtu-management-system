
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText,
  User as UserIcon,
  XCircle,
  Signature,
  Hash,
  ArrowRightLeft
} from 'lucide-react';
import { RequestStatus, User as UserType, GatePassRequest } from '../types';

interface WardenFlowProps {
  user: UserType;
}

const WardenFlow: React.FC<WardenFlowProps> = ({ user }) => {
  const [requests, setRequests] = useState<GatePassRequest[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const loadRequests = () => {
      const stored = localStorage.getItem('omnipass_requests');
      if (stored) {
        setRequests(JSON.parse(stored));
      }
    };
    
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (id: string) => {
    const updated = requests.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: RequestStatus.APPROVED,
          approvalId: 'AUTH-' + Math.random().toString(10).substr(2, 6),
          approvedBy: user.name,
          wardenSignature: 'SIG_' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          expiryTime: req.expectedInTime
        };
      }
      return req;
    });
    setRequests(updated);
    localStorage.setItem('omnipass_requests', JSON.stringify(updated));
  };

  const handleRejectSubmit = () => {
    if (!rejectingId) return;
    const updated = requests.map(req => {
      if (req.id === rejectingId) {
        return {
          ...req,
          status: RequestStatus.REJECTED,
          rejectionReason: rejectReason || 'No reason specified by Warden.'
        };
      }
      return req;
    });
    setRequests(updated);
    localStorage.setItem('omnipass_requests', JSON.stringify(updated));
    setRejectingId(null);
    setRejectReason('');
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const pending = requests.filter(r => r.status === RequestStatus.PENDING);
  const completed = requests.filter(r => r.status !== RequestStatus.PENDING);

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase italic text-cyan-400">Warden Hub</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {user.name} • {user.hostelId}
          </p>
        </div>
        
        <div className="glass px-6 py-4 rounded-3xl border-white/5 flex items-center gap-4">
          <Clock className="text-cyan-400 w-6 h-6" />
          <div>
            <div className="text-2xl font-bold">{pending.length}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase">Pending Requests</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pending.length === 0 && (
          <div className="col-span-full py-24 text-center glass rounded-[3rem] border-white/5">
            <CheckCircle2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">All Clear. No Pending Tasks.</p>
          </div>
        )}

        {pending.map(req => (
          <div key={req.id} className="glass rounded-[2.5rem] p-6 border-white/10 hover:border-cyan-500/30 transition-all flex flex-col">
            <div className="flex items-center gap-4 mb-6">
               <div className="relative">
                <img src={req.photo || `https://picsum.photos/seed/${req.id}/100`} className="w-16 h-16 rounded-2xl object-cover border border-white/5" alt="Student" />
                <div className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${req.passType === 'OUT' ? 'bg-purple-500' : 'bg-cyan-500'} text-gray-950 shadow-lg`}>
                   {req.passType}
                </div>
              </div>
              <div>
                <h4 className="font-black text-lg leading-tight uppercase italic">{req.studentName}</h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400/70">
                  <Hash className="w-3 h-3" /> {req.usn} • RM {req.roomNo}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Purpose of Visit</div>
                <p className="text-xs font-medium italic text-gray-300">"{req.reason}"</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase block">Out</span>
                    <span className="text-xs font-bold">{formatTime(req.outTime)}</span>
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-gray-500 uppercase block">In</span>
                    <span className="text-xs font-bold text-orange-400">{formatTime(req.expectedInTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {rejectingId === req.id ? (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <textarea 
                  className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-xs text-white outline-none mb-3"
                  placeholder="Rejection reason..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setRejectingId(null)} className="py-3 bg-white/5 text-gray-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                  <button onClick={handleRejectSubmit} className="py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase">Reject</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setRejectingId(req.id)} className="py-4 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-2xl font-black text-xs transition-all">REJECT</button>
                <button onClick={() => handleApprove(req.id)} className="py-4 bg-cyan-500 text-gray-950 hover:bg-cyan-400 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2">
                  <Signature className="w-4 h-4" /> APPROVE
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {completed.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-600 italic">History Logs</h2>
          <div className="glass rounded-[2rem] overflow-hidden border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-500 uppercase text-center">Type</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-500 uppercase text-center">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {completed.map(req => (
                  <tr key={req.id} className="hover:bg-white/5">
                    <td className="px-8 py-4">
                      <div className="font-bold text-sm uppercase italic">{req.studentName}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{req.usn}</div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">{req.passType}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${req.status === RequestStatus.APPROVED ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardenFlow;
