
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
  ShieldCheck
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
        
        // Update current active pass if we are in waiting/success modes
        if (activePass) {
          const updated = requests.find(r => r.id === activePass.id);
          if (updated && updated.status !== activePass.status) {
            setActivePass(updated);
            if (updated.status === RequestStatus.APPROVED) setView('SUCCESS');
            if (updated.status === RequestStatus.REJECTED) setView('REJECTED');
          }
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
      // Sanitize name for filename
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
    localStorage.setItem('omnipass_requests', JSON.stringify([...existing, newRequest]));

    setActivePass(newRequest);
    setTimeout(() => {
      setView('PENDING');
      setIsSubmitting(false);
    }, 800);
  };

  const currentTabRequest = allRequests.find(r => r.passType === activeTab && r.status !== RequestStatus.EXPIRED);

  const formatDateTime = (dtStr: string) => {
    if (!dtStr) return "N/A";
    return new Date(dtStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{activeTab} PASS HUB</h2>
            <p className="text-gray-500 text-sm">Manage your movement permissions</p>
          </div>

          {currentTabRequest ? (
            <div className={`glass p-8 rounded-[3rem] border-2 ${currentTabRequest.status === RequestStatus.APPROVED ? 'border-green-500/20 bg-green-500/5' : 'border-white/5'}`}>
              <div className="flex items-center justify-between mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  currentTabRequest.status === RequestStatus.APPROVED ? 'bg-green-500 text-white' : 
                  currentTabRequest.status === RequestStatus.REJECTED ? 'bg-red-500 text-white' : 'bg-orange-500 text-white animate-pulse'
                }`}>
                  {currentTabRequest.status}
                </span>
                <span className="text-[10px] font-bold text-gray-600 uppercase">{currentTabRequest.id}</span>
              </div>

              {currentTabRequest.status === RequestStatus.APPROVED ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-[2rem] mb-6 shadow-2xl">
                    <QRCodeCanvas id="gate-pass-qr" value={JSON.stringify({ ...currentTabRequest, photo: undefined })} size={200} level="M" includeMargin={false} />
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-white uppercase italic">{currentTabRequest.studentName}</h3>
                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Approved by {currentTabRequest.approvedBy}
                    </p>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-bold text-gray-500 uppercase">Exit</p>
                      <p className="text-xs font-bold">{formatDateTime(currentTabRequest.outTime)}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-bold text-gray-500 uppercase">Entry</p>
                      <p className="text-xs font-bold text-orange-400">{formatDateTime(currentTabRequest.expectedInTime)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setActivePass(currentTabRequest); setView('SUCCESS'); }} className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <ChevronRight className="w-4 h-4" /> Expand Identity Card
                  </button>
                </div>
              ) : currentTabRequest.status === RequestStatus.REJECTED ? (
                <div className="text-center py-6">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 font-bold mb-4">Request Rejected</p>
                  <button onClick={() => setView('FORM')} className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase">Apply Again</button>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-400 text-sm italic">Waiting for Warden Signature...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass p-12 rounded-[3rem] border-white/5 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Active {activeTab} Pass</h3>
              <p className="text-gray-500 text-xs mb-8">You need an approved digital pass to transit through the main gate.</p>
              <button 
                onClick={() => setView('FORM')}
                className="w-full bg-cyan-500 text-gray-950 font-black py-5 rounded-[2rem] shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
              >
                REQUEST {activeTab} PASS
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'FORM' && (
        <div className="animate-in slide-in-from-bottom-8 duration-500">
          <div className="mb-8 flex items-center justify-between">
            <button onClick={() => setView('DASHBOARD')} className="text-xs font-bold text-gray-500 uppercase tracking-widest">← Back</button>
            <h2 className="text-xl font-black italic uppercase text-cyan-400">Request {activeTab} Pass</h2>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Identity Capture Section */}
            <div className="glass rounded-[2rem] p-6 border-white/10 space-y-4 shadow-xl">
              <h2 className="text-xs font-black flex items-center gap-2 mb-4 text-gray-500 tracking-widest uppercase">
                <Camera className="w-4 h-4" /> Profile Capture
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
                  <button type="button" onClick={startCamera} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                    {formData.photo ? 'Retake Identity' : 'Capture Now'}
                  </button>
                ) : (
                  <button type="button" onClick={capturePhoto} className="flex items-center gap-2 px-8 py-3 rounded-full bg-cyan-500 text-gray-950 text-xs font-black uppercase">
                    <Zap className="w-4 h-4 fill-current" /> Snap Profile
                  </button>
                )}
              </div>
              <canvas ref={canvasRef} width="400" height="400" className="hidden" />
            </div>

            {/* Student Info */}
            <div className="glass rounded-[2.5rem] p-6 border-white/10 space-y-4 shadow-xl">
              <h2 className="text-xs font-black flex items-center gap-2 text-gray-500 tracking-widest uppercase mb-2">
                <UserIcon className="w-4 h-4" /> Verification Details
              </h2>
              <div className="space-y-4">
                <input required placeholder="Student Full Name" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm" 
                  value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="USN" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm" 
                    value={formData.usn} onChange={e => setFormData({...formData, usn: e.target.value})} />
                  <input required placeholder="Room No" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm" 
                    value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} />
                </div>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm text-gray-400"
                  value={formData.hostel} onChange={e => setFormData({...formData, hostel: e.target.value})}>
                  {HOSTELS.map(h => <option key={h} value={h} className="bg-gray-900">{h}</option>)}
                </select>
              </div>
            </div>

            {/* Pass Logic */}
            <div className="glass rounded-[2.5rem] p-6 border-white/10 space-y-4 shadow-xl">
               <h2 className="text-xs font-black flex items-center gap-2 text-gray-500 tracking-widest uppercase mb-2">
                <Calendar className="w-4 h-4" /> Purpose & Time
              </h2>
              <textarea required placeholder="Brief reason for leaving..." rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-1 focus:ring-cyan-500 text-sm" 
                  value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Out Time</label>
                  <input required type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-gray-400 text-sm" 
                    value={formData.outDateTime} onChange={e => setFormData({...formData, outDateTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Estimated In Time</label>
                  <input required type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-gray-400 text-sm" 
                    value={formData.inDateTime} onChange={e => setFormData({...formData, inDateTime: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || isCameraActive} className="w-full bg-cyan-500 text-gray-950 font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-50 active:scale-95 uppercase tracking-widest">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Submit to Warden</>}
            </button>
          </form>
        </div>
      )}

      {view === 'PENDING' && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-500">
          <div className="w-32 h-32 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-10 flex items-center justify-center">
            <Clock className="w-12 h-12 text-cyan-400 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-cyan-400 mb-4">Under Review</h2>
          <p className="text-gray-500 max-w-xs text-sm mb-12">
            Your {activeTab} Pass request is pending warden digital signature. You will see your QR pass here once approved.
          </p>
          <button onClick={() => setView('DASHBOARD')} className="w-full glass py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Return to Hub</button>
        </div>
      )}

      {view === 'SUCCESS' && activePass && (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <button onClick={() => setView('DASHBOARD')} className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">← Back to Hub</button>
          
          <div className="glass rounded-[3rem] p-8 border-white/10 relative overflow-hidden flex flex-col items-center shadow-2xl">
            {/* Holographic Seal */}
            <div className="absolute top-8 right-8 bg-green-500/20 border border-green-500/50 px-4 py-1 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">VERIFIED</span>
            </div>

            <div className="p-4 bg-white rounded-[2.5rem] mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative z-10">
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
                  <img src={activePass.photo} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg" alt="Profile" />
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase italic">{activePass.studentName}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
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
                    <div className="text-[9px] font-black text-gray-500 uppercase">Movement Schedule</div>
                    <Clock className="w-4 h-4 text-cyan-500" />
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <span className="text-[8px] text-gray-600 block uppercase">Out</span>
                       <span className="text-xs font-bold">{formatDateTime(activePass.outTime)}</span>
                    </div>
                    <div className="w-8 h-[1px] bg-white/10"></div>
                    <div className="text-right">
                       <span className="text-[8px] text-gray-600 block uppercase">In</span>
                       <span className="text-xs font-bold text-orange-400">{formatDateTime(activePass.expectedInTime)}</span>
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

      {view === 'REJECTED' && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-black uppercase italic text-red-500 mb-4">Access Denied</h2>
          <div className="glass w-full p-8 rounded-[3rem] border-red-500/20 mb-8">
            <p className="text-[10px] font-black text-gray-500 uppercase mb-4">Warden's Remark</p>
            <p className="italic text-gray-300 text-sm">"{activePass?.rejectionReason || 'Reason not specified'}"</p>
          </div>
          <button onClick={() => setView('FORM')} className="w-full bg-white text-gray-950 font-black py-5 rounded-[2rem]">Re-apply Correctly</button>
        </div>
      )}
    </div>
  );
};

export default StudentFlow;
