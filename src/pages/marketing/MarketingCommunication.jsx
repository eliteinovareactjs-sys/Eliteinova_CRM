// src/pages/marketing/MarketingCommunication.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquare, Mail, Send, CheckCircle2, XCircle, Clock, X, Search,
  Filter, ChevronDown, Eye, Pencil, Trash2, Copy,
  FileText, Plus, AlertCircle, MessageCircle,
  Check, Bell,
  Sparkles, Repeat, Megaphone, CreditCard, CalendarClock,
  Grid3x3, List,
  AtSign, History, Smartphone, LayoutTemplate
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CHANNELS = ['SMS', 'WhatsApp', 'Email'];

const TEMPLATE_CATEGORIES = [
  { key: 'Welcome',       label: 'Welcome',       icon: Sparkles,      tone: 'purple',  desc: 'New customer greetings' },
  { key: 'Follow-up',     label: 'Follow-up',     icon: Repeat,        tone: 'amber',   desc: 'Keep leads engaged' },
  { key: 'Appointment',   label: 'Appointment',   icon: CalendarClock, tone: 'emerald', desc: 'Meeting confirmations' },
  { key: 'Payment',       label: 'Payment',       icon: CreditCard,    tone: 'cyan',    desc: 'Invoices & reminders' },
  { key: 'Campaign',      label: 'Campaign',      icon: Megaphone,     tone: 'rose',    desc: 'Bulk outreach messages' },
  { key: 'Notifications', label: 'Notifications', icon: Bell,          tone: 'amber',   desc: 'System & event alerts' },
  { key: 'Other',         label: 'Other',         icon: FileText,      tone: 'slate',   desc: 'Misc templates' },
];

const TABS = [
  { key: 'sms',           label: 'SMS',           icon: Smartphone },
  { key: 'whatsapp',      label: 'WhatsApp',      icon: MessageCircle },
  { key: 'email',         label: 'Email',         icon: Mail },
  { key: 'templates',     label: 'Templates',     icon: LayoutTemplate },
  { key: 'history',       label: 'History',       icon: History },
];

const VARIABLES = [
  { key: '{{name}}',    label: 'Customer name' },
  { key: '{{mobile}}',  label: 'Mobile number' },
  { key: '{{agent}}',   label: 'Agent name' },
  { key: '{{date}}',    label: 'Date' },
  { key: '{{time}}',    label: 'Time' },
  { key: '{{project}}', label: 'Project name' },
  { key: '{{sender}}',  label: 'Sender name' },
  { key: '{{amount}}',  label: 'Payment amount' },
];

