import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, X, ChevronDown, Monitor, Smartphone,
  AlertOctagon, AlertTriangle, Info, Circle,
  Trash2, RotateCcw, Loader2, Bug as BugIcon, Calendar, User,
} from 'lucide-react';

/* ----------------------------- Constants ----------------------------- */

const STATUSES = ['Backlog', 'In Progress', 'In QA', 'Resolved'];
const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const OS_OPTIONS = ['Windows', 'macOS', 'Android', 'iOS'];
const BROWSER_OPTIONS = ['Chrome', 'Safari', 'Firefox', 'Edge'];

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
const SANS = "'Inter', ui-sans-serif, system-ui, sans-serif";

const SEVERITY_META = {
  Critical: { hex: '#ef4444', bg: 'bg-red-950', text: 'text-red-300', border: 'border-red-800', Icon: AlertOctagon },
  Major: { hex: '#f59e0b', bg: 'bg-amber-950', text: 'text-amber-200', border: 'border-amber-800', Icon: AlertTriangle },
  Minor: { hex: '#10b981', bg: 'bg-emerald-950', text: 'text-emerald-300', border: 'border-emerald-800', Icon: Info },
  Trivial: { hex: '#64748b', bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-600', Icon: Circle },
};

const PRIORITY_META = {
  High: { text: 'text-red-300', border: 'border-red-600' },
  Medium: { text: 'text-amber-200', border: 'border-amber-600' },
  Low: { text: 'text-emerald-300', border: 'border-emerald-600' },
};

const STATUS_META = {
  Backlog: { hex: '#64748b' },
  'In Progress': { hex: '#818cf8' },
  'In QA': { hex: '#38bdf8' },
  Resolved: { hex: '#34d399' },
};

const STORAGE_KEY = 'qa-bug-tracker:tickets';

const initialMockBugs = [
  {
    id: 'BUG-101',
    title: 'Authentication token expires prematurely on backgrounding app',
    description: "When the application is minimized or sent to the background on mobile environments, the JWT auth token invalidates instantly, forcing users back to the login screen.",
    stepsToReproduce: "1. Log into the application successfully.\n2. Navigate to the dashboard.\n3. Minimize the app / press Home button to send it to the background.\n4. Wait 15 seconds.\n5. Re-open the application from background state.",
    expectedResult: "The user session remains active, displaying the dashboard without requiring re-authentication.",
    actualResult: "User is forcefully redirected to the '/login' route with an 'Unauthorized' error toast.",
    severity: 'Critical',
    priority: 'High',
    environment: { os: 'Android (v14)', browser: 'WebView', device: 'OnePlus 11' },
    status: 'In QA',
    reporter: 'Prathmesh (QA)',
    createdAt: '2026-06-18',
  },
  {
    id: 'BUG-102',
    title: "Data Table pagination breaks when 'Items Per Page' filter is altered",
    description: "Modifying the pagination limit on the Drone Fleet Management dashboard from 10 to 50 results causes a grid UI overlap and prevents the next page button from firing.",
    stepsToReproduce: "1. Navigate to the Fleet Drone Master API list page.\n2. Scroll down to the responsive data table.\n3. Change 'Items per page' dropdown selection from 10 to 50.\n4. Observe UI grid structure and attempt to click pagination arrows.",
    expectedResult: "The table dynamically re-fetches or renders 50 items smoothly with zebra-striped rows adjusting automatically.",
    actualResult: "Table layout breaks, text overlaps, and pagination controls become completely unresponsive to click events.",
    severity: 'Major',
    priority: 'Medium',
    environment: { os: 'macOS Sonoma', browser: 'Chrome v122' },
    status: 'In Progress',
    reporter: 'Prathmesh (QA)',
    createdAt: '2026-06-19',
  },
  {
    id: 'BUG-103',
    title: 'Tooltips on API status badges fail to render on touch devices',
    description: 'Hover-triggered descriptive tooltips explaining API connection states do not render when tapped on mobile screens.',
    stepsToReproduce: "1. Open application on a mobile device or responsive viewport simulation.\n2. Locate the color-coded API status badges.\n3. Tap on the badge element to inspect tooltips.",
    expectedResult: 'The tooltip activates on tap or long-press, revealing description text to the user.',
    actualResult: 'No visual tooltip appears; element behaves like static text without touch interactions.',
    severity: 'Minor',
    priority: 'Low',
    environment: { os: 'iOS 17', browser: 'Safari Mobile' },
    status: 'Backlog',
    reporter: 'Prathmesh (QA)',
    createdAt: '2026-06-19',
  },
];

/* ------------------------------- Helpers ------------------------------ */

function nextBugId(bugs) {
  const nums = bugs.map((b) => parseInt(String(b.id).replace('BUG-', ''), 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 100;
  return `BUG-${max + 1}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function envIconFor(os) {
  return /android|ios/i.test(os || '') ? Smartphone : Monitor;
}

/* ----------------------------- Global style ---------------------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
      .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #475569; }
      @keyframes pulseGlow { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      .pulse-dot { animation: pulseGlow 1.8s ease-in-out infinite; }
      @keyframes modalIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .modal-in { animation: modalIn 0.16s ease-out; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .fade-in { animation: fadeIn 0.15s ease-out; }
      @media (prefers-reduced-motion: reduce) {
        .pulse-dot, .modal-in, .fade-in { animation: none !important; }
        * { transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

/* -------------------------------- Badges ------------------------------- */

function SeverityBadge({ severity }) {
  const m = SEVERITY_META[severity];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${m.bg} ${m.text} ${m.border}`}>
      <span
        className={severity === 'Critical' ? 'h-1.5 w-1.5 rounded-full pulse-dot' : 'h-1.5 w-1.5 rounded-full'}
        style={{ background: m.hex }}
      />
      {severity}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-transparent ${m.text} ${m.border}`}>
      {priority}
    </span>
  );
}

/* -------------------------------- Header -------------------------------- */

function Header({ totalCount, criticalOpenCount, onLogNew }) {
  return (
    <header className="shrink-0 border-b border-slate-800 bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <BugIcon size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight" style={{ fontFamily: SANS }}>
              QA Bug Tracker
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500" style={{ fontFamily: MONO }}>
              Defect Management Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-300" style={{ fontFamily: MONO }}>
              {totalCount} {totalCount === 1 ? 'TICKET' : 'TICKETS'}
            </span>
            {criticalOpenCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-300 border-l border-slate-700 pl-2" style={{ fontFamily: MONO }}>
                <span className="h-1.5 w-1.5 rounded-full pulse-dot" style={{ background: '#ef4444' }} />
                {criticalOpenCount} CRITICAL
              </span>
            )}
          </div>
          <button
            onClick={onLogNew}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-3.5 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <Plus size={16} /> Log New Bug
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------- Filter bar ------------------------------ */

function SelectFilter({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none rounded-lg border border-slate-700 bg-slate-800 pl-3 pr-8 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
      >
        <option value="All">All {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function FilterBar({
  search, setSearch,
  filterSeverity, setFilterSeverity,
  filterPriority, setFilterPriority,
  filterEnv, setFilterEnv,
  envOptions, onClear, filtersActive,
}) {
  return (
    <div className="shrink-0 border-b border-slate-800 bg-slate-900 px-4 md:px-6 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, or description..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            style={{ fontFamily: MONO }}
          />
        </div>
        <SelectFilter label="Severity" value={filterSeverity} onChange={setFilterSeverity} options={SEVERITIES} />
        <SelectFilter label="Priority" value={filterPriority} onChange={setFilterPriority} options={PRIORITIES} />
        <SelectFilter label="Environments" value={filterEnv} onChange={setFilterEnv} options={envOptions} />
        <button
          onClick={onClear}
          disabled={!filtersActive}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
            filtersActive ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <RotateCcw size={14} /> Clear Filters
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Bug card -------------------------------- */

function BugCard({ bug, onOpen, onDragStart, onDragEnd, isDragging }) {
  const sev = SEVERITY_META[bug.severity];
  const EnvIcon = envIconFor(bug.environment.os);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', bug.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(bug.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(bug)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(bug);
        }
      }}
      aria-label={`${bug.id}: ${bug.title}. Severity ${bug.severity}, priority ${bug.priority}. Press Enter to view details.`}
      className={`group relative overflow-hidden rounded-xl border bg-slate-800 pl-4 pr-3 py-3 cursor-grab active:cursor-grabbing transition-all duration-150 hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } border-slate-700`}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: sev ? sev.hex : '#64748b', boxShadow: bug.severity === 'Critical' ? `0 0 10px ${sev.hex}` : 'none' }}
      />

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs tracking-wide text-indigo-400" style={{ fontFamily: MONO }}>
          <span className="text-slate-600">{'\u203A'}</span> {bug.id}
        </span>
      </div>

      <h3
        className="text-sm font-semibold text-slate-100 leading-snug mb-2"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {bug.title}
      </h3>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <SeverityBadge severity={bug.severity} />
        <PriorityBadge priority={bug.priority} />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500" style={{ fontFamily: MONO }}>
        <EnvIcon size={12} className="shrink-0" />
        <span className="truncate">{bug.environment.os} · {bug.environment.browser}</span>
      </div>
    </div>
  );
}

/* --------------------------------- Column --------------------------------- */

function Column({ status, bugs, onOpen, onDrop, onColumnDragOver, isOver, draggingId, onCardDragStart, onCardDragEnd }) {
  const meta = STATUS_META[status];
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onColumnDragOver(status);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(status);
      }}
      className={`flex flex-col rounded-xl border bg-slate-900 transition-colors duration-150 ${
        isOver ? 'border-indigo-500' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.hex }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400" style={{ fontFamily: SANS }}>
            {status}
          </span>
        </div>
        <span className="text-xs text-slate-500" style={{ fontFamily: MONO }}>{bugs.length}</span>
      </div>

      <div className="flex flex-col gap-2.5 p-2.5 min-h-24">
        {bugs.length === 0 && (
          <div className="flex items-center justify-center text-center text-xs text-slate-600 py-8 px-2 border border-dashed border-slate-800 rounded-lg">
            No tickets here.
          </div>
        )}
        {bugs.map((bug) => (
          <BugCard
            key={bug.id}
            bug={bug}
            onOpen={onOpen}
            isDragging={draggingId === bug.id}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Form controls ------------------------------ */

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 ${
    hasError ? 'border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
  }`;

function SelectInput({ value, onChange, options, error, placeholder }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass(error)} appearance-none pr-8 cursor-pointer`}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

/* ----------------------------- Log new bug modal ---------------------------- */

const emptyForm = {
  title: '', description: '', stepsToReproduce: '', expectedResult: '', actualResult: '',
  severity: '', priority: '', os: '', browser: '', device: '', reporter: '',
};

function LogBugModal({ onClose, onSubmit, nextId }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.stepsToReproduce.trim()) errs.stepsToReproduce = 'Steps to reproduce are required.';
    if (!form.expectedResult.trim()) errs.expectedResult = 'Expected result is required.';
    if (!form.actualResult.trim()) errs.actualResult = 'Actual result is required.';
    if (!form.severity) errs.severity = 'Select a severity.';
    if (!form.priority) errs.priority = 'Select a priority.';
    if (!form.os) errs.os = 'Select an operating system.';
    if (!form.browser) errs.browser = 'Select a browser.';
    if (!form.reporter.trim()) errs.reporter = 'Reporter name is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      id: nextId,
      title: form.title.trim(),
      description: form.description.trim(),
      stepsToReproduce: form.stepsToReproduce.trim(),
      expectedResult: form.expectedResult.trim(),
      actualResult: form.actualResult.trim(),
      severity: form.severity,
      priority: form.priority,
      environment: { os: form.os, browser: form.browser, device: form.device.trim() || undefined },
      status: 'Backlog',
      reporter: form.reporter.trim(),
      createdAt: todayStr(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ backgroundColor: 'rgba(2,6,23,0.75)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-in w-full max-w-2xl max-h-screen overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        style={{ maxHeight: '90vh', fontFamily: SANS }}
        role="dialog"
        aria-modal="true"
        aria-label="Log a new bug"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-100">Log New Bug</h2>
            <p className="text-xs text-slate-500" style={{ fontFamily: MONO }}>{nextId}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Field label="Title" error={errors.title}>
            <input className={inputClass(errors.title)} value={form.title} onChange={set('title')} placeholder="Concise summary of the defect" />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea rows={2} className={inputClass(errors.description)} value={form.description} onChange={set('description')} placeholder="High-level context of the issue" />
          </Field>

          <Field label="Steps to Reproduce" error={errors.stepsToReproduce}>
            <textarea
              rows={4}
              className={inputClass(errors.stepsToReproduce)}
              style={{ fontFamily: MONO }}
              value={form.stepsToReproduce}
              onChange={set('stepsToReproduce')}
              placeholder={'1. Navigate to...\n2. Click on...\n3. Observe...'}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Expected Result" error={errors.expectedResult}>
              <textarea rows={3} className={inputClass(errors.expectedResult)} value={form.expectedResult} onChange={set('expectedResult')} placeholder="What should happen" />
            </Field>
            <Field label="Actual Result" error={errors.actualResult}>
              <textarea rows={3} className={inputClass(errors.actualResult)} value={form.actualResult} onChange={set('actualResult')} placeholder="What actually happens" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Severity" error={errors.severity}>
              <SelectInput value={form.severity} onChange={(v) => setForm((f) => ({ ...f, severity: v }))} options={SEVERITIES} error={errors.severity} placeholder="Select severity" />
            </Field>
            <Field label="Priority" error={errors.priority}>
              <SelectInput value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v }))} options={PRIORITIES} error={errors.priority} placeholder="Select priority" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Operating System" error={errors.os}>
              <SelectInput value={form.os} onChange={(v) => setForm((f) => ({ ...f, os: v }))} options={OS_OPTIONS} error={errors.os} placeholder="Select OS" />
            </Field>
            <Field label="Browser" error={errors.browser}>
              <SelectInput value={form.browser} onChange={(v) => setForm((f) => ({ ...f, browser: v }))} options={BROWSER_OPTIONS} error={errors.browser} placeholder="Select browser" />
            </Field>
            <Field label="Device (optional)">
              <input className={inputClass(false)} value={form.device} onChange={set('device')} placeholder="e.g. Pixel 8" />
            </Field>
          </div>

          <Field label="Reporter" error={errors.reporter}>
            <input className={inputClass(errors.reporter)} value={form.reporter} onChange={set('reporter')} placeholder="Your name" />
          </Field>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors duration-150">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 transition-colors duration-150">
              <Plus size={16} /> Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------- Detail modal ------------------------------- */

function DetailModal({ bug, onClose, onStatusChange, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sev = SEVERITY_META[bug.severity];
  const SevIcon = sev.Icon;
  const EnvIcon = envIconFor(bug.environment.os);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stepLines = bug.stepsToReproduce
    .split('\n')
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in"
      style={{ backgroundColor: 'rgba(2,6,23,0.75)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-in w-full max-w-2xl max-h-screen overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        style={{ maxHeight: '90vh', fontFamily: SANS }}
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${bug.id}`}
      >
        <div className="px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${sev.bg} ${sev.border}`}>
              <SevIcon size={18} style={{ color: sev.hex }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-indigo-400" style={{ fontFamily: MONO }}>{bug.id}</p>
              <h2 className="text-base font-bold text-slate-100 leading-snug">{bug.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors duration-150 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={bug.severity} />
            <PriorityBadge priority={bug.priority} />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Description</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{bug.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Steps to Reproduce</h3>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <ol className="space-y-1.5 text-sm text-slate-300" style={{ fontFamily: MONO }}>
                {stepLines.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-indigo-400 shrink-0">{i + 1}.</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-800 bg-slate-800 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300 mb-1">Expected Result</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{bug.expectedResult}</p>
            </div>
            <div className="rounded-lg border border-red-800 bg-slate-800 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-red-300 mb-1">Actual Result</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{bug.actualResult}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Environment</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-300" style={{ fontFamily: MONO }}>
              <span className="flex items-center gap-1.5"><EnvIcon size={14} className="text-slate-500" /> {bug.environment.os}</span>
              <span className="text-slate-600">·</span>
              <span>{bug.environment.browser}</span>
              {bug.environment.device && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>{bug.environment.device}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><User size={13} /> {bug.reporter}</span>
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {bug.createdAt}</span>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Move to Stage</h3>
            <div className="relative max-w-xs">
              <select
                value={bug.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="appearance-none w-full rounded-lg border border-slate-700 bg-slate-800 pl-3 pr-8 py-2 text-sm font-medium text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-400 transition-colors duration-150"
              >
                <Trash2 size={15} /> Delete ticket
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-slate-300">Delete this ticket permanently?</span>
                <button onClick={onDelete} className="rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 transition-colors duration-150">
                  Delete
                </button>
                <button onClick={() => setConfirmingDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors duration-150">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Empty state ------------------------------- */

function EmptyState({ onLogNew }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 text-center py-20">
      <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <BugIcon size={24} className="text-slate-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-200">No tickets logged yet</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        The board is clear. File a new defect to start tracking it through Backlog, In Progress, In QA, and Resolved.
      </p>
      <button
        onClick={onLogNew}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 transition-colors duration-150"
      >
        <Plus size={16} /> Log New Bug
      </button>
    </div>
  );
}

/* -------------------------------- Loading screen ----------------------------- */

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-3 bg-slate-950">
      <GlobalStyle />
      <Loader2 size={28} className="text-indigo-400 animate-spin" />
      <p className="text-sm text-slate-500" style={{ fontFamily: MONO }}>Loading bug board…</p>
    </div>
  );
}

/* ----------------------------------- App ------------------------------------ */

export default function QABugTrackerKanban() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterEnv, setFilterEnv] = useState('All');

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState(null);

  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Load persisted tickets on mount (plain localStorage for a standalone browser app)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : initialMockBugs;
      setBugs(Array.isArray(parsed) && parsed.length ? parsed : initialMockBugs);
    } catch (e) {
      setBugs(initialMockBugs);
    } finally {
      setLoading(false);
      loadedRef.current = true;
    }
  }, []);

  // Persist on every change, after the initial load completes
  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bugs));
    } catch (e) {
      // Persistence is best-effort; the board still works in-memory.
    }
  }, [bugs]);

  const updateStatus = useCallback((id, status) => {
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }, []);

  const addBug = useCallback((bug) => {
    setBugs((prev) => [...prev, bug]);
  }, []);

  const deleteBug = useCallback((id) => {
    setBugs((prev) => prev.filter((b) => b.id !== id));
    setSelectedBugId(null);
  }, []);

  const clearFilters = () => {
    setSearch('');
    setFilterSeverity('All');
    setFilterPriority('All');
    setFilterEnv('All');
  };
  const filtersActive = Boolean(search) || filterSeverity !== 'All' || filterPriority !== 'All' || filterEnv !== 'All';

  const envOptions = Array.from(new Set(bugs.map((b) => b.environment.os))).sort();

  const filteredBugs = bugs.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || b.id.toLowerCase().includes(q) || b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
    const matchesSeverity = filterSeverity === 'All' || b.severity === filterSeverity;
    const matchesPriority = filterPriority === 'All' || b.priority === filterPriority;
    const matchesEnv = filterEnv === 'All' || b.environment.os === filterEnv;
    return matchesSearch && matchesSeverity && matchesPriority && matchesEnv;
  });

  const criticalOpenCount = bugs.filter((b) => b.severity === 'Critical' && b.status !== 'Resolved').length;
  const selectedBug = bugs.find((b) => b.id === selectedBugId) || null;

  const handleColumnDrop = (status) => {
    if (draggingId) updateStatus(draggingId, status);
    setDraggingId(null);
    setDragOverCol(null);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-950" style={{ fontFamily: SANS }}>
      <GlobalStyle />

      {/* Signature stripe: mirrors the four workflow stages, left to right */}
      <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(to right, #64748b, #818cf8, #38bdf8, #34d399)' }} />

      <Header totalCount={bugs.length} criticalOpenCount={criticalOpenCount} onLogNew={() => setShowLogModal(true)} />

      <FilterBar
        search={search} setSearch={setSearch}
        filterSeverity={filterSeverity} setFilterSeverity={setFilterSeverity}
        filterPriority={filterPriority} setFilterPriority={setFilterPriority}
        filterEnv={filterEnv} setFilterEnv={setFilterEnv}
        envOptions={envOptions}
        onClear={clearFilters}
        filtersActive={filtersActive}
      />

      <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
        {bugs.length === 0 ? (
          <EmptyState onLogNew={() => setShowLogModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                bugs={filteredBugs.filter((b) => b.status === status)}
                onOpen={(bug) => setSelectedBugId(bug.id)}
                onDrop={handleColumnDrop}
                onColumnDragOver={setDragOverCol}
                isOver={dragOverCol === status}
                draggingId={draggingId}
                onCardDragStart={setDraggingId}
                onCardDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
              />
            ))}
          </div>
        )}
      </main>

      {showLogModal && (
        <LogBugModal
          onClose={() => setShowLogModal(false)}
          nextId={nextBugId(bugs)}
          onSubmit={(bug) => { addBug(bug); setShowLogModal(false); }}
        />
      )}

      {selectedBug && (
        <DetailModal
          bug={selectedBug}
          onClose={() => setSelectedBugId(null)}
          onStatusChange={(status) => updateStatus(selectedBug.id, status)}
          onDelete={() => deleteBug(selectedBug.id)}
        />
      )}
    </div>
  );
}
