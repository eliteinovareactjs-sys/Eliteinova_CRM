
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  User, Lock, Bell, Activity, Save, LogOut, Eye, EyeOff, Check,
  AlertCircle, CheckCircle2, Mail, Phone, MapPin, Camera, Upload,
  Shield, Smartphone, Monitor, Key, X, Trash2, Filter, ChevronDown,
  Info, Tablet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'password', label: 'Change Password', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'activity', label: 'Login Activity', icon: Activity },
];

const STORAGE_PREFIX = 'mkt-account:';

const getAccountKey = (user) => {
  const identity = user?.id || user?.email || user?.name || 'guest';
  return `${String(identity).trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`;
};

const loadState = (key, fallback, accountKey = 'guest') => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${accountKey}:${key}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed !== null && typeof parsed === 'object') return parsed;
    }
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
  }
  return fallback;
};

const saveState = (key, value, accountKey = 'guest') => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${accountKey}:${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
    return false;
  }
};

const formatRelative = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';

  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'In the future';

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getInitials = (name) =>
  (name || '?').trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const buildDefaultLoginHistory = () => [
  {
    id: 'lg-current',
    device: 'Chrome on Windows',
    browser: 'Chrome',
    os: 'Windows',
    location: 'Current device',
    ip: 'Not available',
    time: new Date().toISOString(),
    status: 'success',
    current: true,
    active: true,
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MyAccount() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState(null);

  const accountKey = getAccountKey(user);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FDF8FE] via-white to-[#FBF3FF]">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-magenta/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-brand-purple/[0.05] blur-3xl" />

      <div className="relative space-y-5 px-1 py-1 pb-40">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">My Account</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <User size={13} className="text-brand-magenta" />
              Manage your profile, security, and preferences
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="group inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100"
          >
            <LogOut size={14} className="transition-transform group-hover:translate-x-0.5" />
            Logout
          </button>
        </div>

        {/* TABS */}
        <div className="card !p-2">
          <div className="flex flex-wrap items-center gap-1">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setTab(key)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] scale-[1.02]'
                      : 'text-brand-ink/60 hover:bg-brand-lilac/50 hover:text-brand-magenta'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENT */}
        {tab === 'profile' && <ProfileTab key={accountKey} user={user} accountKey={accountKey} showToast={showToast} />}
        {tab === 'password' && <PasswordTab showToast={showToast} />}
        {tab === 'notifications' && <NotificationsTab key={accountKey} accountKey={accountKey} showToast={showToast} />}
        {tab === 'activity' && <ActivityTab key={accountKey} accountKey={accountKey} showToast={showToast} />}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — PROFILE
   ═══════════════════════════════════════════════════════════════ */

