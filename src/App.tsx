import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Clock, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  History, 
  LayoutDashboard, 
  Download,
  User,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string;
}

interface TimeLog {
  id: number;
  type: 'check-in' | 'check-out';
  timestamp: string;
}

export default function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [team, setTeam] = useState<UserData[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('theo-doi');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (token) {
      fetchLogs();
      fetchStats();
      fetchTeam();
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTodayCount(data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering 
      ? { email, password, name, department }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleTrack = async (type: 'check-in' | 'check-out') => {
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, note })
      });
      if (res.ok) {
        setNote('');
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'work_logs.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-500/10 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Clock className="text-white w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">WorkTrack Pro</h1>
              <p className="text-slate-400 text-sm mt-1">
                {isRegistering ? 'Tạo tài khoản mới' : 'Chào mừng bạn quay trở lại'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Họ và Tên</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phòng ban</label>
                    <input 
                      type="text" 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                      placeholder="BIM MEP"
                      required
                    />
                  </div>
                </motion.div>
              )}
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  placeholder="nhanvien@worktrack.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Mật khẩu</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs mt-2 text-center font-medium"
                >
                  {error}
                </motion.p>
              )}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {loading ? 'Đang xử lý...' : (isRegistering ? 'Đăng Ký Ngay' : 'Đăng Nhập')}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
              >
                {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
              </button>
            </div>
          </div>
          
          <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            © 2026 WorkTrack System
          </p>
        </motion.div>
      </div>
    );
  }

  const lastLog = logs[0];
  const isCheckedIn = lastLog?.type === 'check-in';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1.5">Nhân viên hiện tại</div>
              <div className="text-2xl font-bold text-white tracking-tight">{user?.name}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">{user?.department}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg uppercase tracking-widest">{user?.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors group"
              >
                <LogOut className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Đăng Xuất
              </button>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isCheckedIn ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
              Trạng thái hệ thống
            </div>
            <div className="text-7xl font-mono font-medium tracking-tighter text-white tabular-nums">
              {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-widest">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Navigation Rail */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <nav className="bg-white/5 backdrop-blur-xl p-1.5 rounded-[24px] border border-white/10 flex gap-1.5 shadow-2xl">
            {[
              { id: 'theo-doi', label: 'Bảng điều khiển', icon: LayoutDashboard },
              { id: 'luu-tru', label: 'Lịch sử chấm công', icon: History },
              { id: 'thanh-vien', label: 'Đội ngũ', icon: User },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300",
                  activeTab === tab.id 
                    ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-white text-slate-950 text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl active:scale-95"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo Excel
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Action Center */}
          <div className="lg:col-span-8 space-y-10">
            {activeTab === 'theo-doi' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-2xl rounded-[48px] p-12 border border-white/10 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight mb-2">Trung tâm điều khiển</h3>
                      <p className="text-slate-400 text-sm">Ghi nhận thời gian làm việc của bạn một cách chính xác.</p>
                    </div>
                    <div className={cn(
                      "px-6 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 border",
                      isCheckedIn 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full", isCheckedIn ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]")} />
                      {isCheckedIn ? "Đang trực tuyến" : "Đã ngoại tuyến"}
                    </div>
                  </div>

                  {/* Note Input */}
                  <div className="mb-12">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Ghi chú công việc (Tùy chọn)</label>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-6 py-4 rounded-3xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600 resize-none h-24"
                      placeholder="Hôm nay bạn đã làm những gì?..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button
                      onClick={() => handleTrack('check-in')}
                      disabled={isCheckedIn}
                      className={cn(
                        "group relative h-64 rounded-[40px] flex flex-col items-center justify-center gap-6 transition-all duration-500 border-2",
                        !isCheckedIn 
                          ? "bg-white/5 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/5 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]" 
                          : "bg-white/2 border-transparent opacity-20 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
                        !isCheckedIn ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:scale-110" : "bg-slate-800 text-slate-600"
                      )}>
                        <ArrowRight className="w-10 h-10" />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Vào Làm</div>
                    </button>

                    <button
                      onClick={() => handleTrack('check-out')}
                      disabled={!isCheckedIn}
                      className={cn(
                        "group relative h-64 rounded-[40px] flex flex-col items-center justify-center gap-6 transition-all duration-500 border-2",
                        isCheckedIn 
                          ? "bg-white/5 border-red-500/20 hover:border-red-500 hover:bg-red-500/5 hover:shadow-[0_0_40px_rgba(239,68,68,0.1)]" 
                          : "bg-white/2 border-transparent opacity-20 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
                        isCheckedIn ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] group-hover:scale-110" : "bg-slate-800 text-slate-600"
                      )}>
                        <ArrowLeft className="w-10 h-10" />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">Tan Ca</div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'luu-tru' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-2xl rounded-[48px] p-12 border border-white/10 shadow-2xl"
              >
                <h3 className="text-3xl font-bold text-white tracking-tight mb-8">Lịch sử chấm công</h3>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          log.type === 'check-in' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {log.type === 'check-in' ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white uppercase tracking-widest">{log.type === 'check-in' ? 'Vào Làm' : 'Tan Ca'}</div>
                          <div className="text-xs text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                      {log.note && (
                        <div className="flex-1 md:mx-8 p-4 bg-white/2 rounded-2xl border border-white/5 italic text-slate-400 text-sm">
                          "{log.note}"
                        </div>
                      )}
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-center text-slate-500 py-20">Chưa có dữ liệu lịch sử.</p>}
                </div>
              </motion.div>
            )}

            {activeTab === 'thanh-vien' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-2xl rounded-[48px] p-12 border border-white/10 shadow-2xl"
              >
                <h3 className="text-3xl font-bold text-white tracking-tight mb-8">Đội ngũ nhân sự</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {team.map((member) => (
                    <div key={member.id} className="bg-white/5 p-6 rounded-[32px] border border-white/5 flex items-center gap-5">
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-xl">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{member.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{member.department} • {member.role}</div>
                        <div className="text-xs text-slate-600 mt-1">{member.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Hoạt động hôm nay</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-light text-white tracking-tighter">{todayCount}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lượt ghi nhận</span>
                </div>
              </div>
              <div className="md:col-span-2 bg-white/5 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Thông tin phiên làm việc</div>
                  <p className="text-sm text-slate-400">Hệ thống đang hoạt động ổn định và bảo mật.</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: History */}
          <div className="lg:col-span-4">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-2xl h-full sticky top-8">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                    <History className="w-5 h-5" />
                  </div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Nhật ký gần đây</h3>
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Thời gian thực</div>
              </div>

              <div className="space-y-8">
                <AnimatePresence mode="popLayout">
                  {logs.slice(0, 8).map((log, idx) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex flex-col gap-2 group relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 border-[#0a0a0a] z-10",
                            log.type === 'check-in' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          )} />
                          <div>
                            <div className="text-[11px] font-bold text-white uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
                              {log.type === 'check-in' ? 'Vào Làm' : 'Tan Ca'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                              {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                      {log.note && (
                        <div className="ml-9 text-[10px] text-slate-500 italic line-clamp-2">
                          {log.note}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {logs.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Circle className="w-8 h-8 text-slate-800" />
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Chưa có dữ liệu ghi nhận</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