const STATUS_STYLES = {
  Delivered: { chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Read:      { chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Opened:    { chip: 'bg-violet-100 text-brand-purple border-violet-200',  dot: 'bg-brand-purple', icon: CheckCircle2 },
  Sent:      { chip: 'bg-cyan-100 text-cyan-700 border-cyan-200',           dot: 'bg-cyan-500',   icon: Send },
  Pending:   { chip: 'bg-amber-100 text-amber-700 border-amber-200',        dot: 'bg-amber-500',  icon: Clock },
  Failed:    { chip: 'bg-rose-100 text-rose-700 border-rose-200',           dot: 'bg-rose-500',   icon: XCircle },
};

const TONE_CLASSES = {
  purple:  { chip: 'bg-violet-100 text-brand-purple',  icon: 'bg-violet-100 text-brand-purple',  dot: 'bg-brand-purple' },
  emerald: { chip: 'bg-emerald-100 text-emerald-600',  icon: 'bg-emerald-100 text-emerald-600',  dot: 'bg-emerald-500' },
  amber:   { chip: 'bg-amber-100 text-amber-600',      icon: 'bg-amber-100 text-amber-600',      dot: 'bg-amber-500' },
  rose:    { chip: 'bg-rose-100 text-brand-magenta',   icon: 'bg-rose-100 text-brand-magenta',   dot: 'bg-brand-magenta' },
  cyan:    { chip: 'bg-cyan-100 text-cyan-600',        icon: 'bg-cyan-100 text-cyan-600',        dot: 'bg-cyan-500' },
  slate:   { chip: 'bg-slate-100 text-slate-600',      icon: 'bg-slate-100 text-slate-600',      dot: 'bg-slate-500' },
};

const MOCK_TEMPLATES = [
  { id: 'tpl-1', name: 'Welcome Message', channel: 'WhatsApp', category: 'Welcome', body: 'Hi {{name}}, welcome to {{project}}! We are glad to have you with us.', status: 'Active', updatedAt: '2 days ago' },
  { id: 'tpl-2', name: 'Campaign Invitation', channel: 'Email', category: 'Campaign', body: 'Hello {{name}},\n\nWe are excited to invite you to our upcoming exclusive event. Join us for a special evening of networking and insights.\n\nBest,\n{{sender}}', status: 'Active', updatedAt: '5 days ago' },
  { id: 'tpl-3', name: 'Promotional Message', channel: 'SMS', category: 'Campaign', body: 'Get 20% off on your next purchase! Use code {{name}} at checkout. Valid till {{date}}.', status: 'Draft', updatedAt: '1 week ago' },
  { id: 'tpl-4', name: 'Event Invitation', channel: 'Email', category: 'Appointment', body: 'Dear {{name}},\n\nYou are cordially invited to our annual gala on {{date}} at {{time}}. We look forward to your presence.\n\nRegards,\n{{agent}}', status: 'Active', updatedAt: '3 days ago' },
  { id: 'tpl-5', name: 'Follow-up Message', channel: 'WhatsApp', category: 'Follow-up', body: 'Hi {{name}}, just checking in to see if you had any questions about the {{project}} we discussed. Let me know!', status: 'Active', updatedAt: 'Yesterday' },
  { id: 'tpl-6', name: 'Offer Notification', channel: 'SMS', category: 'Campaign', body: 'Hi {{name}}, your exclusive offer expires in 24 hours! Click here to claim now: {{project}}', status: 'Active', updatedAt: '4 days ago' },
  { id: 'tpl-7', name: 'Product/Service Info', channel: 'Email', category: 'Notifications', body: 'Hi {{name}},\n\nHere is the information you requested about our {{project}} services. Let us know if you need anything else.\n\nBest,\n{{sender}}', status: 'Active', updatedAt: '2 weeks ago' },
  { id: 'tpl-8', name: 'Customer Acknowledgement', channel: 'WhatsApp', category: 'Other', body: 'Thank you for your purchase, {{name}}! Your order is confirmed. We will notify you when it ships.', status: 'Active', updatedAt: '1 day ago' },
];

const MOCK_HISTORY = [
  { id: 'MSG-1001', to: 'Ravi Sharma', channel: 'WhatsApp', template: 'Welcome Message', status: 'Delivered', date: '25 Oct 2026, 10:30 AM' },
  { id: 'MSG-1002', to: 'Anita Desai', channel: 'Email', template: 'Campaign Invitation', status: 'Opened', date: '25 Oct 2026, 09:15 AM' },
  { id: 'MSG-1003', to: 'Kiran Rao', channel: 'SMS', template: 'Promotional Message', status: 'Delivered', date: '24 Oct 2026, 04:45 PM' },
  { id: 'MSG-1004', to: 'Priya Menon', channel: 'Email', template: 'Event Invitation', status: 'Sent', date: '24 Oct 2026, 02:30 PM' },
  { id: 'MSG-1005', to: 'Self', channel: 'WhatsApp', template: 'Follow-up Message', status: 'Delivered', date: '24 Oct 2026, 11:00 AM' },
  { id: 'MSG-1006', to: 'Amit Patel', channel: 'SMS', template: 'Offer Notification', status: 'Failed', date: '23 Oct 2026, 06:20 PM' },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const renderPreview = (text) =>
  text
    .replace(/\{\{name\}\}/g, 'John Doe')
    .replace(/\{\{mobile\}\}/g, '+91 9876543210')
    .replace(/\{\{agent\}\}/g, 'Ravi Kumar')
    .replace(/\{\{date\}\}/g, '25 Oct 2026')
    .replace(/\{\{time\}\}/g, '11:00 AM')
    .replace(/\{\{project\}\}/g, 'Matrimony CRM')
    .replace(/\{\{sender\}\}/g, 'Eliteinova')
    .replace(/\{\{amount\}\}/g, '₹2,500');

const findCategory = (key) =>
  TEMPLATE_CATEGORIES.find((c) => c.key === key) ||
  TEMPLATE_CATEGORIES[TEMPLATE_CATEGORIES.length - 1];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingCommunication() {
  const [tab, setTab] = useState('whatsapp');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Templates & History State
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [history, setHistory] = useState(MOCK_HISTORY);
  
  // Modals & Interactions
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendPrefill, setSendPrefill] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // KPI State
  const [activeKpi, setActiveKpi] = useState('whatsapp');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  const handleCopy = async (text) => {
      try {
          if (!navigator.clipboard?.writeText) {
              throw new Error('Clipboard not available');
          }
          await navigator.clipboard.writeText(text);
          showToast('Copied successfully!', 'success');
      } catch (error) {
          showToast('Unable to copy. Please copy manually.', 'error');
      }
  };

  /* ── Derived Data ── */
  const summary = useMemo(() => {
    const total = history.length;
    const sms = history.filter((m) => m.channel === 'SMS').length;
    const whatsapp = history.filter((m) => m.channel === 'WhatsApp').length;
    const email = history.filter((m) => m.channel === 'Email').length;
    const delivered = history.filter((m) => m.status === 'Delivered' || m.status === 'Read' || m.status === 'Opened').length;
    const failed = history.filter((m) => m.status === 'Failed').length;
    const pending = history.filter((m) => m.status === 'Pending' || m.status === 'Sent').length;
    return { total, sms, whatsapp, email, delivered, failed, pending, templates: templates.length };
  }, [history, templates]);

  // ✅ FIXED: Only filter by channel if we aren't on the 'templates' or 'history' tabs
  const baseTemplates = useMemo(() => {
    if (tab === 'templates' || tab === 'history') return templates;
    const targetChannel = tab === 'sms' ? 'SMS' : tab === 'whatsapp' ? 'WhatsApp' : 'Email';
    return templates.filter((t) => t.channel === targetChannel);
  }, [templates, tab]);

  // ✅ FIXED: Apply category and search filters on top of the base channel
  const filteredTemplates = useMemo(() => {
    let rows = [...baseTemplates];
    if (categoryFilter !== 'All') rows = rows.filter((t) => t.category === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((t) => `${t.name} ${t.body} ${t.category}`.toLowerCase().includes(q));
    }
    return rows;
  }, [baseTemplates, categoryFilter, searchQuery]);

  // ✅ FIXED: Calculate category counts based on the current channel tab
  const categoryCounts = useMemo(() => {
    const counts = { All: baseTemplates.length };
    TEMPLATE_CATEGORIES.forEach((c) => {
      counts[c.key] = baseTemplates.filter((t) => t.category === c.key).length;
    });
    return counts;
  }, [baseTemplates]);

  const filteredHistory = useMemo(() => {
    let rows = [...history];
    if (tab === 'history') {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        rows = rows.filter((m) => `${m.to} ${m.template} ${m.channel}`.toLowerCase().includes(q));
      }
    }
    return rows;
  }, [history, searchQuery, tab]);

  const tabCounts = useMemo(() => ({
    sms: templates.filter((t) => t.channel === 'SMS').length,
    whatsapp: templates.filter((t) => t.channel === 'WhatsApp').length,
    email: templates.filter((t) => t.channel === 'Email').length,
    templates: templates.length,
    history: history.length,
  }), [templates, history]);

  /* ── Handlers ── */
 const handleTabClick = (tab) => {
    setActiveTab(tab);
    setActiveKpi(tab);
    setSearch('');
    setSelectedCategory('All');
};

  const handleSaveTemplate = (data) => {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => t.id === editingTemplate.id ? { ...t, ...data, updatedAt: today } : t));
      showToast('Template updated');
    } else {
      const newT = { id: 'tpl-' + Date.now(), ...data, status: 'Active', updatedAt: today };
      setTemplates((prev) => [newT, ...prev]);
      showToast('Template created');
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((x) => x.id !== id));
    setConfirmDelete(null);
    showToast('Template deleted', 'error');
  };

  const handleOpenSend = (prefill = null) => {
    setSendPrefill(prefill);
    setShowSendModal(true);
  };

  const handleSend = (data) => {
    const newMessage = {
      id: 'MSG-' + String(Date.now()).slice(-4),
      to: data.to,
      channel: data.channel,
      template: data.templateName || 'Custom Message',
      status: 'Sent',
      date: new Date().toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }),
    };
    setHistory((prev) => [newMessage, ...prev]);
    setShowSendModal(false);
    setSendPrefill(null);
    showToast(`${data.channel} sent to ${data.to}`);
  };

  const hasFilters = searchQuery || categoryFilter !== 'All';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FDF8FE] via-white to-[#FBF3FF]">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-magenta/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-brand-purple/[0.05] blur-3xl" />

      <div className="relative space-y-5 px-1 py-1 pb-40">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">Marketing Communication</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <MessageSquare size={13} className="text-brand-magenta" />
              Engage customers through multiple channels
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => handleOpenSend()}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(227,28,121,0.6)] transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              <Send size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /> Send Message
            </button>
          </div>
        </div>

        {/* KPI STRIP - 5 CHANNELS */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Channel Overview</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">Communication Snapshot</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <KpiCard 
              icon={Send} 
              label="Total Messages" 
              value={summary.total} 
              sub="Across all channels" 
              color="purple" 
              active={activeKpi === 'messages'} 
              onClick={() => {}} 
              delay={0} 
            />
            <KpiCard 
              icon={Mail} 
              label="Email" 
              value={summary.email} 
              sub="Campaigns & updates" 
              color="rose" 
              active={activeKpi === 'email'} 
              onClick={() => { setActiveKpi('email'); setTab('email'); }} 
              delay={40} 
            />
            <KpiCard 
              icon={MessageCircle} 
              label="WhatsApp" 
              value={summary.whatsapp} 
              sub="Direct engagement" 
              color="emerald" 
              active={activeKpi === 'whatsapp'} 
              onClick={() => { setActiveKpi('whatsapp'); setTab('whatsapp'); }} 
              delay={80} 
            />
            <KpiCard 
              icon={Smartphone} 
              label="SMS" 
              value={summary.sms} 
              sub="Instant alerts" 
              color="purple" 
              active={activeKpi === 'sms'} 
              onClick={() => { setActiveKpi('sms'); setTab('sms'); }} 
              delay={120} 
            />
            <KpiCard 
              icon={History} 
              label="History" 
              value={summary.total} 
              sub="View all logs" 
              color="cyan" 
              active={activeKpi === 'history'} 
              onClick={() => { setActiveKpi('history'); setTab('history'); }} 
              delay={160} 
            />
          </div>
        </div>

        {/* TABS */}
        <div className="card !p-2">
          <div className="flex flex-wrap items-center gap-1">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              const count = tabCounts[key];
              return (
                <button
                  key={key}
                  onClick={() => handleTabClick(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] scale-[1.02]'
                      : 'text-brand-ink/60 hover:bg-brand-lilac/50 hover:text-brand-magenta'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  {count != null && count > 0 && (
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-brand-lilac/70 text-brand-purple'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tab === 'history' ? 'Search by recipient or template…' : 'Search templates…'}
              className="w-full rounded-full border border-brand-lilac bg-white py-2.5 pl-11 pr-10 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-brand-lilac">
                <X size={14} className="text-brand-ink/50" />
              </button>
            )}
          </div>

          {tab !== 'history' && (
            <DropdownFilter
              label="Category" icon={Filter} value={categoryFilter}
              options={['All', ...TEMPLATE_CATEGORIES.map((c) => c.key)]}
              displayValue={(v) => (v === 'All' ? 'All' : findCategory(v).label)}
              open={categoryOpen}
              onToggle={() => setCategoryOpen((s) => !s)}
              onChange={(v) => { setCategoryFilter(v); setCategoryOpen(false); }}
            />
          )}

          {tab !== 'history' && (
            <div className="flex items-center gap-1 rounded-full border border-brand-lilac bg-white p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-full p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-magenta/10 text-brand-magenta' : 'text-brand-ink/50 hover:bg-brand-lilac/30'}`}
                title="Grid view"
              >
                <Grid3x3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-full p-1.5 transition-colors ${viewMode === 'list' ? 'bg-brand-magenta/10 text-brand-magenta' : 'text-brand-ink/50 hover:bg-brand-lilac/30'}`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
          )}

          {hasFilters && (
            <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }} className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-100">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* CATEGORY CHIPS (Now correctly calculating based on selected channel) */}
        {tab !== 'history' && (
          <div className="card !p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/40">Quick filter:</span>
              <button
                onClick={() => setCategoryFilter('All')}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  categoryFilter === 'All'
                    ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta ring-1 ring-brand-magenta/30'
                    : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'
                }`}
              >
                All ({categoryCounts['All']})
              </button>
              {TEMPLATE_CATEGORIES.map((c) => {
                const count = categoryCounts[c.key] || 0;
                const active = categoryFilter === c.key;
                const Icon = c.icon;
                const tone = TONE_CLASSES[c.tone];
                return (
                  <button
                    key={c.key}
                    onClick={() => setCategoryFilter(c.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      active ? `border-brand-magenta ${tone.chip} ring-1 ring-brand-magenta/30` : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'
                    }`}
                  >
                    <Icon size={11} />
                    {c.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? 'bg-white/70' : 'bg-brand-lilac/70 text-brand-purple'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="space-y-4">
          
          {/* Templates View */}
          {tab !== 'history' && (
            <TemplatesView
              templates={filteredTemplates}
              viewMode={viewMode}
              onView={setViewingTemplate}
              onEdit={(t) => { setEditingTemplate(t); setShowTemplateModal(true); }}
              onDelete={setConfirmDelete}
              onCopy={(t) => handleCopy(t.id, t.body)}
              onUse={(t) => handleOpenSend({ channel: t.channel, message: t.body, templateName: t.name })}
              copiedId={copiedId}
              onCreate={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
            />
          )}

          {/* History View */}
          {tab === 'history' && (
            <HistoryView
              messages={filteredHistory}
              viewMode={viewMode}
            />
          )}

        </div>

        {/* MODALS & DRAWERS */}
        {showTemplateModal && (
          <TemplateModal
            mode={editingTemplate ? 'edit' : 'create'}
            initial={editingTemplate || { channel: tab === 'sms' ? 'SMS' : tab === 'whatsapp' ? 'WhatsApp' : 'Email' }}
            onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
            onSubmit={handleSaveTemplate}
          />
        )}

        {viewingTemplate && (
          <TemplateDetailsDrawer
            template={viewingTemplate}
            onClose={() => setViewingTemplate(null)}
            onEdit={() => { setEditingTemplate(viewingTemplate); setViewingTemplate(null); setShowTemplateModal(true); }}
            onCopy={() => handleCopy(viewingTemplate.id, viewingTemplate.body)}
            onUse={() => { handleOpenSend({ channel: viewingTemplate.channel, message: viewingTemplate.body, templateName: viewingTemplate.name }); setViewingTemplate(null); }}
          />
        )}

        {showSendModal && (
          <SendMessageModal
            prefill={sendPrefill}
            templates={templates}
            onClose={() => { setShowSendModal(false); setSendPrefill(null); }}
            onSend={handleSend}
          />
        )}

        {confirmDelete && (
          <ConfirmDialog
            title="Delete template?"
            message={`This will permanently delete the template "${confirmDelete.name}".`}
            confirmLabel="Delete Template"
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleDeleteTemplate(confirmDelete.id)}
          />
        )}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, color = 'purple', active, onClick, delay = 0 }) {
  const displayValue = useAnimatedCount(value);
  const themes = {
    purple:  { border: 'border-violet-200 hover:border-violet-400', bg: 'from-violet-50 via-violet-50/30 to-white', iconBg: 'bg-violet-100 text-brand-purple border-violet-200', bar: 'from-brand-purple to-brand-magenta', glow: 'bg-brand-purple/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(139,47,214,0.45)]', valueColor: 'text-brand-purple', ring: 'ring-violet-300' },
    emerald: { border: 'border-emerald-200 hover:border-emerald-400', bg: 'from-emerald-50 via-emerald-50/30 to-white', iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200', bar: 'from-emerald-500 to-emerald-400', glow: 'bg-emerald-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.4)]', valueColor: 'text-emerald-600', ring: 'ring-emerald-300' },
    amber:   { border: 'border-amber-200 hover:border-amber-400', bg: 'from-amber-50 via-amber-50/30 to-white', iconBg: 'bg-amber-100 text-amber-600 border-amber-200', bar: 'from-amber-500 to-orange-400', glow: 'bg-amber-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(245,158,11,0.4)]', valueColor: 'text-amber-600', ring: 'ring-amber-300' },
    rose:    { border: 'border-rose-200 hover:border-rose-400', bg: 'from-rose-50 via-rose-50/30 to-white', iconBg: 'bg-rose-100 text-brand-magenta border-rose-200', bar: 'from-brand-magenta to-brand-purple', glow: 'bg-brand-magenta/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(227,28,121,0.45)]', valueColor: 'text-brand-magenta', ring: 'ring-rose-300' },
    cyan:    { border: 'border-cyan-200 hover:border-cyan-400', bg: 'from-cyan-50 via-cyan-50/30 to-white', iconBg: 'bg-cyan-100 text-cyan-600 border-cyan-200', bar: 'from-cyan-500 to-blue-400', glow: 'bg-cyan-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(6,182,212,0.4)]', valueColor: 'text-cyan-600', ring: 'ring-cyan-300' },
  };
  const t = themes[color];
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-white to-brand-mist/30 p-4 text-left shadow-[0_4px_16px_-8px_rgba(139,47,214,0.12)] transition-all duration-300 hover:-translate-y-1.5 animate-fade-slide-in ${t.border} ${active ? `ring-2 ${t.ring} ${t.shadow}` : t.shadow}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${t.bar} transition-transform duration-500 group-hover:scale-x-100 ${active ? 'scale-x-100' : ''}`} />
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${active ? 'opacity-100' : ''}`} />
      
      <div className="relative z-10 flex w-full items-start justify-between gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${t.iconBg} shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
          <Icon size={18} />
        </span>
        {active && (
          <span className="flex items-center gap-1 rounded-full bg-brand-magenta/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-magenta ring-1 ring-brand-magenta/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-magenta opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-magenta" />
            </span>
            Active
          </span>
        )}
      </div>

      <div className="relative z-10 w-full">
        <p className={`font-display text-3xl font-bold leading-tight tabular-nums ${t.valueColor}`}>{displayValue}</p>
        <p className="mt-0.5 text-xs font-semibold text-brand-ink/75">{label}</p>
        {sub && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{sub}</p>}
      </div>
    </Component>
  );
}

function useAnimatedCount(target, duration = 600) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = null;
    const to = Number(target) || 0;
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(to * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display.toLocaleString();
}

function DropdownFilter({ label, icon: Icon, value, options, open, onToggle, onChange, displayValue }) {
  const render = (v) => (displayValue ? displayValue(v) : v);
  return (
    <div className="relative">
      <button onClick={onToggle} className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2.5 text-sm font-medium text-brand-ink hover:bg-brand-lilac/40">
        {Icon && <Icon size={14} className="text-brand-magenta" />}
        {label}: <span className="font-semibold text-brand-magenta">{render(value)}</span>
        <ChevronDown size={14} className={`text-brand-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 top-full z-20 mt-2 max-h-72 w-52 overflow-y-auto rounded-xl border border-brand-lilac bg-white p-1 shadow-panel">
            {options.map((o) => (
              <button key={o} onClick={() => onChange(o)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${value === o ? 'bg-brand-magenta/10 font-semibold text-brand-magenta' : 'text-brand-ink/70 hover:bg-brand-lilac/40'}`}>
                {render(o)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES VIEW
   ═══════════════════════════════════════════════════════════════ */
function TemplatesView({ templates, viewMode, onView, onEdit, onDelete, onCopy, onUse, copiedId, onCreate }) {
  if (templates.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lilac text-brand-magenta">
          <FileText size={22} />
        </span>
        <p className="font-display text-base font-semibold text-brand-ink">No templates yet</p>
        <p className="max-w-sm text-sm text-brand-ink/50">Create reusable templates with placeholders for personalization.</p>
        <button onClick={onCreate} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110">
          <Plus size={16} /> Create First Template
        </button>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onView={onView} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy} onUse={onUse} copiedId={copiedId} />
        ))}
      </div>
    );
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <ul className="divide-y divide-brand-lilac/40">
        {templates.map((t) => (
          <TemplateRow key={t.id} template={t} onView={onView} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy} onUse={onUse} copiedId={copiedId} />
        ))}
      </ul>
    </div>
  );
}

function TemplateCard({ template: t, onView, onEdit, onDelete, onCopy, onUse, copiedId }) {
  const cat = findCategory(t.category);
  const CatIcon = cat.icon;
  const tone = TONE_CLASSES[cat.tone];

  const channelIconBg = t.channel === 'SMS' ? 'bg-violet-100 text-brand-purple' : t.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
  const ChannelIcon = t.channel === 'SMS' ? MessageSquare : t.channel === 'WhatsApp' ? MessageCircle : Mail;
  const channelAccent = t.channel === 'SMS' ? 'from-brand-magenta to-brand-purple' : t.channel === 'WhatsApp' ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-lilac bg-white p-4 shadow-[0_1px_3px_rgba(139,47,214,0.04)] transition-all hover:-translate-y-1 hover:border-brand-magenta/40 hover:shadow-[0_15px_40px_-15px_rgba(227,28,121,0.35)]">
      <span className={`pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${channelAccent} transition-transform duration-500 group-hover:scale-x-100`} />
      <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-magenta/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start gap-3">
        <button onClick={() => onView(t)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${channelIconBg} shadow-sm transition-transform hover:scale-110`}>
          <ChannelIcon size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => onView(t)} className="block truncate text-left font-semibold text-brand-ink hover:text-brand-magenta">{t.name}</button>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tone.chip}`}>
              <CatIcon size={9} /> {cat.label}
            </span>
            <span className="font-mono text-[9px] text-brand-ink/40">{t.updatedAt}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {t.status}
        </span>
      </div>

      <div className="relative mt-3 min-h-[72px] rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-brand-mist/80 to-brand-mist/40 p-3">
        <p className="line-clamp-4 text-xs italic leading-relaxed text-brand-ink/70">"{t.body}"</p>
      </div>

      <div className="relative mt-4 flex gap-1.5">
        <button onClick={() => onUse(t)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2 text-xs font-semibold text-white shadow-card transition-all hover:brightness-110" title="Use template">
          <Send size={12} /> Use
        </button>
        <button onClick={() => onView(t)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white py-2 text-xs font-semibold text-brand-ink transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta" title="View details">
          <Eye size={12} /> View
        </button>
        <button onClick={() => onEdit(t)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white py-2 text-xs font-semibold text-brand-ink transition-all hover:border-brand-purple/40 hover:bg-violet-50 hover:text-brand-purple" title="Edit template">
          <Pencil size={12} /> Edit
        </button>
        <button onClick={() => onCopy(t)} className="flex items-center justify-center rounded-xl border border-brand-lilac bg-white px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-lilac">
          {copiedId === t.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
        <button onClick={() => onDelete(t)} className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500 hover:border-rose-400 hover:bg-rose-100">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function TemplateRow({ template: t, onView, onEdit, onDelete, onCopy, onUse, copiedId }) {
  const cat = findCategory(t.category);
  const CatIcon = cat.icon;
  const tone = TONE_CLASSES[cat.tone];
  const channelIconBg = t.channel === 'SMS' ? 'bg-violet-100 text-brand-purple' : t.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
  const ChannelIcon = t.channel === 'SMS' ? MessageSquare : t.channel === 'WhatsApp' ? MessageCircle : Mail;

  return (
    <li className="group flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-mist/30">
      <button onClick={() => onView(t)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${channelIconBg} transition-transform hover:scale-110`}>
        <ChannelIcon size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <button onClick={() => onView(t)} className="block truncate text-left text-sm font-semibold text-brand-ink hover:text-brand-magenta">{t.name}</button>
        <p className="truncate text-[11px] text-brand-ink/50">{t.body}</p>
      </div>
      <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex ${tone.chip}`}>
        <CatIcon size={9} /> {cat.label}
      </span>
      <span className="hidden font-mono text-[10px] text-brand-ink/40 lg:block">{t.updatedAt}</span>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {t.status}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <button onClick={() => onUse(t)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-lilac bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-ink transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta" title="Use template">
          <Send size={12} /> Use
        </button>
        <button onClick={() => onView(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink/60 hover:bg-brand-lilac hover:text-brand-magenta"><Eye size={13} /></button>
        <button onClick={() => onEdit(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink/60 hover:bg-violet-50 hover:text-brand-purple"><Pencil size={13} /></button>
        <button onClick={() => onCopy(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-ink/60 hover:bg-brand-lilac hover:text-brand-magenta">
          {copiedId === t.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
        </button>
        <button onClick={() => onDelete(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 size={13} /></button>
      </div>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY VIEW
   ═══════════════════════════════════════════════════════════════ */
function HistoryView({ messages, viewMode }) {
  if (messages.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lilac text-brand-magenta"><History size={22} /></span>
        <p className="font-display text-base font-semibold text-brand-ink">No communication history</p>
        <p className="max-w-sm text-sm text-brand-ink/50">Messages sent to leads and customers will appear here.</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {messages.map((m) => {
          const statusStyle = STATUS_STYLES[m.status] || STATUS_STYLES.Pending;
          const StatusIcon = statusStyle.icon;

          return (
            <div key={m.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-brand-lilac bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-magenta/40">
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${m.channel === 'SMS' ? 'bg-violet-100 text-brand-purple' : m.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {m.channel === 'SMS' ? <MessageSquare size={18} /> : m.channel === 'WhatsApp' ? <MessageCircle size={18} /> : <Mail size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-ink">{m.to}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[9px] text-brand-ink/40">{m.date}</span>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle.chip}`}>
                  <StatusIcon size={9} /> {m.status}
                </span>
              </div>
              <div className="mt-3 min-h-[60px] rounded-xl border border-brand-lilac/60 bg-brand-mist/40 p-3">
                <p className="text-xs font-semibold text-brand-ink/80 mb-1">Template: {m.template}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-brand-lilac/60 bg-brand-mist/40 text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">
          <tr>
            <th className="w-[25%] px-5 py-3">Recipient</th>
            <th className="w-[20%] px-5 py-3">Channel</th>
            <th className="w-[25%] px-5 py-3">Template Used</th>
            <th className="w-[15%] px-5 py-3">Status</th>
            <th className="w-[15%] px-5 py-3 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-lilac/40">
          {messages.map((m) => {
            const statusStyle = STATUS_STYLES[m.status] || STATUS_STYLES.Pending;
            
            return (
              <tr key={m.id} className="transition-colors hover:bg-brand-mist/30">
                <td className="px-5 py-3 font-semibold text-brand-ink">{m.to}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-ink/70">
                    {m.channel === 'WhatsApp' && <MessageCircle size={12} className="text-emerald-500" />}
                    {m.channel === 'Email' && <Mail size={12} className="text-brand-magenta" />}
                    {m.channel === 'SMS' && <MessageSquare size={12} className="text-brand-purple" />}
                    {m.channel}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-brand-ink/70">{m.template}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle.chip}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs text-brand-ink/50">{m.date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODALS & DRAWERS
   ═══════════════════════════════════════════════════════════════ */
function TemplateModal({ mode = 'create', initial = {}, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    name: initial.name || '',
    channel: initial.channel || 'SMS',
    category: initial.category || 'Welcome',
    body: initial.body || '',
    status: initial.status || 'Active',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const insertVariable = (v) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newText = form.body.slice(0, start) + v + form.body.slice(end);
      setForm((f) => ({ ...f, body: newText }));
      setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + v.length; }, 0);
    } else {
      setForm((f) => ({ ...f, body: f.body + ' ' + v }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Template name is required'); return; }
    if (!form.body.trim()) { setError('Message body is required'); return; }
    setError('');
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSubmit(form); }, 300);
  };

  return (
    <ModalShell title={isEdit ? 'Edit Template' : 'New Template'} subtitle={isEdit ? 'Update template content and category' : 'Create a reusable message template'} onClose={onClose} icon={FileText} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModalInput label="Template Name *" value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setError(''); }} placeholder="e.g. Welcome Message" icon={FileText} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Channel</label>
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15">
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-brand-ink/70">Category</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TEMPLATE_CATEGORIES.map((c) => {
              const active = form.category === c.key;
              const Icon = c.icon;
              const tone = TONE_CLASSES[c.tone];
              return (
                <button key={c.key} type="button" onClick={() => setForm({ ...form, category: c.key })} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition-all ${active ? `border-brand-magenta ${tone.chip} ring-1 ring-brand-magenta/30` : 'border-brand-lilac bg-white text-brand-ink/60 hover:border-brand-magenta/40 hover:bg-brand-magenta/5'}`}>
                  <Icon size={14} />
                  <span className="text-[10px]">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Message Body *</label>
          <textarea ref={textareaRef} value={form.body} onChange={(e) => { setForm({ ...form, body: e.target.value }); setError(''); }} rows={5} placeholder="Hi {{name}}, welcome to {{project}}!..." className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15" />
          <div className="mt-2">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/40">Insert variable:</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button key={v.key} type="button" onClick={() => insertVariable(v.key)} className="rounded-lg bg-brand-lilac/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-magenta hover:bg-brand-lilac" title={v.label}>{v.key}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Status</label>
          <div className="flex gap-2">
            {['Active', 'Draft'].map((s) => (
              <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`min-w-[100px] flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${form.status === s ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta ring-1 ring-brand-magenta/30' : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'}`}>{s}</button>
            ))}
          </div>
        </div>

        {form.body && (
          <div className="rounded-xl border border-brand-magenta/30 bg-gradient-to-br from-brand-magenta/[0.06] to-brand-purple/[0.04] p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-brand-magenta">Preview</p>
            <p className="whitespace-pre-wrap text-sm italic text-brand-ink/80">{renderPreview(form.body)}</p>
          </div>
        )}

        {error && <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110 disabled:opacity-60">{submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function TemplateDetailsDrawer({ template, onClose, onEdit, onCopy, onUse }) {
  const cat = findCategory(template.category);
  const CatIcon = cat.icon;
  const tone = TONE_CLASSES[cat.tone];
  const channelGradient = template.channel === 'SMS' ? 'from-brand-magenta to-brand-purple' : template.channel === 'WhatsApp' ? 'from-emerald-500 to-emerald-600' : 'from-amber-500 to-orange-500';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-panel animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-lilac bg-gradient-to-r from-brand-mist/60 to-white px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm bg-gradient-to-br ${channelGradient}`}>
              {template.channel === 'SMS' ? <MessageSquare size={20} /> : template.channel === 'WhatsApp' ? <MessageCircle size={20} /> : <Mail size={20} />}
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Template Details</p>
              <h3 className="font-display text-base font-bold text-brand-ink">{template.name}</h3>
              <p className="font-mono text-[10px] text-brand-ink/50">{template.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-brand-ink/50 hover:bg-brand-lilac"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <InfoBox label="Channel" value={template.channel} color="purple" />
            <InfoBox label="Category" value={cat.label} color={cat.tone} />
            <InfoBox label="Status" value={template.status} color={template.status === 'Active' ? 'emerald' : 'amber'} />
          </div>

          <div className="card !p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone.icon}`}><CatIcon size={14} /></span>
              <div>
                <h4 className="font-display text-sm font-bold text-brand-ink">{cat.label} Template</h4>
                <p className="text-[10px] text-brand-ink/50">{cat.desc}</p>
              </div>
            </div>
          </div>

          <div className="card !p-4 space-y-3">
            <h4 className="font-display text-sm font-semibold text-brand-ink">Message Body</h4>
            <div className="rounded-xl border border-brand-lilac bg-brand-mist/40 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-ink/80">{template.body}</p>
            </div>
            <button onClick={onCopy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40"><Copy size={14} /> Copy Body</button>
          </div>

          <div className="card !p-4 space-y-3">
            <h4 className="font-display text-sm font-semibold text-brand-ink">Live Preview</h4>
            <div className="rounded-xl border border-brand-magenta/30 bg-gradient-to-br from-brand-magenta/[0.06] to-brand-purple/[0.04] p-4">
              <p className="whitespace-pre-wrap text-sm italic text-brand-ink/80">{renderPreview(template.body)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-lilac bg-white py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40"><Pencil size={14} /> Edit</button>
            <button onClick={onUse} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110"><Send size={14} /> Use Template</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendMessageModal({ prefill, templates, onClose, onSend }) {
  const [form, setForm] = useState({
    channel: prefill?.channel || 'SMS',
    to: '',
    message: prefill?.message || '',
    templateName: prefill?.templateName || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  const applyTemplate = (id) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setForm((f) => ({ ...f, channel: t.channel, message: t.body, templateName: t.name }));
  };

  const insertVariable = (v) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newText = form.message.slice(0, start) + v + form.message.slice(end);
      setForm((f) => ({ ...f, message: newText }));
      setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + v.length; }, 0);
    } else {
      setForm((f) => ({ ...f, message: f.message + ' ' + v }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.to.trim()) { setError('Recipient is required'); return; }
    if (form.channel === 'SMS' && !/^[0-9]{10,15}$/.test(form.to.replace(/\D/g, ''))) { setError('Enter a valid mobile number'); return; }
    if (form.channel === 'Email' && !/^\S+@\S+\.\S+$/.test(form.to)) { setError('Enter a valid email address'); return; }
    if (!form.message.trim()) { setError('Message body is required'); return; }
    setError('');
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSend(form); }, 400);
  };

  const channelTemplates = templates.filter((t) => t.channel === form.channel && t.status === 'Active');

  return (
    <ModalShell title="Send Message" subtitle="Compose an SMS, WhatsApp, or Email message" onClose={onClose} icon={Send} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold text-brand-ink/70">Channel</label>
          <div className="flex gap-2">
            {CHANNELS.map((c) => {
              const Icon = c === 'SMS' ? MessageSquare : c === 'WhatsApp' ? MessageCircle : Mail;
              const active = form.channel === c;
              return (
                <button key={c} type="button" onClick={() => setForm({ ...form, channel: c, templateName: '' })} className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-xs font-semibold transition-all ${active ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta ring-1 ring-brand-magenta/30' : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'}`}>
                  <Icon size={13} /> {c}
                </button>
              );
            })}
          </div>
        </div>

        <ModalInput label="Recipient *" value={form.to} onChange={(v) => { setForm({ ...form, to: v }); setError(''); }} placeholder={form.channel === 'Email' ? 'customer@example.com' : '+91 9876543210'} icon={AtSign} />

        {channelTemplates.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Use Template (optional)</label>
            <select onChange={(e) => applyTemplate(e.target.value)} className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15">
              <option value="">Choose a template...</option>
              {channelTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {findCategory(t.category).label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Message *</label>
          <textarea ref={textareaRef} value={form.message} onChange={(e) => { setForm({ ...form, message: e.target.value }); setError(''); }} rows={5} placeholder="Write your message here..." className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15" />
          <div className="mt-2">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/40">Insert variable:</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button key={v.key} type="button" onClick={() => insertVariable(v.key)} className="rounded-lg bg-brand-lilac/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-magenta hover:bg-brand-lilac">{v.key}</button>
              ))}
            </div>
          </div>
        </div>

        {form.message && (
          <div className="rounded-xl border border-brand-magenta/30 bg-gradient-to-br from-brand-magenta/[0.06] to-brand-purple/[0.04] p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-brand-magenta">Preview</p>
            <p className="whitespace-pre-wrap text-sm italic text-brand-ink/80">{renderPreview(form.message)}</p>
          </div>
        )}

        {error && <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">Cancel</button>
          <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110 disabled:opacity-60">
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Send size={14} /> Send Message</span>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════════ */
function ModalShell({ title, subtitle, children, onClose, icon: Icon, wide }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden rounded-2xl bg-white shadow-panel`}>
        <div className="flex items-center justify-between gap-3 border-b border-brand-lilac/60 px-6 py-4">
          <div className="flex items-center gap-3">
            {Icon && <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-sm"><Icon size={18} /></span>}
            <div>
              <h3 className="font-display text-base font-bold text-brand-ink">{title}</h3>
              {subtitle && <p className="text-[11px] text-brand-ink/50">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-brand-ink/50 hover:bg-brand-lilac"><X size={18} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalInput({ label, type = 'text', value, onChange, placeholder, icon: Icon }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-magenta/60" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl border border-brand-lilac bg-white py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15`} />
      </div>
    </div>
  );
}

function InfoBox({ label, value, color = 'purple' }) {
  const colors = {
    purple:  'bg-violet-50 text-brand-purple border-violet-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber:   'bg-amber-50 text-amber-600 border-amber-200',
    rose:    'bg-rose-50 text-brand-magenta border-rose-200',
    cyan:    'bg-cyan-50 text-cyan-600 border-cyan-200',
    slate:   'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[color]}`}>
      <p className="font-mono text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-500"><AlertCircle size={18} /></div>
          <h3 className="font-display text-base font-semibold text-brand-ink">{title}</h3>
        </div>
        <p className="mb-5 text-sm text-brand-ink/60">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2">
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-panel ${type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
        {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        {message}
      </div>
    </div>
  );
}