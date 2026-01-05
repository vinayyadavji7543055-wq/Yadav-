
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Wallet, History, Settings, Zap, X, Plus, Minus,
  ShieldCheck, ArrowDownCircle, ArrowUpCircle, Target, 
  Activity, QrCode, ArrowLeft, MessageSquare, RefreshCw, Send, Lock, Mail, Eye, EyeOff,
  LogOut, UserPlus, Database, Info, Loader2, CheckCircle2,
  Gamepad2, Dices, Spade, PlayCircle
} from 'lucide-react';
import { MOCK_MATCHES } from './constants';
import { Match, Bet, User as UserProfile, Transaction } from './types';

const STORAGE_KEYS = {
  USERS: 'bet_sphere_users',
  MATCHES: 'bet_sphere_matches',
  ACTIVE_USER: 'bet_sphere_current_session'
};

const TAX_RATE = 0.02; // 2% tax on recharges

const CASINO_GAMES = [
  { id: 'g1', title: 'Live Roulette', provider: 'Evolution', image: 'https://images.unsplash.com/photo-1596838132731-dd93c852438a?w=400&h=250&fit=crop', players: '1.2k' },
  { id: 'g2', title: 'Blackjack VIP', provider: 'Pragmatic', image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=400&h=250&fit=crop', players: '850' },
  { id: 'g3', title: 'Crazy Time', provider: 'Evolution', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487fc2f?w=400&h=250&fit=crop', players: '5.4k' },
  { id: 'g4', title: 'Gates of Olympus', provider: 'Pragmatic', image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=250&fit=crop', players: '2.1k' },
];

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [matches] = useState<Match[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
    return saved ? JSON.parse(saved) : MOCK_MATCHES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'games' | 'history' | 'wallet' | 'control'>('matches');

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [betSelection, setBetSelection] = useState<'A' | 'B' | 'Draw'>('A');

  const [walletView, setWalletView] = useState<'main' | 'deposit' | 'withdraw'>('main');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'input' | 'qr' | 'verifying' | 'success'>('input');
  const [countdown, setCountdown] = useState(5);
  const [currentPendingTx, setCurrentPendingTx] = useState<Transaction | null>(null);

  const timerRef = useRef<number | null>(null);
  const ADMIN_NAME = "Vinay Raj Sandhya";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(currentUser));
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? currentUser : u));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }, [currentUser]);

  // Automatic Verification Timer
  useEffect(() => {
    if (paymentStep === 'verifying') {
      setCountdown(5);
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            completePayment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentStep]);

  const completePayment = () => {
    if (!currentPendingTx || !currentUser) return;
    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        balance: prev.balance + currentPendingTx.amount,
        transactions: [{ ...currentPendingTx, status: 'completed' }, ...prev.transactions]
      };
    });
    setPaymentStep('success');
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Fill all fields");

    if (authMode === 'signup') {
      if (allUsers.find(u => u.name === email)) return alert("Email exists");
      const newUser: UserProfile = {
        id: 'UID-' + Math.floor(Math.random() * 100000),
        name: email,
        balance: 0,
        bets: [],
        transactions: [],
        kycStatus: 'unverified',
        currency: 'INR'
      };
      setAllUsers([...allUsers, newUser]);
      setCurrentUser(newUser);
      setIsLoggedIn(true);
    } else {
      const u = allUsers.find(user => user.name === email);
      if (u) { setCurrentUser(u); setIsLoggedIn(true); } 
      else alert("Account not found");
    }
  };

  const handleLogout = () => { setCurrentUser(null); setIsLoggedIn(false); setActiveTab('matches'); };

  const handlePlaceBet = () => {
    if (!selectedMatch || !currentUser) return;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount");
    if (currentUser.balance < amount) return alert("Low balance! Recharge now.");

    const odds = betSelection === 'A' ? selectedMatch.oddsA : betSelection === 'B' ? selectedMatch.oddsB : (selectedMatch.oddsDraw || 0);
    const newBet: Bet = {
      id: 'B-' + Date.now(),
      matchId: selectedMatch.id,
      matchTitle: `${selectedMatch.teamA} v ${selectedMatch.teamB}`,
      selection: betSelection,
      amount,
      odds,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setCurrentUser({
      ...currentUser,
      balance: currentUser.balance - amount,
      bets: [newBet, ...currentUser.bets],
      transactions: [{ id: 'TX-'+Date.now(), type: 'bet', amount, method: 'Stake', status: 'completed', timestamp: new Date().toISOString() }, ...currentUser.transactions]
    });
    alert("Bet Placed!");
    setBetAmount('');
    setSelectedMatch(null);
  };

  const handlePaidAction = () => {
    const rawAmt = parseFloat(inputAmount);
    if (isNaN(rawAmt) || rawAmt < 100) return alert("Min ₹100");
    const netAmt = rawAmt - (rawAmt * TAX_RATE);
    const txId = 'DEP-' + Math.floor(Math.random() * 1000000);
    setCurrentPendingTx({ id: txId, type: 'deposit', amount: netAmt, method: 'PhonePe', status: 'pending', timestamp: new Date().toISOString() });
    setPaymentStep('verifying');
  };

  const handleWithdrawRequest = () => {
    const amt = parseFloat(inputAmount);
    if (!currentUser || isNaN(amt) || amt > currentUser.balance) return alert("Invalid amount or low balance");
    const msg = encodeURIComponent(`Withdrawal Request\nAmount: ₹${amt}\nUser ID: ${currentUser.id}\nEmail: ${currentUser.name}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    resetWallet();
  };

  const resetWallet = () => { 
    setWalletView('main'); setPaymentStep('input'); setInputAmount(''); setCurrentPendingTx(null); setCountdown(5);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">BETSPHERE</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">NextGen Sports & Casino</p>
          </div>
          <form onSubmit={handleAuth} className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6 shadow-2xl">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
               <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${authMode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Create ID</button>
               <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Login</button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email / Username" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-indigo-600 transition-all" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 font-bold outline-none focus:border-indigo-600 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all">
              {authMode === 'signup' ? 'Join Now' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans">
      <div className="bg-[#6739b7] py-2 overflow-hidden shadow-lg border-b border-white/10 z-50">
        <div className="animate-marquee whitespace-nowrap text-[10px] font-black tracking-widest uppercase">
          🎰 NEW CASINO GAMES ADDED • 💰 INSTANT AUTO-RECHARGE ENABLED • OWNER: {ADMIN_NAME.toUpperCase()} • 2% TAX • 
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('matches')}>
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg"><Trophy className="w-5 h-5" /></div>
          <h1 className="text-xl font-black tracking-tighter uppercase">BETSPHERE</h1>
        </div>
        <div className="flex items-center gap-2">
          <div onClick={() => setActiveTab('wallet')} className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-sm">₹{currentUser?.balance.toFixed(2)}</span>
          </div>
          <button onClick={handleLogout} className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:text-rose-400"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {activeTab === 'matches' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Zap className="text-amber-400 w-5 h-5" /> Sports Exchange
              </h2>
              <div className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black text-indigo-400 uppercase">Cricket / Football</div>
            </div>
            <div className="grid gap-4">
              {matches.map(match => (
                <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl group hover:border-slate-700 transition-all">
                  <div className="p-3 border-b border-slate-800 bg-slate-800/10 flex justify-between px-6">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{match.league}</span>
                    {match.status === 'live' && <span className="text-rose-500 text-[9px] font-black uppercase animate-pulse">Live</span>}
                  </div>
                  <div className="p-8 flex items-center justify-around">
                    <div className="text-center flex-1">
                      <img src={match.captainPhotoA} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-indigo-500 p-0.5 group-hover:scale-105 transition-transform" alt={match.teamA} />
                      <h4 className="font-black text-xs uppercase truncate mb-3">{match.teamA}</h4>
                      <button onClick={() => { setSelectedMatch(match); setBetSelection('A'); }} className={`w-full py-2 rounded-lg border-2 font-black text-[10px] transition-all ${selectedMatch?.id === match.id && betSelection === 'A' ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}>{match.oddsA.toFixed(2)}</button>
                    </div>
                    <div className="px-4 text-slate-800 font-black italic">VS</div>
                    <div className="text-center flex-1">
                      <img src={match.captainPhotoB} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-slate-700 p-0.5 group-hover:scale-105 transition-transform" alt={match.teamB} />
                      <h4 className="font-black text-xs uppercase truncate mb-3">{match.teamB}</h4>
                      <button onClick={() => { setSelectedMatch(match); setBetSelection('B'); }} className={`w-full py-2 rounded-lg border-2 font-black text-[10px] transition-all ${selectedMatch?.id === match.id && betSelection === 'B' ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}>{match.oddsB.toFixed(2)}</button>
                    </div>
                  </div>
                  {selectedMatch?.id === match.id && (
                    <div className="p-6 bg-slate-950/50 border-t border-slate-800 space-y-4 animate-in slide-in-from-top-2">
                      <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex items-center">
                        <span className="text-indigo-400 font-black mr-2">₹</span>
                        <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="Stake..." className="bg-transparent font-black text-xl w-full outline-none text-emerald-400" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handlePlaceBet} className="flex-1 py-3 bg-indigo-600 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Stake on {betSelection === 'A' ? match.teamA : match.teamB}</button>
                        <button onClick={() => setSelectedMatch(null)} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Dices className="text-indigo-400 w-5 h-5" /> Live Casino
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {CASINO_GAMES.map(game => (
                <div key={game.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group cursor-pointer hover:border-indigo-500 transition-all shadow-xl">
                  <div className="relative aspect-video">
                    <img src={game.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={game.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end p-3">
                      <div className="flex items-center gap-1.5 bg-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                         <div className="w-1 h-1 bg-white rounded-full"></div> Live
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-black text-xs uppercase mb-1 line-clamp-1">{game.title}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">{game.provider}</span>
                      <span className="text-[8px] font-black text-indigo-400 uppercase flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" /> {game.players}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-center">
               <Spade className="w-10 h-10 text-slate-800 mx-auto mb-2" />
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">More Tables Coming Soon</p>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && currentUser && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Wallet className="w-32 h-32" /></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Wallet Balance</p>
              <h2 className="text-5xl font-black mb-8 relative z-10 tracking-tighter">₹{currentUser.balance.toFixed(2)}</h2>
              <div className="flex gap-4 relative z-10">
                <button onClick={() => { setWalletView('deposit'); setPaymentStep('input'); }} className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Add Cash</button>
                <button onClick={() => { setWalletView('withdraw'); setPaymentStep('input'); }} className="flex-1 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">Withdraw</button>
              </div>
            </div>

            {(walletView === 'deposit' || walletView === 'withdraw') && (
              <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 animate-in zoom-in-95 shadow-2xl relative">
                <button onClick={resetWallet} className="text-slate-500 flex items-center gap-2 mb-6 hover:text-white transition-all"><ArrowLeft className="w-4 h-4" /> <span className="text-[10px] font-black uppercase">Back</span></button>

                {walletView === 'deposit' ? (
                  paymentStep === 'input' ? (
                    <div className="space-y-6 text-center">
                      <h3 className="text-xl font-black uppercase tracking-tight">Recharge Wallet</h3>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-2xl">₹</span>
                        <input type="number" value={inputAmount} onChange={e => setInputAmount(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl py-6 pl-12 font-black text-3xl outline-none focus:border-indigo-600 transition-all" placeholder="100" />
                      </div>
                      {inputAmount && parseFloat(inputAmount) >= 100 && (
                        <div className="bg-slate-800/50 p-4 rounded-2xl text-left flex justify-between items-center border border-slate-700">
                           <div className="flex items-center gap-2"><Info className="w-4 h-4 text-indigo-400" /><p className="text-[10px] font-bold text-slate-400 uppercase">Settlement (After 2% Tax):</p></div>
                           <p className="font-black text-emerald-400 text-lg">₹{(parseFloat(inputAmount) * 0.98).toFixed(2)}</p>
                        </div>
                      )}
                      <button onClick={() => setPaymentStep('qr')} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-500 transition-all">Proceed to Pay</button>
                    </div>
                  ) : paymentStep === 'qr' ? (
                    <div className="flex flex-col items-center gap-6 text-center animate-in fade-in">
                      <div className="w-full max-w-[260px] bg-white rounded-3xl p-8 border-4 border-[#6739b7] shadow-2xl flex flex-col items-center">
                        <div className="w-10 h-10 bg-[#6739b7] rounded-full flex items-center justify-center mb-4"><span className="text-white font-black">पे</span></div>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=vinayrajsandhya@ybl&am=${inputAmount}&cu=INR`} className="w-36 h-36 mb-6" alt="QR" />
                        <p className="text-slate-900 font-black text-xs uppercase tracking-tight">{ADMIN_NAME}</p>
                      </div>
                      <button onClick={handlePaidAction} className="w-full py-5 bg-[#25D366] rounded-2xl font-black uppercase shadow-xl hover:brightness-110 active:scale-95 transition-all">I HAVE PAID</button>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Wait 5s for auto-verification after payment</p>
                    </div>
                  ) : paymentStep === 'verifying' ? (
                    <div className="text-center space-y-8 py-10 animate-in fade-in">
                      <div className="relative w-28 h-28 mx-auto">
                        <Loader2 className="w-28 h-28 text-indigo-500 animate-spin absolute top-0 left-0" />
                        <div className="absolute inset-0 flex items-center justify-center font-black text-3xl">{countdown}</div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black uppercase tracking-widest">Secure Verifying</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Validating transaction with node server...</p>
                      </div>
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left shadow-inner">
                         <p className="text-[10px] text-slate-500 uppercase mb-2 font-black tracking-widest">Order Details</p>
                         <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-slate-400">Total:</span><span className="text-xs font-black">₹{inputAmount}</span></div>
                         <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1"><span className="text-xs font-bold text-slate-400">Crediting:</span><span className="text-xs font-black text-emerald-400">₹{currentPendingTx?.amount.toFixed(2)}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-8 py-10 animate-in zoom-in-95">
                       <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                       </div>
                       <div className="space-y-2">
                         <h4 className="text-2xl font-black uppercase text-emerald-400 tracking-tight">Wallet Recharged</h4>
                         <p className="text-sm font-bold text-slate-300">₹{currentPendingTx?.amount.toFixed(2)} added to your ID</p>
                       </div>
                       <button onClick={resetWallet} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Back to Lobby</button>
                    </div>
                  )
                ) : (
                  <div className="space-y-6 text-center">
                    <h3 className="text-xl font-black uppercase tracking-tight">Request Withdrawal</h3>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-rose-500 font-black text-2xl">₹</span>
                      <input type="number" value={inputAmount} onChange={e => setInputAmount(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl py-6 pl-12 font-black text-3xl outline-none focus:border-rose-600 transition-all" placeholder="0.00" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Admin handles all withdrawals via WhatsApp</p>
                    <button onClick={handleWithdrawRequest} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <MessageSquare className="w-5 h-5" /> Message Owner Vinay
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 bg-slate-800/10 px-6"><h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Transaction History</h4></div>
              <div className="divide-y divide-slate-800/50">
                {currentUser.transactions.length > 0 ? currentUser.transactions.map(tx => (
                  <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-800/30 px-6 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{tx.type === 'deposit' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}</div>
                      <div><p className="font-black text-xs text-slate-200 uppercase">{tx.type}</p><p className="text-[8px] text-slate-500 font-bold uppercase">{new Date(tx.timestamp).toLocaleString()}</p></div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-sm ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>₹{tx.amount.toFixed(2)}</p>
                      <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{tx.status}</span>
                    </div>
                  </div>
                )) : <div className="py-20 text-center opacity-20"><History className="w-10 h-10 mx-auto mb-3" /><p className="text-[10px] font-black uppercase tracking-widest">No Recent Activity</p></div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-xl mx-auto space-y-4">
             <h2 className="text-lg font-black uppercase flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500" /> Active Bets</h2>
              {currentUser?.bets.length ? currentUser.bets.map(bet => (
                <div key={bet.id} className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 flex justify-between items-center border-l-8 border-l-indigo-600 shadow-xl">
                  <div><h4 className="font-black uppercase text-xs truncate max-w-[180px]">{bet.matchTitle}</h4><p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Pick: {bet.selection} • Stake: ₹{bet.amount}</p></div>
                  <div className="text-right"><p className="text-sm font-black text-emerald-400">₹{(bet.amount * bet.odds).toFixed(0)}</p><span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Running</span></div>
                </div>
              )) : <div className="py-32 text-center opacity-20"><Activity className="w-12 h-12 mx-auto mb-3" /><p className="text-xs font-black uppercase tracking-widest">No Pending Stakes</p></div>}
          </div>
        )}

        {activeTab === 'control' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[40px] flex items-center justify-between">
              <div><h3 className="font-black text-xl uppercase tracking-tighter">Admin Bridge</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Shared Database for Remote Panels</p></div>
              <Database className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
               <div className="p-5 border-b border-slate-800 bg-slate-800/10 px-8 flex justify-between items-center">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Accounts ({allUsers.length})</h4>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[8px] font-black uppercase text-emerald-500">Sync Active</span></div>
               </div>
               <div className="divide-y divide-slate-800/50">
                  {allUsers.map(u => (
                    <div key={u.id} className="p-5 flex items-center justify-between px-8 hover:bg-slate-800/20 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center font-black text-indigo-500 border border-slate-800 text-xs">{u.id.split('-')[1]?.charAt(0) || 'U'}</div>
                          <div><p className="font-black text-xs uppercase text-slate-200">{u.name}</p><p className="text-[8px] font-bold text-slate-500">ID: {u.id}</p></div>
                       </div>
                       <div className="text-right">
                         <p className="font-black text-sm text-emerald-400">₹{u.balance.toFixed(2)}</p>
                         <p className="text-[7px] font-black text-slate-600 uppercase">{u.bets.length} ACTIVE</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="p-6 bg-slate-800/20 rounded-3xl border border-slate-800">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Notice for Control App</p>
               <p className="text-[10px] font-medium text-slate-400 italic">Your separate admin app should read 'bet_sphere_users' from localStorage to manage these accounts remotely.</p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 flex justify-around p-4 z-50 rounded-t-[32px] shadow-2xl">
        <NavBtn icon={<Zap />} active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} />
        <NavBtn icon={<Gamepad2 />} active={activeTab === 'games'} onClick={() => setActiveTab('games')} />
        <NavBtn icon={<Wallet />} active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
        <NavBtn icon={<History />} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavBtn icon={<UserPlus />} active={activeTab === 'control'} onClick={() => setActiveTab('control')} />
      </nav>
    </div>
  );
};

const NavBtn = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`p-4 rounded-2xl transition-all relative ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-2' : 'text-slate-500 hover:text-white'}`}>
    {React.cloneElement(icon, { className: 'w-6 h-6' })}
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>}
  </button>
);

export default App;
