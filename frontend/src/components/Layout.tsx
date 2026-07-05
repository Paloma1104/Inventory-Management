import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ArrowLeftRight,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  MessageCircle,
  TrendingDown,
  Minimize2,
  Send,
  Bot,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/blucursor-logo.png';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/products', label: 'Products', icon: Package, adminOnly: true },
  { to: '/inventory', label: 'Inventory', userLabel: 'View Inventory', icon: Boxes },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, adminOnly: true },
  { to: '/predictive-runways', label: 'Stock Prediction', icon: TrendingDown, adminOnly: true },
  { to: '/chatbot', label: 'AI Chatbot', icon: MessageCircle },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { name, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Floating chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        const triggerBtn = document.getElementById('chat-trigger-btn');
        if (triggerBtn && triggerBtn.contains(event.target as Node)) {
          return;
        }
        setIsChatOpen(false);
      }
    }
    if (isChatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChatOpen]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msgText = chatInput;
    setMessages((prev) => [...prev, { role: 'user', text: msgText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: msgText }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, I ran into an issue connecting to the AI helper.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F7FAFC]">
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 h-full bg-[#002B49] z-40 transition-all duration-300 ease-in-out ${isHovered ? 'w-64' : 'w-20'
          } flex flex-col shadow-elevated group overflow-x-hidden`}
      >
        <div className="flex h-16 items-center justify-center group-hover:justify-start gap-3 border-b border-white/10 px-4 group-hover:px-6 transition-all duration-300 overflow-hidden shrink-0">
          <img src={logo} alt="BluCursor logo" className="h-8 w-8 rounded-full object-cover shrink-0" />
          <span className={`text-lg font-bold text-white tracking-[0.04em] transition-opacity duration-200 whitespace-nowrap overflow-hidden ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
            BluCursor Inventory
          </span>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-2 py-4">
          {navItems.filter((item) => isAdmin || !item.adminOnly).map(({ to, label, userLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 rounded-lg px-3.5 group-hover:px-3 py-2.5 text-sm font-medium transition-all duration-300 ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                {!isAdmin && userLabel ? userLabel : label}
              </span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 rounded-lg px-3.5 group-hover:px-3 py-2.5 text-sm font-medium text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
              Logout
            </span>
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 px-1 group-hover:px-2 transition-all duration-300 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold shrink-0 border border-white/20">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
              <p className="text-sm font-medium text-white leading-tight">{name}</p>
              <p className="text-xs text-white/50">{role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className={`flex-1 min-h-screen bg-[#F7FAFC] p-8 transition-all duration-300 ease-in-out ${isHovered ? 'pl-72' : 'pl-28'
        }`}>
        <Outlet />
      </main>

      {/* Persistent Floating Chatbot Icon & Small Window */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Small Interactive Chatbot Window */}
        {isChatOpen && (
          <div ref={chatRef} className="mb-4 flex h-[450px] w-80 flex-col rounded-2xl border border-surface-border bg-white shadow-2xl overflow-hidden sm:w-96 transition-all duration-300 transform scale-100 origin-bottom-right">
            {/* Header */}
            <div className="flex h-14 items-center justify-between bg-[#002B49] px-4 text-white">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white/10 p-1.5 animate-pulse">
                  <Sparkles className="h-4 w-4 text-primary-light" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">BluCursor Assistant</p>
                  <p className="text-[10px] text-white/60">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/10 transition"
                title="Minimize chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7FAFC]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="rounded-full bg-primary-light p-4 text-primary mb-3">
                    <Bot className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-navy">Hi, I'm BluCursor AI!</p>
                  <p className="text-xs text-navy-secondary mt-1">Ask me anything about products, current stock levels, users, or general statistics.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none shadow-sm'
                      : 'bg-white text-navy border border-surface-border rounded-bl-none shadow-sm'
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-surface-border px-4 py-2 text-xs text-navy-secondary shadow-sm">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Footer */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
              className="flex items-center gap-2 border-t border-surface-border bg-white p-3 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask inventory assistant..."
                className="block w-full rounded-lg border border-surface-border bg-[#F7FAFC] px-3.5 py-2 text-sm text-navy placeholder:text-navy-secondary/50 focus:border-primary focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Chat Trigger Button */}
        <button
          id="chat-trigger-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-elevated transition duration-300 hover:scale-110 hover:-rotate-6 hover:shadow-2xl focus:outline-none ${isChatOpen ? 'bg-accent' : 'bg-primary'
            }`}
          title="Chat with Assistant"
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}
