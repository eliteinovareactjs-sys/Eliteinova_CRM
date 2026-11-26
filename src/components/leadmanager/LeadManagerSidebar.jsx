// src/components/leadmanager/LeadManagerSidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, PlusCircle, Inbox, UserCheck,
  Phone, Calendar, Star, GitPullRequest, Megaphone,
  BarChart3, Import, Settings, Globe, X,
  UserRound, Tags, ShieldCheck, Search, Workflow, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/leadmanager/dashboard', label: 'Lead Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Leads',
    items: [
      { to: '/leadmanager/leads', label: 'All Leads', icon: Users },
    ],
  },
  {
    label: 'Lead Capture',
    items: [
      { to: '/leadmanager/capture', label: 'Lead Capture', icon: PlusCircle },
    ],
  },
  {
    label: 'Lead Inbox',
    items: [
      { to: '/leadmanager/inbox', label: 'Lead Inbox', icon: Inbox },
    ],
  },
  {
    label: 'Assignment',
    items: [
      { to: '/leadmanager/assignment', label: 'Lead Assignment', icon: UserCheck },
    ],
  },
  {
    label: 'Calling',
    items: [
      { to: '/leadmanager/calling', label: 'Lead Calling', icon: Phone },
    ],
  },
  {
    label: 'Follow-ups',
    items: [
      { to: '/leadmanager/followups', label: 'Follow-ups', icon: Calendar },
    ],
  },
  {
    label: 'Qualification',
    items: [
      { to: '/leadmanager/qualification', label: 'Lead Qualification', icon: Star },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { to: '/leadmanager/pipeline', label: 'Lead Pipeline', icon: GitPullRequest },
    ],
  },
  {
    label: 'Campaign Leads',
    items: [
      { to: '/leadmanager/campaigns', label: 'Campaign Leads', icon: Megaphone },
    ],
  },
  {
  label: 'Lead Organization',
  items: [
    { to: '/leadmanager/lead-profile', label: 'Lead Profile', icon: UserRound },
    { to: '/leadmanager/tags-categories', label: 'Tags & Categories', icon: Tags },
  ],
},
{
  label: 'Lead Quality & Search',
  items: [
    { to: '/leadmanager/duplicate-validation', label: 'Duplicate & Validation', icon: ShieldCheck },
    { to: '/leadmanager/advanced-search', label: 'Advanced Search', icon: Search },
  ],
},
{
  label: 'Lead Automation & Tools',
  items: [
    { to: '/leadmanager/automation', label: 'Lead Automation', icon: Workflow },
    { to: '/leadmanager/quick-actions', label: 'Quick Actions', icon: Zap },
  ],
},
  {
    label: 'Reports',
    items: [
      { to: '/leadmanager/reports', label: 'Lead Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Data Tools',
    items: [
      { to: '/leadmanager/import-export', label: 'Import / Export', icon: Import },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/leadmanager/config', label: 'Lead Configuration', icon: Settings },
      { to: '/leadmanager/account', label: 'My Account', icon: Globe },
    ],
  },
];

export default function LeadManagerSidebar({ open, onClose }) {
  const { activeWebsite } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 flex h-screen w-64 flex-col border-r border-brand-lilac bg-white transition-transform md:sticky md:top-0 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* BRAND */}
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-button text-white shadow-card">
            <Users size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold leading-tight text-brand-ink">
              ELITEINOVA <span className="text-brand-magenta">CRM</span>
            </p>
            <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-brand-ink/40">
              {activeWebsite?.name || 'LEAD MANAGER'}
            </p>
          </div>
          <button onClick={onClose} className="md:hidden rounded-lg p-1 text-brand-ink/50 hover:bg-brand-lilac">
            <X size={16} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-brand-ink/40">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}