function ProfileTab({ user, accountKey, showToast }) {
  const [profile, setProfile] = useState(() =>
    loadState('profile', {
      name: user?.name || 'Marketing Exec',
      email: user?.email || 'marketing@eliteinova.com',
      phone: '',
      role: user?.role || 'Marketing Executive',
      location: '',
      bio: '',
      avatar: null,
    }, accountKey)
  );

  useEffect(() => {
    if (!saveState('profile', profile, accountKey)) {
      showToast('Unable to save profile. Storage may be full.', 'error');
    }
  }, [profile, accountKey, showToast]);

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = (ev) => {
      const image = new Image();

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 400;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));

          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            showToast('Unable to process image', 'error');
            return;
          }

          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          const compressedImage = canvas.toDataURL('image/jpeg', 0.75);

          setProfile((prev) => ({ ...prev, avatar: compressedImage }));
          showToast('Profile photo updated');
        } catch (error) {
          console.error('Image processing failed:', error);
          showToast('Unable to process image', 'error');
        }
      };

      image.onerror = () => showToast('Invalid image file', 'error');
      image.src = ev.target.result;
    };

    reader.onerror = () => showToast('Failed to read image file', 'error');
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: null }));
    showToast('Profile photo removed');
  };

  const handleSave = () => {
    const name = profile.name.trim();
    const email = profile.email.trim();
    const phone = profile.phone.trim();

    if (!name) {
      showToast('Name is required', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Enter a valid email address', 'error');
      return;
    }

    if (phone && !/^\+?[\d\s()-]{7,18}$/.test(phone)) {
      showToast('Enter a valid phone number', 'error');
      return;
    }

    const updatedProfile = { ...profile, name, email, phone };

    setProfile(updatedProfile);

    if (saveState('profile', updatedProfile, accountKey)) {
      showToast('Profile updated successfully');
    } else {
      showToast('Unable to save profile. Storage may be full.', 'error');
    }
  };

  const hasUploadedAvatar = typeof profile.avatar === 'string' && profile.avatar.startsWith('data:image/');

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* AVATAR CARD */}
      <div className="card !p-5 space-y-4">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-brand-ink">
          <Camera size={14} className="text-brand-magenta" />
          Profile Photo
        </h3>

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {hasUploadedAvatar ? (
              <img src={profile.avatar} alt="Profile" className="h-28 w-28 rounded-full object-cover shadow-lg" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-magenta to-brand-purple text-3xl font-bold text-white shadow-lg">
                {getInitials(profile.name)}
              </div>
            )}

            <label
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-md transition-transform hover:scale-110"
              title="Upload photo"
            >
              <Upload size={14} />
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="text-center">
            <p className="font-display text-base font-semibold text-brand-ink">{profile.name || 'Your Name'}</p>
            <p className="text-xs text-brand-ink/50">{profile.role}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold text-brand-purple">
            <Shield size={11} />
            MARKETING
          </span>

          {hasUploadedAvatar && (
            <button type="button" onClick={handleRemoveAvatar} className="text-[11px] font-semibold text-rose-500 hover:underline">
              Remove photo
            </button>
          )}

          <p className="text-center text-[10px] text-brand-ink/40">
            PNG, JPG or WebP, max 5MB. Image will be resized automatically.
          </p>
        </div>
      </div>

      {/* PERSONAL INFORMATION */}
      <div className="card !p-5 space-y-4 lg:col-span-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-brand-ink">
          <User size={14} className="text-brand-magenta" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full Name" value={profile.name} onChange={(v) => updateField('name', v)} />
          <Field label="Email" value={profile.email} onChange={(v) => updateField('email', v)} icon={Mail} />
          <Field label="Phone" value={profile.phone} onChange={(v) => updateField('phone', v)} icon={Phone} />
          <Field label="Location" value={profile.location} onChange={(v) => updateField('location', v)} icon={MapPin} />

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Tell us a little about yourself..."
              className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15"
            />
            <p className="mt-1 text-right text-[10px] text-brand-ink/40">{profile.bio.length}/300 characters</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110"
          >
            <Save size={14} />
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — PASSWORD
   ═══════════════════════════════════════════════════════════════ */

