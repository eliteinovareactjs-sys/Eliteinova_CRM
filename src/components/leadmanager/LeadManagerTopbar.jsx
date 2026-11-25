// src/components/leadmanager/LeadManagerTopbar.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, ChevronDown, LogOut, Search, Settings, User,
  Building2, AlertTriangle, Phone, Users, Megaphone, FileText,
  Target, Command, Bookmark, BarChart3, Inbox, CheckSquare,
  UserCheck // <-- Added missing import
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LeadManagerTopbar({ onMenuClick }) {
  const { user, logout, activeWebsite } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const notifications = [
    { id: 1, icon: AlertTriangle, color: 'bg-rose-50 text-rose-500', title: '12 overdue follow-ups need attention', time: '5 min ago', to: '/leadmanager/followups' },
    { id: 2, icon: Inbox, color: 'bg-violet-50 text-brand-purple', title: '15 new unassigned leads in Inbox', time: '12 min ago', to: '/leadmanager/inbox' },
    { id: 3, icon: Phone, color: 'bg-emerald-50 text-emerald-500', title: 'Agent Ravi completed 25 calls', time: '1 hr ago', to: '/leadmanager/reports' },
  ];
  const unreadCount = notifications.length;

  const searchResults = [
    { icon: Users, label: 'All Leads', to: '/leadmanager/leads' },
    { icon: Inbox, label: 'Lead Inbox', to: '/leadmanager/inbox' },
    { icon: UserCheck, label: 'Lead Assignment', to: '/leadmanager/assignment' },
    { icon: Phone, label: 'Lead Calling', to: '/leadmanager/calling' },
    { icon: CheckSquare, label: 'Follow-ups', to: '/leadmanager/followups' },
    { icon: BarChart3, label: 'Lead Reports', to: '/leadmanager/reports' },
  ];

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-lilac bg-white/95 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-brand-ink/60 transition-colors hover:bg-brand-lilac md:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-magenta text-[10px] font-bold text-white">
            {(activeWebsite?.name || user?.name || 'LM').slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="font-display text-sm font-bold leading-tight text-brand-ink">
              {activeWebsite?.name || user?.name || 'Lead Manager'}
            </p>
            <p className="text-[10px] leading-tight text-brand-ink/50">
              <span className="font-semibold">Role:</span> Lead Manager
              <span className="mx-1.5">•</span>
              <span className="font-semibold">Status:</span> Active
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => {
              setSearchOpen((s) => !s);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="hidden items-center gap-2 rounded-xl border border-brand-lilac bg-white px-3 py-2 text-xs text-brand-ink/50 transition-all hover:border-brand-purple/40 hover:text-brand-ink md:flex"
          >
            <Search size={14} />
            <span>Search...</span>
            <span className="ml-4 flex items-center gap-0.5 rounded border border-brand-lilac bg-brand-mist/60 px-1.5 py-0.5 text-[9px] font-bold text-brand-ink/50">
              <Command size={8} />K
            </span>
          </button>

          <button
            onClick={() => {
              setSearchOpen((s) => !s);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="rounded-lg p-2 text-brand-ink/60 transition-colors hover:bg-brand-lilac md:hidden"
          >
            <Search size={20} />
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-brand-lilac bg-white shadow-panel animate-dropdown">
              <div className="border-b border-brand-lilac/60 p-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
                  <input
                    ref={searchInputRef}
                    placeholder="Search pages, leads, agents..."
                    className="w-full rounded-lg border border-brand-lilac/60 bg-brand-mist/40 py-2 pl-9 pr-8 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15"
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto p-1">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">
                  Quick Navigate
                </p>
                {searchResults.map(({ icon: Icon, label, to }) => (
                  <button
                    key={label}
                    onClick={() => {
                      navigate(to);
                      setSearchOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-brand-ink/70 transition-colors hover:bg-brand-lilac/40 hover:text-brand-purple"
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((n) => !n);
              setProfileOpen(false);
            }}
            className="relative rounded-full p-2 text-brand-ink/60 transition-colors hover:bg-brand-lilac"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <>
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-magenta text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
                <span className="absolute -right-0.5 -top-0.5 h-4 w-4 animate-ping rounded-full bg-brand-magenta/60" />
              </>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-brand-lilac bg-white shadow-panel animate-dropdown">
              <div className="flex items-center justify-between border-b border-brand-lilac/60 px-4 py-3">
                <h3 className="font-display text-sm font-semibold text-brand-ink">
                  Notifications
                </h3>
                <span className="rounded-full bg-brand-lilac px-2 py-0.5 text-[10px] font-semibold text-brand-purple">
                  {unreadCount} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        navigate(n.to);
                        setNotifOpen(false);
                      }}
                      className="flex w-full items-start gap-3 border-b border-brand-lilac/40 px-4 py-3 text-left transition-colors hover:bg-brand-mist/60"
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.color}`}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-brand-ink">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-brand-ink/40">
                          {n.time}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-brand-lilac/60 p-2">
                <button
                  onClick={() => {
                    navigate('/leadmanager/dashboard');
                    setNotifOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-brand-purple hover:bg-brand-lilac/40"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen((p) => !p);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-brand-lilac"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-magenta text-xs font-bold text-white shadow-sm">
              {user?.avatar || 'LM'}
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight text-brand-ink">
                {user?.name || 'Lead Manager'}
              </p>
              <p className="text-[10px] leading-tight text-brand-ink/50">
                Lead Manager
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`hidden text-brand-ink/40 transition-transform duration-300 sm:block ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-brand-lilac bg-white shadow-panel animate-dropdown">
              <div className="border-b border-brand-lilac/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-magenta text-sm font-bold text-white">
                    {user?.avatar || 'LM'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-ink">
                      {user?.name || 'Lead Manager'}
                    </p>
                    <p className="truncate text-[10px] text-brand-ink/50">
                      {user?.username || 'leadmanager'}
                    </p>
                    <span className="mt-0.5 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-brand-purple">
                      LEAD MANAGER
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1">
                {[
                  { icon: User, label: 'My Account', to: '/leadmanager/account' },
                ].map(({ icon: Icon, label, to }) => (
                  <button
                    key={label}
                    onClick={() => {
                      navigate(to);
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-brand-ink/70 transition-colors hover:bg-brand-lilac/40"
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="border-t border-brand-lilac/60 p-1">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropdown {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdown { animation: dropdown 0.18s ease-out forwards; }
      `}</style>
    </header>
  );
}