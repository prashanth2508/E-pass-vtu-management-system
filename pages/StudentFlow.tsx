
import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  Download, 
  Share2,
  FileText,
  User as UserIcon,
  Loader2,
  Hash,
  Building,
  XCircle,
  Camera,
  RefreshCcw,
  Zap,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Plus,
  ArrowRight
} from 'lucide-react';
import { HOSTELS } from '../constants';
import { GatePassRequest, RequestStatus, PassType } from '../types';
import { QRCodeCanvas } from 'qrcode.react';

const StudentFlow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PassType>('GATE');
  const [view, setView] = useState<'DASHBOARD' | 'FORM' | 'PENDING' | 'SUCCESS' | 'REJECTED'>('DASHBOARD');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    studentName: '',
    usn: '',
    branch: '',
    hostel: HOSTELS[0],
    roomNo: '',
    phone: '',
    parentPhone: '',
    reason: '',
    outDateTime: '',
    inDateTime: '',
    photo: '' as string
  });
  
  const [activePass, setActivePass] = useState<GatePassRequest | null>(null);
  const [allRequests, setAllRequests] = useState<GatePassRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load and sync requests
  useEffect(() => {
    const syncRequests = () => {
      const stored = localStorage.getItem('omnipass_requests');
      if (stored) {
        const requests: GatePassRequest[] = JSON.parse(stored);
        setAllRequests(requests);
        
        // If we are looking at a specific pass in detail, update it
        if (activePass) {
          const updated = requests.find(r => r.id === activePass.id);
          if (updated) setActivePass(updated);
        }
      }
    };

    syncRequests();
    const interval = setInterval(syncRequests, 2000);
    return () => clearInterval(interval);
  }, [activePass]);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 400, height: 400 },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 400, 400);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setFormData({ ...formData, photo: imageData });
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsCameraActive(false);
  };

  const handleDownload = () => {
    const canvas = document.getElementById('gate-pass-qr-full') as HTMLCanvasElement;
    if (!canvas || !activePass) return;
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = activePass.studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `OmniPass_${safeName}_${activePass.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.photo) return alert("Photo required for identity match.");
    setIsSubmitting(true);
    
    const newRequest: GatePassRequest = {
      id: 'REQ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      passType: activeTab,
      studentId: 'STU-' + formData.usn,
      studentName: formData.studentName,
      usn: formData.usn,
      branch: formData.branch,
      hostel: formData.hostel,
      roomNo: formData.roomNo,
      phone: formData.phone,
      parentPhone: formData.parentPhone,
      reason: formData.reason,
      outTime: formData.outDateTime,
      expectedInTime: formData.inDateTime,
      status: RequestStatus.PENDING,
      timestamp: new Date().toISOString(),
      photo: formData.photo
    };

    const existing = JSON.parse(localStorage.getItem('omnipass_requests') || '[]');
    localStorage.setItem('omnipass_requests', JSON.stringify([newRequest, ...existing]));

    setTimeout(() => {
      setView('DASHBOARD');
      setIsSubmitting(false);
      // Reset form
      setFormData({ ...formData, reason: '', outDateTime: '', inDateTime: '', photo: '' });
    }, 800);
  };

  const formatDateTime = (dtStr: string) => {
    if (!dtStr) return "N/A";
    return new Date(dtStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  // Filter requests for the current tab
  const tabRequests = allRequests.filter(r => r.passType === activeTab);
  const approvedPasses = tabRequests.filter(r => r.status === RequestStatus.APPROVED);
  const pendingPasses = tabRequests.filter(r => r.status === RequestStatus.PENDING);
  const otherPasses = tabRequests.filter(r => r.status !== RequestStatus.APPROVED && r.status !== RequestStatus.PENDING);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24">
      {/* Header Tabs */}
      <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/5">
        <button 
          onClick={() => { setActiveTab('GATE'); setView('DASHBOARD'); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'GATE' ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          Gate Pass
        </button>
        <button 
          onClick={() => { setActiveTab('OUT'); setView('DASHBOARD'); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'OUT' ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          Out Pass
        </button>
      </div>

      {view === 'DASHBOARD' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{activeTab} HUB</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">OmniPass Digital Terminal</p>
          </div>

          {/* ALWAYS VISIBLE: REQUEST BUTTON */}
          <section>
            <button 
              onClick={() => setView('FORM')}
              className="w-full glass p-6 rounded-[2.5rem] border-white/5 flex items-center gap-6 group hover:border-cyan-500/50 transition-all active:scale-95 text-left bg-gradient-to-br from-white/[0.05] to-transparent"
            >
              <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center text-gray-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black uppercase italic leading-tight">Request {activeTab} Pass</h4>
                <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-0.5">Start New Authorization</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-700 group-hover:text-cyan-400 transition-colors" />
            </button>
          </section>

          {/* ACTIVE PASSES SECTION */}
          {approvedPasses.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4 ml-4">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Active Authorizations</h3>
              </div>
              
              {approvedPasses.map(pass => (
                <div 
                  key={pass.id}
                  onClick={() => { setActivePass(pass); setView('SUCCESS'); }}
                  className="glass p-6 rounded-[2.5rem] border-2 border-green-500/20 bg-green-500/[0.03] cursor-pointer hover:bg-green-500/[0.06] transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-white p-2 rounded-xl group-hover:scale-105 transition-transform">
                       <QRCodeCanvas value={JSON.stringify({ id: pass.id, usn: pass.usn })} size={60} level="M" />
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-md">Approved</span>
                         <span className="text-[10px] font-mono text-gray-600">{pass.id}</span>
                       </div>
                       <h4 className="font-black text-lg uppercase italic text-white">{pass.studentName}</h4>
                       <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-500" /> {new Date(pass.outTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          <span className="text-gray-800">•</span>
                          <span>In: {new Date(pass.expectedInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* PENDING PASSES SECTION */}
          {pendingPasses.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4 ml-4">Pending Review</h3>
              {pendingPasses.map(pass => (
                <div key={pass.id} className="glass p-6 rounded-[2.5rem] border-white/5 opacity-80">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full animate-pulse">Awaiting Signature</span>
                    <span className="text-[10px] font-mono text-gray-600">{pass.id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                       <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
                    </div>
                    <div>
                      <h4 className="font-bold uppercase text-sm italic">{pass.reason}</h4>
                      <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Submitted {new Date(pass.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* EMPTY STATE */}
          {approvedPasses.length === 0 && pendingPasses.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-gray-700" />
               </div>
               <p className="text-xs font-black uppercase tracking-widest text-gray-600 italic">No Active Transit Clearances</p>
               <p className="text-[10px] text-gray-800 font-bold uppercase mt-2">Submit a request to move</p>
            </div>
          )}
        </div>
      )}

      {view === 'FORM' && (
        <div className="animate-in slide-in-from-bottom-8 duration-500">
          <div className="mb-8 flex items-center justify-between">
            <button onClick={() => setView('DASHBOARD')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">← Back</button>
            <h2 className="text-xl font-black italic uppercase text-cyan-400 tracking-tighter">New Request</h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Identity Capture Section */}
            <div className="glass rounded-[2.5rem] p-8 border-white/10 space-y-4 shadow-xl">
              <h2 className="text-[10px] font-black flex items-center gap-2 mb-4 text-gray-500 tracking-[0.3em] uppercase">
                <Camera className="w-4 h-4" /> Live Verification
              </h2>
              
              <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-3xl overflow-hidden glass border-2 border-white/5 flex items-center justify-center bg-gray-950 shadow-inner">
                {formData.photo && !isCameraActive ? (
                  <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : isCameraActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <UserIcon className="w-12 h-12" />
                  </div>
                )}
                {isCameraActive && <div className="scan-line"></div>}
              </div>

              <div className="flex justify-center">
                {!isCameraActive ? (
                  <button type="button" onClick={startCamera} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    {formData.photo ? 'Retake Identity' : 'Open Lens'}
                  </button>
                ) : (
                  <button type="button" onClick={capturePhoto} className="flex items-center gap-2 px-8 py-3 rounded-full bg-cyan-500 text-gray-950 text-xs font-black uppercase shadow-lg shadow-cyan-500/20">
                    <Zap className="w-4 h-4 fill-current" /> Snap Profile
                  </button>
                )}
              </div>
              <canvas ref={canvasRef} width="400" height="400" className="hidden" />
            </div>

            {/* Student Info */}
            <div className="glass rounded-[2.5rem] p-8 border-white/10 space-y-4 shadow-xl">
              <h2 className="text-[10px] font-black flex items-center gap-2 text-gray-500 tracking-[0.3em] uppercase mb-2">
                <UserIcon className="w-4 h-4" /> Identity Details
              </h2>
              <div className="space-y-4">
                <input required placeholder="Student Full Name" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm font-medium" 
                  value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="USN" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm font-medium" 
                    value={formData.usn} onChange={e => setFormData({...formData, usn: e.target.value})} />
                  <input required placeholder="Room No" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm font-medium" 
                    value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} />
                </div>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-gray-400 font-medium"
                  value={formData.hostel} onChange={e => setFormData({...formData, hostel: e.target.value})}>
                  {HOSTELS.map(h => <option key={h} value={h} className="bg-gray-900">{h}</option>)}
                </select>
              </div>
            </div>

            {/* Pass Logic */}
            <div className="glass rounded-[2.5rem] p-8 border-white/10 space-y-4 shadow-xl">
               <h2 className="text-[10px] font-black flex items-center gap-2 text-gray-500 tracking-[0.3em] uppercase mb-2">
                <Calendar className="w-4 h-4" /> Purpose & Schedule
              </h2>
              <textarea required placeholder="Brief reason for leaving..." rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm font-medium italic" 
                  value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Out Time</label>
                  <input required type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-gray-400 text-sm" 
                    value={formData.outDateTime} onChange={e => setFormData({...formData, outDateTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">Est. In Time</label>
                  <input required type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-gray-400 text-sm" 
                    value={formData.inDateTime} onChange={e => setFormData({...formData, inDateTime: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || isCameraActive} className="w-full bg-cyan-500 text-gray-950 font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-50 active:scale-95 uppercase tracking-widest">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Submit to Warden</>}
            </button>
          </form>
        </div>
      )}

      {view === 'SUCCESS' && activePass && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <button onClick={() => setView('DASHBOARD')} className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8 hover:text-white transition-colors">← Hub Dashboard</button>
          
          <div className="glass rounded-[3rem] p-8 border-white/10 relative overflow-hidden flex flex-col items-center shadow-2xl bg-gradient-to-b from-white/[0.05] to-transparent">
            {/* Holographic Seal */}
            <div className="absolute top-8 right-8 bg-green-500/20 border border-green-500/50 px-4 py-1 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span>
            </div>

            <div className="p-5 bg-white rounded-[2.5rem] mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative z-10">
              <QRCodeCanvas 
                id="gate-pass-qr-full" 
                value={JSON.stringify({
                  id: activePass.id,
                  name: activePass.studentName,
                  usn: activePass.usn,
                  hostel: activePass.hostel,
                  room: activePass.roomNo,
                  warden: activePass.approvedBy,
                  sig: activePass.wardenSignature
                })} 
                size={220} 
                level="H" 
              />
            </div>
            
            <div className="w-full space-y-6 relative z-10">
               <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img src={activePass.photo} className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg" alt="Profile" />
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 p-1 rounded-lg">
                       <ShieldCheck className="w-4 h-4 text-gray-950" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase italic leading-tight">{activePass.studentName}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                       <Hash className="w-3 h-3 text-cyan-400" /> {activePass.usn} • {activePass.passType} PASS
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-500 uppercase text-[8px] font-black block mb-1">Signed By</span>
                    <div className="text-xs font-black text-cyan-400">{activePass.approvedBy}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-500 uppercase text-[8px] font-black block mb-1">Hostel Block</span>
                    <div className="text-xs font-black text-white">{activePass.hostel}</div>
                  </div>
               </div>

               <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                 <div className="flex justify-between items-center mb-4">
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Movement Window</div>
                    <Clock className="w-4 h-4 text-cyan-500" />
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <span className="text-[8px] text-gray-600 block uppercase tracking-widest">Check-Out</span>
                       <span className="text-sm font-black text-white">{formatDateTime(activePass.outTime)}</span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10"></div>
                    <div className="text-right">
                       <span className="text-[8px] text-gray-600 block uppercase tracking-widest">Curfew-In</span>
                       <span className="text-sm font-black text-orange-400">{formatDateTime(activePass.expectedInTime)}</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button onClick={handleDownload} className="glass p-5 rounded-3xl flex flex-col items-center gap-2 hover:bg-white/5 group transition-all">
              <Download className="text-cyan-400 group-hover:scale-110" /> 
              <span className="text-[10px] font-black uppercase">Download</span>
            </button>
            <button className="glass p-5 rounded-3xl flex flex-col items-center gap-2 hover:bg-white/5 group transition-all">
              <Share2 className="text-cyan-400 group-hover:scale-110" /> 
              <span className="text-[10px] font-black uppercase">Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFlow;