function PasswordTab({ showToast }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState({});

  const strength = useMemo(() => {
    const p = form.next;
    if (!p) return 0;

    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    return score;
  }, [form.next]);

  const strengthLabels = ['Very Weak', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'];
  const strengthTextColors = ['text-rose-500', 'text-rose-500', 'text-amber-600', 'text-amber-600', 'text-emerald-600', 'text-emerald-600'];

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const submit = (e) => {
    e.preventDefault();

    const nextErrors = {};

    if (!form.current) nextErrors.current = 'Current password is required.';

    if (!form.next) {
      nextErrors.next = 'New password is required.';
    } else if (form.next.length < 8) {
      nextErrors.next = 'Must be at least 8 characters.';
    } else if (form.next === form.current) {
      nextErrors.next = 'New password must differ from current.';
    } else if (strength < 4) {
      nextErrors.next = 'Password must meet at least four strength requirements.';
    }

    if (!form.confirm) {
      nextErrors.confirm = 'Please confirm your new password.';
    } else if (form.next !== form.confirm) {
      nextErrors.confirm = 'Passwords do not match.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    showToast('Password API integration is required to update your password.', 'error');
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="card !p-5 space-y-4 lg:col-span-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-brand-ink">
          <Lock size={14} className="text-brand-magenta" />
          Change Password
        </h3>

        <form onSubmit={submit} className="space-y-4">
          <PasswordField
            label="Current Password"
            autoComplete="current-password"
            value={form.current}
            show={show.current}
            onToggle={() => setShow((prev) => ({ ...prev, current: !prev.current }))}
            onChange={(v) => updateField('current', v)}
            error={errors.current}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PasswordField
              label="New Password"
              autoComplete="new-password"
              value={form.next}
              show={show.next}
              onToggle={() => setShow((prev) => ({ ...prev, next: !prev.next }))}
              onChange={(v) => updateField('next', v)}
              error={errors.next}
            />

            <PasswordField
              label="Confirm New Password"
              autoComplete="new-password"
              value={form.confirm}
              show={show.confirm}
              onToggle={() => setShow((prev) => ({ ...prev, confirm: !prev.confirm }))}
              onChange={(v) => updateField('confirm', v)}
              error={errors.confirm}
            />
          </div>

          {form.next && (
            <div className="rounded-xl border border-brand-lilac/60 bg-brand-mist/40 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">
                  Password Strength
                </span>
                <span className={`text-[11px] font-bold ${strengthTextColors[strength]}`}>
                  {strengthLabels[strength]}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-brand-lilac">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strengthColors[strength]}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>

              <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-brand-ink/60">
                <PasswordRule ok={form.next.length >= 8}>At least 8 characters</PasswordRule>
                <PasswordRule ok={/[A-Z]/.test(form.next)}>One uppercase letter</PasswordRule>
                <PasswordRule ok={/[a-z]/.test(form.next)}>One lowercase letter</PasswordRule>
                <PasswordRule ok={/[0-9]/.test(form.next)}>One number</PasswordRule>
                <PasswordRule ok={/[^A-Za-z0-9]/.test(form.next)}>One special character</PasswordRule>
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110"
          >
            <Key size={14} />
            Update Password
          </button>
        </form>
      </div>

      <div className="card !p-5 space-y-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-brand-ink">
          <Shield size={14} className="text-brand-magenta" />
          Password Tips
        </h3>

        <ul className="space-y-2 text-xs text-brand-ink/60">
          <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-emerald-500" /> Use at least 8 characters</li>
          <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-emerald-500" /> Mix uppercase and lowercase letters</li>
          <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-emerald-500" /> Include at least one number</li>
          <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-emerald-500" /> Add a special character (!@#$%)</li>
          <li className="flex gap-2"><X size={13} className="mt-0.5 shrink-0 text-rose-500" /> Don't reuse old passwords</li>
          <li className="flex gap-2"><X size={13} className="mt-0.5 shrink-0 text-rose-500" /> Never share your password</li>
        </ul>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-[11px] text-amber-700">
            <Info size={12} className="mt-0.5 shrink-0" />
            Password changes must be verified and processed securely by your backend.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════ */

function NotificationsTab({ accountKey, showToast }) {
  const [prefs, setPrefs] = useState(() =>
    loadState('notifications', {
      emailDigest: true,
      pushNotifications: true,
      newLead: true,
      campaignStatus: true,
      leadHandover: true,
      dailyReport: false,
    }, accountKey)
  );

  const updatePreference = (field, value) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (saveState('notifications', prefs, accountKey)) {
      showToast('Notification preferences saved');
    } else {
      showToast('Unable to save notification preferences', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="card !p-5 space-y-4">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-brand-ink">
          <Bell size={14} className="text-brand-magenta" />
          Notification Preferences
        </h3>

        <div className="space-y-3">
          <ToggleRow label="Email digest" desc="Receive daily summary of leads and activities" value={prefs.emailDigest} onChange={(v) => updatePreference('emailDigest', v)} />
          <ToggleRow label="Push notifications" desc="Receive push notifications on your devices" value={prefs.pushNotifications} onChange={(v) => updatePreference('pushNotifications', v)} />

          <div className="my-2 border-t border-brand-lilac/40" />

          <ToggleRow label="New lead assigned" desc="Alert when a new lead is assigned to you" value={prefs.newLead} onChange={(v) => updatePreference('newLead', v)} />
          <ToggleRow label="Campaign status change" desc="Alert when campaigns start, pause, or end" value={prefs.campaignStatus} onChange={(v) => updatePreference('campaignStatus', v)} />
          <ToggleRow label="Lead handover updates" desc="Alert when leads are handed over to sales" value={prefs.leadHandover} onChange={(v) => updatePreference('leadHandover', v)} />
          <ToggleRow label="Daily summary report" desc="Get a summary of your daily activities every evening" value={prefs.dailyReport} onChange={(v) => updatePreference('dailyReport', v)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110"
        >
          <Save size={14} />
          Save Preferences
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4 — LOGIN ACTIVITY
   ═══════════════════════════════════════════════════════════════ */

function ActivityTab({ accountKey, showToast }) {
  const [history, setHistory] = useState(() =>
    loadState('loginHistory', buildDefaultLoginHistory(), accountKey)
  );

  const [filter, setFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!saveState('loginHistory', history, accountKey)) {
      showToast('Unable to save login activity', 'error');
    }
  }, [history, accountKey, showToast]);

  const filtered = useMemo(() => {
    if (filter === 'All') return history;
    if (filter === 'Success') return history.filter((h) => h.status === 'success');
    if (filter === 'Failed') return history.filter((h) => h.status === 'failed');
    if (filter === 'Current') return history.filter((h) => h.current);
    return history;
  }, [history, filter]);

  const activeSessions = history.filter((h) => h.active === true && !h.current);

  const handleRevoke = (id) => {
    const entry = history.find((h) => h.id === id);

    if (!entry || entry.current || entry.active !== true) {
      showToast('This session cannot be revoked', 'error');
      return;
    }

    setHistory((prev) => prev.map((h) => h.id === id ? { ...h, active: false, revoked: true } : h));
    showToast(`Session on ${entry.device} marked as revoked`);
  };

  const handleRevokeAll = () => {
    if (activeSessions.length === 0) {
      showToast('No other active sessions found', 'error');
      return;
    }

    if (!window.confirm('This will sign you out of all other active devices. Continue?')) return;

    setHistory((prev) => prev.map((h) => h.active === true && !h.current ? { ...h, active: false, revoked: true } : h));
    showToast('Other sessions marked as revoked');
  };

  const stats = useMemo(() => ({
    total: history.length,
    current: history.filter((h) => h.current && h.active !== false).length,
    failed: history.filter((h) => h.status === 'failed').length,
  }), [history]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MiniStat icon={Activity} label="Total Logins" value={stats.total} color="purple" />
        <MiniStat icon={CheckCircle2} label="Active Sessions" value={stats.current + activeSessions.length} color="emerald" />
        <MiniStat icon={AlertCircle} label="Failed Attempts" value={stats.failed} color="rose" />
      </div>

      <div className="card !p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-brand-magenta" />
            <h3 className="font-display text-sm font-semibold text-brand-ink">Recent Login Activity</h3>
            <span className="text-xs text-brand-ink/40">· {filtered.length} entries</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((s) => !s)}
                aria-expanded={filterOpen}
                className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-3.5 py-1.5 text-[11px] font-medium text-brand-ink hover:bg-brand-lilac/40"
              >
                <Filter size={12} className="text-brand-magenta" />
                <span className="font-semibold text-brand-magenta">{filter}</span>
                <ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-xl border border-brand-lilac bg-white p-1 shadow-panel">
                    {['All', 'Success', 'Failed', 'Current'].map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => { setFilter(f); setFilterOpen(false); }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                          filter === f ? 'bg-brand-magenta/10 font-semibold text-brand-magenta' : 'text-brand-ink/70 hover:bg-brand-lilac/40'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {activeSessions.length > 0 && (
              <button
                type="button"
                onClick={handleRevokeAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-[11px] font-semibold text-rose-500 hover:bg-rose-100"
              >
                <LogOut size={11} />
                Revoke All Others
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lilac text-brand-magenta">
              <Activity size={20} />
            </span>
            <p className="text-sm text-brand-ink/50">No login activity matches your filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => {
              const isMobile = /iphone|android|mobile/i.test(a.device);
              const isTablet = /ipad|tablet/i.test(a.device);
              const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Monitor;
              const isSuccess = a.status === 'success';
              const isFailed = a.status === 'failed';
              const isRevoked = a.revoked === true;

              return (
                <div
                  key={a.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition-all ${
                    a.current ? 'border-brand-magenta/40 bg-brand-magenta/5' : 'border-brand-lilac/60 bg-white hover:shadow-md'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    a.current
                      ? 'bg-gradient-to-br from-brand-magenta to-brand-purple text-white'
                      : isSuccess
                      ? 'bg-brand-lilac/40 text-brand-magenta'
                      : 'bg-rose-100 text-rose-500'
                  }`}>
                    <DeviceIcon size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-brand-ink">{a.device}</p>

                      {a.current && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                          CURRENT
                        </span>
                      )}

                      {isFailed && (
                        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-600">
                          FAILED
                        </span>
                      )}

                      {isRevoked && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500">
                          REVOKED
                        </span>
                      )}
                    </div>

                    <p className="truncate text-xs text-brand-ink/50">
                      {a.ip || 'IP unavailable'} · {a.location || 'Location unavailable'} · {formatRelative(a.time)}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right text-[10px] text-brand-ink/40 lg:block">
                    {formatDateTime(a.time)}
                  </div>

                  {!a.current && a.active === true && a.status === 'success' && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(a.id)}
                      className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-500 transition-all hover:bg-rose-100"
                      title="Revoke session"
                      aria-label={`Revoke session on ${a.device}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-[11px] text-amber-700">
            <Info size={13} className="mt-0.5 shrink-0" />
            Session information shown here is local demo data. Real device tracking and session revocation require backend authentication integration.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function Field({ label, value, onChange, icon: Icon }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" />}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-brand-lilac bg-white py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15 ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'}`}
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onToggle, onChange, error, autoComplete = 'new-password' }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">{label}</label>

      <div className="relative">
        <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/40" />

        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15' : 'border-brand-lilac focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15'
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-brand-ink/40 hover:bg-brand-lilac"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-500">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordRule({ ok, children }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-emerald-500' : 'bg-brand-lilac'}`}>
        {ok && <Check size={8} className="text-white" strokeWidth={4} />}
      </span>
      <span className={ok ? 'text-emerald-700' : ''}>{children}</span>
    </li>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-brand-lilac/60 bg-white p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-ink">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-brand-ink/50">{desc}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-magenta/30 ${
          value ? 'bg-gradient-to-r from-brand-magenta to-brand-purple' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${value ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
      </button>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value = 0, color = 'purple' }) {
  const colors = {
    purple: 'bg-violet-50 text-brand-purple',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-brand-magenta',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-lilac bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[color] || colors.purple}`}>
        <Icon size={18} />
      </span>

      <div className="min-w-0">
        <p className="truncate text-[11px] text-brand-ink/50">{label}</p>
        <p className="font-display text-lg font-bold text-brand-ink tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 px-4">
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-panel ${
        type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'
      }`}>
        {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        <span>{message}</span>
      </div>
    </div>
  );
}
