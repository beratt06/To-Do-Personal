"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronRight, Check, Moon, Plus, Sun, X, Archive as ArchiveIcon, AlertCircle, Clock, Trash2, Edit3, Briefcase, LayoutDashboard, FileText, Settings, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotesTab from "./components/NotesTab";
import ApplicationsTab from "./components/ApplicationsTab";
import DashboardTab from "./components/DashboardTab";
import RoadmapsTab from "./components/RoadmapsTab";
import SettingsTab from "./components/SettingsTab";
import PinLockModal from "./components/PinLockModal";

type Priority = "low" | "medium" | "high";
type Task = { id: number; text: string; dueDate?: string; dueDates?: string[]; done: boolean; archived?: boolean; completedAt?: string; priority?: Priority; noteHTML?: string };
type SubArea = { id: number; name: string; tasks: Task[]; noteHTML?: string };
type Area = { id: number; name: string; subareas: SubArea[]; lastAccessed?: number };
type Tab = "dashboard" | "areas" | "calendar" | "archive" | "notes" | "applications" | "roadmaps" | "settings";
type Modal = "area" | "subarea" | "task" | "day" | null;

const defaultAreas: Area[] = [
  { 
    id: 1, 
    name: "Siber Güvenlik", 
    subareas: [{ id: 11, name: "Network Security", tasks: [{ id: 1, text: "Firewall Kur", done: false, priority: "high", noteHTML: "<h1>Firewall Kurulumu</h1><p>iptables ve port yönlendirme notları...</p>" }] }],
    lastAccessed: Date.now()
  },
  { 
    id: 2, 
    name: "Gömülü Sistemler", 
    subareas: [{ id: 21, name: "Genel", tasks: [{ id: 2, text: "Mikrodenetleyici programlama", done: false, priority: "medium" }] }],
    lastAccessed: Date.now() - 1000
  },
  { id: 3, name: "Yapay Zeka", subareas: [{ id: 31, name: "RAG ve LLM", tasks: [{ id: 3, text: "Transformer mimarisini tekrar et", dueDate: "2026-08-04", done: false, priority: "high" }] }] },
  { id: 4, name: "Web Geliştirme", subareas: [{ id: 41, name: "Next.js", tasks: [{ id: 4, text: "API route testlerini yaz", dueDate: "2026-08-12", done: false, priority: "low" }] }] },
];

const today = new Date();
const dateKey = (date: Date) => { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); };
const formatDate = (date: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
const formatShortDate = (date: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));

const PRIORITY_COLORS = {
  high: "text-priority-high border-priority-high/30 bg-priority-high/10",
  medium: "text-priority-medium border-priority-medium/30 bg-priority-medium/10",
  low: "text-priority-low border-priority-low/30 bg-priority-low/10"
};
const PRIORITY_LABELS = { high: "Yüksek", medium: "Orta", low: "Düşük" };

const playSound = (type: "pop" | "dink" | "delete" = "dink") => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === "pop") {
      osc.type = "sine"; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === "dink") {
      osc.type = "sine"; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(1500, now + 0.05);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === "delete") {
      osc.type = "square"; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    }
  } catch (e) {}
};

function migrateAreas(value: unknown): Area[] {
  if (!Array.isArray(value)) return defaultAreas;
  return value.map((area: any, index: number) => ({
    id: area.id,
    name: area.name,
    lastAccessed: area.lastAccessed || (Date.now() - index * 1000), // preserve order for old data
    subareas: (area.subareas || [{ id: Date.now(), name: "Genel", tasks: area.tasks || [] }]).map((sub: any) => ({
      id: sub.id,
      name: sub.name,
      tasks: (sub.tasks || []).map((task: any) => ({
        id: task.id,
        text: task.text,
        dueDate: (!task.dueDate || task.dueDate === "2099-12-31") ? undefined : task.dueDate,
        dueDates: Array.isArray(task.dueDates) ? task.dueDates : (task.dueDate ? [task.dueDate] : undefined),
        done: Boolean(task.done),
        archived: task.archived !== undefined ? Boolean(task.archived) : Boolean(task.done),
        completedAt: task.completedAt,
        priority: task.priority || "medium",
        noteHTML: task.noteHTML
      })),
      noteHTML: sub.noteHTML
    }))
  }));
}

import RichEditor from "./components/RichEditor";

export default function Home() {
  const [areas, setAreas] = useState<Area[]>(defaultAreas); 
  const [activeAreaId, setActiveAreaId] = useState(1); 
  const [activeSubId, setActiveSubId] = useState(11); 
  const [tab, setTab] = useState<Tab>("dashboard"); 
  const [theme, setTheme] = useState("dark"); 
  const [calendarOpen, setCalendarOpen] = useState(false); 
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modal, setModal] = useState<Modal>(null); 
  const [name, setName] = useState(""); 
  const [taskDraft, setTaskDraft] = useState<{text: string, dueDates: string[], priority: Priority}>({ text: "", dueDates: [], priority: "medium" });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [subView, setSubView] = useState<"tasks" | "notes">("tasks");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  const activeArea = areas.find(area => area.id === activeAreaId) || areas[0]; 
  const activeSub = activeArea?.subareas?.find(sub => sub.id === activeSubId) || activeArea?.subareas?.[0];
  
  // Active tasks = NOT archived. Done tasks can still be active until archived.
  const activeTasks = useMemo(() => {
    if (!activeSub) return [];
    return [...activeSub.tasks]
      .filter(task => !task.archived)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const dateA = a.dueDate || (a.dueDates?.[0]) || null;
        const dateB = b.dueDate || (b.dueDates?.[0]) || null;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      });
  }, [activeSub]);

  const archivedTasks = useMemo(() => areas.flatMap(area => area.subareas.flatMap(sub => sub.tasks.filter(task => task.archived).map(task => ({ ...task, areaName: area.name, subName: sub.name })))).sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")), [areas]);
  const allActiveTasks = useMemo(() => areas.flatMap(area => area.subareas.flatMap(sub => sub.tasks.filter(task => !task.archived).map(task => ({ ...task, areaName: area.name, subName: sub.name })))), [areas]);

  useEffect(() => { 
    const savedTheme = localStorage.getItem("focusflow-theme") || "dark"; 
    setTheme(savedTheme); 
    document.documentElement.classList.toggle("light", savedTheme === "light"); 
    const savedAreas = localStorage.getItem("focusflow-areas"); 
    const pwd = localStorage.getItem("focusflow-password-hash") || localStorage.getItem("focusflow-password") || localStorage.getItem("focusflow-pin");
    if (pwd) {
      setIsLocked(true);
      setHasPin(true);
    }
    if (savedAreas) { 
      try {
        const parsed = JSON.parse(savedAreas);
        // If the user's data is exactly the old default (meaning it was wiped and replaced by old defaults)
        // We inject the new personalized defaults.
        const isOldDefault = parsed.length === 3 && parsed[0].name === "Yapay Zeka" && parsed[2].name === "İngilizce" && parsed[0].subareas[0].tasks.length <= 2;
        
        if (isOldDefault) {
          setAreas(defaultAreas);
          setActiveAreaId(defaultAreas[0].id);
          setActiveSubId(defaultAreas[0].subareas[0].id);
        } else if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          const next = migrateAreas(parsed); 
          setAreas(next); 
          setActiveAreaId(next[0]?.id || 1); 
          setActiveSubId(next[0]?.subareas[0]?.id || 0); 
        }
      } catch (e) {
        console.error("Failed to parse areas from localStorage", e);
      }
    } 
    setIsLoaded(true);
  }, []);

  // Security Hardening: Auto-lock when tab loses focus or on 5-minute idle timeout
  useEffect(() => {
    let idleTimer: any;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      const hasSecurity = Boolean(localStorage.getItem("focusflow-password-hash") || localStorage.getItem("focusflow-password") || localStorage.getItem("focusflow-pin"));
      if (hasSecurity) {
        idleTimer = setTimeout(() => {
          setIsLocked(true);
        }, 5 * 60 * 1000); // 5 minutes idle
      }
    };

    const handleVisibilityChange = () => {
      const hasSecurity = Boolean(localStorage.getItem("focusflow-password-hash") || localStorage.getItem("focusflow-password") || localStorage.getItem("focusflow-pin"));
      if (document.hidden && hasSecurity) {
        setIsLocked(true);
      }
    };

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => { 
    if (isLoaded) {
      const serialized = JSON.stringify(areas);
      localStorage.setItem("focusflow-areas", serialized); 
      
      try {
        const historyRaw = localStorage.getItem("focusflow-backups");
        let history = historyRaw ? JSON.parse(historyRaw) : [];
        if (history.length === 0 || history[0].data !== serialized) {
            history.unshift({ timestamp: Date.now(), data: serialized });
            if (history.length > 15) history = history.slice(0, 15);
            localStorage.setItem("focusflow-backups", JSON.stringify(history));
        }
      } catch(e) {}
    }
  }, [areas, isLoaded]);
  
  const chooseArea = (id: number) => { 
    const next = areas.find(area => area.id === id); 
    setActiveAreaId(id); 
    setActiveSubId(next?.subareas[0]?.id || 0); 
    setSubView("tasks");
  };
  
  const notify = (message: string) => { 
    setToast(message); 
    setTimeout(() => setToast(""), 2200); 
  };
  
  const toggleTheme = () => { 
    const next = theme === "dark" ? "light" : "dark"; 
    setTheme(next); 
    localStorage.setItem("focusflow-theme", next); 
    document.documentElement.classList.toggle("light", next === "light"); 
  };
  
  const toggleTask = (taskId: number) => {
    playSound("pop");
    setAreas(current => current.map(area => area.id === activeAreaId ? { ...area, lastAccessed: Date.now(), subareas: area.subareas.map(sub => sub.id === activeSubId ? { ...sub, tasks: sub.tasks.map(task => task.id === taskId ? { ...task, done: !task.done, completedAt: !task.done ? new Date().toISOString() : undefined } : task) } : sub) } : area));
  };

  const archiveTask = (taskId: number) => {
    playSound("dink");
    setAreas(current => current.map(area => area.id === activeAreaId ? { ...area, lastAccessed: Date.now(), subareas: area.subareas.map(sub => sub.id === activeSubId ? { ...sub, tasks: sub.tasks.map(task => task.id === taskId ? { ...task, archived: true, done: true, completedAt: task.completedAt || new Date().toISOString() } : task) } : sub) } : area));
    notify("Görev arşivlendi");
  };

  const deleteTask = (taskId: number) => {
    playSound("delete");
    setAreas(current => current.map(area => area.id === activeAreaId ? { ...area, lastAccessed: Date.now(), subareas: area.subareas.map(sub => ({ ...sub, tasks: sub.tasks.filter(task => task.id !== taskId) })) } : area));
    notify("Görev silindi");
  };

  const deleteArea = (areaId: number) => {
    if (!confirm("Bu çalışma alanını ve içindeki her şeyi silmek istediğine emin misin?")) return;
    playSound("delete");
    setAreas(current => {
      const next = current.filter(a => a.id !== areaId);
      if (activeAreaId === areaId) {
        setActiveAreaId(next[0]?.id || 0);
        setActiveSubId(next[0]?.subareas[0]?.id || 0);
      }
      return next;
    });
    notify("Çalışma alanı silindi");
  };

  const deleteSubarea = (subId: number) => {
    if (!confirm("Bu alt alanı ve içindeki görevleri silmek istediğine emin misin?")) return;
    playSound("delete");
    setAreas(current => current.map(area => {
      if (area.id === activeAreaId) {
        const nextSubs = area.subareas.filter(s => s.id !== subId);
        if (activeSubId === subId) setActiveSubId(nextSubs[0]?.id || 0);
        return { ...area, lastAccessed: Date.now(), subareas: nextSubs };
      }
      return area;
    }));
    notify("Alt alan silindi");
  };

  const openModal = (type: Modal, dayStr?: string) => { 
    setModal(type); 
    setName(""); 
    setTaskDraft({ text: "", dueDates: dayStr ? [dayStr] : [], priority: "medium" }); 
    if (dayStr) setSelectedDay(dayStr);
  };
  
  const saveModal = () => { 
    const value = name.trim(); 
    if (modal === "area" && value) { 
      const next = { id: Date.now(), name: value, subareas: [], lastAccessed: Date.now() }; 
      setAreas(current => [...current, next]); 
      chooseArea(next.id); 
      playSound("dink");
      notify("Çalışma alanı eklendi"); 
    } 
    if (modal === "subarea" && value) { 
      const next = { id: Date.now(), name: value, tasks: [], noteHTML: "" }; 
      setAreas(current => current.map(area => area.id === activeAreaId ? { ...area, lastAccessed: Date.now(), subareas: [...area.subareas, next] } : area)); 
      setActiveSubId(next.id); 
      setSubView("tasks");
      playSound("dink");
      notify("Alt alan eklendi"); 
    } 
    if (modal === "task" && taskDraft.text.trim()) { 
      const firstDate = taskDraft.dueDates.length > 0 ? taskDraft.dueDates[0] : undefined;
      const next: Task = { 
        id: Date.now(), 
        text: taskDraft.text.trim(), 
        dueDate: firstDate, 
        dueDates: taskDraft.dueDates.length > 0 ? taskDraft.dueDates : undefined,
        done: false, 
        archived: false, 
        priority: taskDraft.priority 
      };

      setAreas(current => current.map(area => area.id === activeAreaId ? { 
        ...area, 
        lastAccessed: Date.now(), 
        subareas: area.subareas.map(sub => sub.id === activeSubId ? { 
          ...sub, 
          tasks: [...sub.tasks, next] 
        } : sub) 
      } : area)); 
      
      playSound("dink");
      notify("Görev eklendi"); 
    } 
    setModal(null);  
  };
  
  const monthDays = useMemo(() => { 
    const first = new Date(month.getFullYear(), month.getMonth(), 1); 
    const start = new Date(first); 
    start.setDate(first.getDate() - (first.getDay() === 0 ? 6 : first.getDay() - 1)); // start from Monday
    return Array.from({ length: 42 }, (_, index) => { 
      const dayDate = new Date(start); 
      dayDate.setDate(start.getDate() + index); 
      return dayDate; 
    }); 
  }, [month]);

  return (
    <main className="min-h-screen bg-page text-ink transition-colors duration-300">
      <AnimatePresence>
        {isLocked && (
          <PinLockModal mode="unlock" onSuccess={() => setIsLocked(false)} />
        )}
      </AnimatePresence>
      <header className="sticky top-0 z-10 border-b border-line bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <button type="button" onClick={() => { setTab("areas"); chooseArea(activeAreaId); }} className="text-xl font-bold tracking-tight bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
            FocusFlow
          </button>
          <div className="flex items-center gap-6">
            <nav className="hidden gap-6 text-sm font-medium sm:flex">
              <button type="button" onClick={() => setTab("dashboard")} className={`transition-colors ${tab === "dashboard" ? "text-accent" : "text-muted hover:text-ink"}`}>Genel Bakış</button>
              <button type="button" onClick={() => setTab("areas")} className={`transition-colors ${tab === "areas" ? "text-accent" : "text-muted hover:text-ink"}`}>Alanlar</button>
              <button type="button" onClick={() => setTab("calendar")} className={`transition-colors ${tab === "calendar" ? "text-accent" : "text-muted hover:text-ink"}`}>Takvim</button>
              <button type="button" onClick={() => setTab("archive")} className={`transition-colors ${tab === "archive" ? "text-accent" : "text-muted hover:text-ink"}`}>Arşiv</button>
              <button type="button" onClick={() => setTab("notes")} className={`transition-colors ${tab === "notes" ? "text-accent" : "text-muted hover:text-ink"}`}>Notlar</button>
              <button type="button" onClick={() => setTab("applications")} className={`transition-colors ${tab === "applications" ? "text-accent" : "text-muted hover:text-ink"}`}>Başvurular</button>
              <button type="button" onClick={() => setTab("roadmaps")} className={`transition-colors ${tab === "roadmaps" ? "text-accent" : "text-muted hover:text-ink"}`}>Yol Haritaları</button>
              <button type="button" onClick={() => setTab("settings")} className={`flex items-center gap-1.5 transition-colors ${tab === "settings" ? "text-accent" : "text-muted hover:text-ink"}`}>
                <Settings size={14} /> Ayarlar
              </button>
            </nav>
            <div className="flex items-center gap-2">
              {hasPin && (
                <button type="button" aria-label="Uygulamayı kilitle" onClick={() => setIsLocked(true)} className="rounded-full border border-line bg-card p-2 text-muted shadow-sm transition-all hover:text-accent hover:shadow-md" title="Uygulamayı Kilitle">
                  <Lock size={18} />
                </button>
              )}
              <button type="button" aria-label="Temayı değiştir" onClick={toggleTheme} className="rounded-full border border-line bg-card p-2 text-muted shadow-sm transition-all hover:text-ink hover:shadow-md">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-line px-5 py-3 text-sm font-medium sm:hidden scrollbar">
          <button type="button" onClick={() => setTab("dashboard")} className={tab === "dashboard" ? "text-accent" : "text-muted"}>Genel Bakış</button>
          <button type="button" onClick={() => setTab("areas")} className={tab === "areas" ? "text-accent" : "text-muted"}>Alanlar</button>
          <button type="button" onClick={() => setTab("calendar")} className={tab === "calendar" ? "text-accent" : "text-muted"}>Takvim</button>
          <button type="button" onClick={() => setTab("archive")} className={tab === "archive" ? "text-accent" : "text-muted"}>Arşiv</button>
          <button type="button" onClick={() => setTab("notes")} className={tab === "notes" ? "text-accent" : "text-muted"}>Notlar</button>
          <button type="button" onClick={() => setTab("applications")} className={tab === "applications" ? "text-accent" : "text-muted"}>Başvurular</button>
          <button type="button" onClick={() => setTab("roadmaps")} className={tab === "roadmaps" ? "text-accent" : "text-muted"}>Yol Haritaları</button>
          <button type="button" onClick={() => setTab("settings")} className={tab === "settings" ? "text-accent" : "text-muted flex items-center gap-1"}><Settings size={14}/> Ayarlar</button>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6 sm:py-10">
        
        {tab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DashboardTab 
              tasks={allActiveTasks} 
              areas={areas} 
              archivedTasks={archivedTasks} 
              openModal={openModal} 
              toggleTask={toggleTask} 
              setTab={setTab} 
            />
          </motion.div>
        )}

        {tab === "areas" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-accent">Çalışma alanlarım</p>
                <h1 className="mt-1 text-4xl font-bold tracking-tight">Nerede çalışıyoruz?</h1>
              </div>
              <button type="button" onClick={() => openModal("area")} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg">
                <Plus size={18} /> Alan ekle
              </button>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <aside className="space-y-3">
                {[...areas].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)).map(area => {
                  let total = 0; let done = 0;
                  area.subareas.forEach(s => { total += s.tasks.length; done += s.tasks.filter(t => t.done || t.archived).length; });
                  const perc = total === 0 ? 0 : Math.round((done/total)*100);
                  
                  return (
                    <button type="button" key={area.id} onClick={() => chooseArea(area.id)} className={`group w-full flex flex-col gap-3 rounded-2xl px-5 py-4 text-left transition-all ${activeAreaId === area.id ? "bg-card text-ink shadow-sm border border-line" : "bg-card/50 text-muted hover:bg-card hover:text-ink border border-transparent"}`}>
                      <div className="flex items-center gap-3 w-full">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${activeAreaId === area.id ? "bg-accent" : "bg-muted/50"}`} />
                        <div className="flex-1 font-semibold flex items-center justify-between min-w-0">
                          <span className="truncate">{area.name}</span>
                          <span className="text-[10px] text-muted font-normal bg-page/80 px-2 py-0.5 rounded-full border border-line/50 shrink-0 ml-2">{total - done} görev</span>
                        </div>
                        <ChevronRight size={16} className={activeAreaId === area.id ? "opacity-100" : "opacity-0 transition-opacity group-hover:opacity-100"} />
                      </div>
                      <div className="w-full flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${activeAreaId === area.id ? "bg-accent" : "bg-muted/50"}`} style={{ width: `${perc}%` }} />
                        </div>
                        <span className="text-[10px] font-bold">{perc}%</span>
                      </div>
                    </button>
                  );
                })}
              </aside>
              
              <section className="min-w-0">
                {activeArea ? (
                  <>
                    <div className="mb-6 flex items-center justify-between border-b border-line pb-5">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          {activeArea.name}
                          <button type="button" onClick={() => deleteArea(activeArea.id)} className="rounded p-1 text-muted hover:bg-danger-subtle hover:text-danger transition-colors" title="Alanı Sil"><Trash2 size={16} /></button>
                        </h2>
                      </div>
                      <button type="button" onClick={() => openModal("subarea")} className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium text-muted transition-all hover:text-ink hover:shadow-sm">
                        <Plus size={16} /> Alt alan
                      </button>
                    </div>
                    
                    {activeArea.subareas.length === 0 ? (
                      <Empty text="Bu alanda henüz alt alan yok." />
                    ) : (
                      <div className="flex gap-2 overflow-x-auto border-b border-line pb-4 scrollbar">
                        {activeArea.subareas.map(sub => {
                          const activeCount = sub.tasks.filter(t => !t.done && !t.archived).length;
                          return (
                            <button type="button" key={sub.id} onClick={() => { setActiveSubId(sub.id); setSubView("tasks"); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${activeSubId === sub.id ? "bg-accent text-white shadow-md" : "bg-card text-muted hover:bg-hover hover:text-ink border border-line"}`}>
                              {sub.name}
                              {activeCount > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeSubId === sub.id ? "bg-white/20" : "bg-line/50"}`}>{activeCount}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {activeSub && (
                      <div className="mt-8">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {activeSub.name}
                              <button type="button" onClick={() => deleteSubarea(activeSub.id)} className="rounded p-1 text-muted hover:bg-danger-subtle hover:text-danger transition-colors" title="Alt Alanı Sil"><Trash2 size={14} /></button>
                            </h3>
                            <div className="flex bg-line/50 p-1 rounded-lg">
                              <button type="button" onClick={() => setSubView("tasks")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${subView === "tasks" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}>Görevler</button>
                              <button type="button" onClick={() => setSubView("notes")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${subView === "notes" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}>Notlar</button>
                            </div>
                          </div>
                          {subView === "tasks" && (
                            <button type="button" onClick={() => openModal("task")} className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium text-muted transition-all hover:text-ink hover:shadow-sm">
                              <Plus size={16} /> Görev ekle
                            </button>
                          )}
                        </div>
                        
                        {subView === "tasks" ? (
                          activeTasks.length === 0 ? (
                            <Empty text="Görev yok." />
                          ) : (
                            <div className="space-y-3">
                              <AnimatePresence>
                                {activeTasks.map(task => (
                                  <TaskRow 
                                    key={task.id} 
                                    task={task} 
                                    onComplete={() => toggleTask(task.id)} 
                                    onArchive={() => archiveTask(task.id)} 
                                    onDelete={() => deleteTask(task.id)} 
                                    isExpanded={expandedTaskId === task.id}
                                    onToggleExpand={() => setExpandedTaskId(prev => prev === task.id ? null : task.id)}
                                    onNoteChange={(html) => setAreas(current => current.map(area => area.id === activeAreaId ? { 
                                      ...area, 
                                      lastAccessed: Date.now(), 
                                      subareas: area.subareas.map(sub => sub.id === activeSubId ? { 
                                        ...sub, 
                                        tasks: sub.tasks.map(t => t.id === task.id ? { ...t, noteHTML: html } : t) 
                                      } : sub) 
                                    } : area))}
                                  />
                                ))}
                              </AnimatePresence>
                            </div>
                          )
                        ) : (
                          <div className="h-[400px] border border-line rounded-2xl bg-card overflow-hidden shadow-sm">
                            <RichEditor 
                              content={activeSub.noteHTML || ""} 
                              onChange={(html) => setAreas(current => current.map(area => area.id === activeAreaId ? { ...area, lastAccessed: Date.now(), subareas: area.subareas.map(sub => sub.id === activeSubId ? { ...sub, noteHTML: html } : sub) } : area))} 
                              placeholder={`${activeSub.name} için notlar...`} 
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button type="button" onClick={() => setCalendarOpen(open => !open)} className="mt-10 flex w-full items-center justify-between rounded-xl border border-line bg-card px-5 py-4 text-left text-sm font-medium transition-all hover:shadow-sm">
                      <span className="flex items-center gap-3"><CalendarDays size={18} className="text-accent" /> Takvimi göster</span>
                      {calendarOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    
                    <AnimatePresence>
                      {calendarOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <CalendarGrid days={monthDays} month={month} setMonth={setMonth} tasks={allActiveTasks} onDayClick={day => openModal("day", day)} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Empty text="Çalışma alanı seçin." />
                )}
              </section>
            </div>
          </motion.div>
        )}
        
        {tab === "calendar" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CalendarGrid days={monthDays} month={month} setMonth={setMonth} tasks={allActiveTasks} full onDayClick={day => openModal("day", day)} />
          </motion.div>
        )}
        
        {tab === "archive" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Archive tasks={archivedTasks} onDelete={deleteTask} />
          </motion.div>
        )}
        
        {tab === "notes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <NotesTab playSound={playSound} />
          </motion.div>
        )}
        
        {tab === "applications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ApplicationsTab playSound={playSound} />
          </motion.div>
        )}

        {tab === "roadmaps" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RoadmapsTab playSound={playSound} />
          </motion.div>
        )}

        {tab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SettingsTab areas={areas} setAreas={setAreas} />
          </motion.div>
        )}
      </div>

      {tab !== "dashboard" && (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          onClick={() => openModal("task")}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-8 md:left-auto md:right-8 md:translate-x-0 z-40 bg-accent text-white p-4 rounded-full shadow-[0_4px_14px_rgba(59,130,246,0.5)] hover:bg-accent-hover hover:scale-105 transition-all flex items-center justify-center group"
          title="Hızlı Görev Ekle"
        >
          <Plus size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-2 font-medium">
            Görev Ekle
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {modal && <EntryModal modal={modal} name={name} setName={setName} taskDraft={taskDraft} setTaskDraft={setTaskDraft} close={() => setModal(null)} save={saveModal} selectedDay={selectedDay} tasks={allActiveTasks} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 z-50 rounded-xl border border-line bg-card px-5 py-3.5 text-sm font-medium text-ink shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TaskRow({ task, onComplete, onArchive, onDelete, isExpanded, onToggleExpand, onNoteChange }: { task: Task; onComplete: () => void; onArchive: () => void; onDelete: () => void; isExpanded?: boolean; onToggleExpand?: () => void; onNoteChange?: (html: string) => void }) { 
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex flex-col gap-0 rounded-xl border transition-all ${task.done ? 'border-line/50 bg-card/50 opacity-70' : 'border-line bg-card shadow-sm hover:shadow-md'} overflow-hidden`}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <button type="button" aria-label={`${task.text} görevini tamamla`} onClick={onComplete} className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-all ${task.done ? 'bg-accent border-accent text-white' : 'border-muted hover:border-accent hover:bg-accent/10'}`}>
          {task.done && <Check size={14} strokeWidth={3} />}
        </button>
        
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={`text-sm font-medium transition-all ${task.done ? 'line-through text-muted' : 'text-ink'}`}>{task.text}</span>
          
          <div className="flex items-center gap-3 text-xs">
            {task.priority && (
              <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 border ${PRIORITY_COLORS[task.priority]}`}>
                <AlertCircle size={10} />
                {PRIORITY_LABELS[task.priority]}
              </span>
            )}
            
            {task.dueDates && task.dueDates.length > 1 ? (
              <span className="flex items-center gap-1 text-accent font-medium">
                <CalendarDays size={12} /> {task.dueDates.length} Tarih
              </span>
            ) : (task.dueDates && task.dueDates.length === 1) ? (
              <span className={`flex items-center gap-1 ${task.dueDates[0] < dateKey(today) && !task.done ? "font-semibold text-danger" : "text-muted"}`}>
                <CalendarDays size={12} /> 
                {formatShortDate(task.dueDates[0])}
              </span>
            ) : task.dueDate ? (
              <span className={`flex items-center gap-1 ${task.dueDate < dateKey(today) && !task.done ? "font-semibold text-danger" : "text-muted"}`}>
                <CalendarDays size={12} /> 
                {formatShortDate(task.dueDate)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onToggleExpand && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} className={`p-1.5 rounded transition-colors ${isExpanded ? 'bg-accent/20 text-accent' : 'text-muted hover:text-ink hover:bg-hover'}`} title="Görev Notları">
              <FileText size={16} />
            </button>
          )}
          {task.done && (
            <>
              <button type="button" onClick={onArchive} className="flex items-center gap-1.5 rounded-lg bg-hover px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-line hover:text-ink" title="Arşive taşı">
                <ArchiveIcon size={14} />
                <span className="hidden sm:inline">Arşivle</span>
              </button>
              <button type="button" onClick={onDelete} className="flex items-center justify-center rounded-lg bg-danger-subtle px-2 py-1.5 text-danger transition-colors hover:bg-danger hover:text-white" title="Görevi Sil">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && onNoteChange && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-line bg-page/30 overflow-hidden">
            <div className="p-4">
              <div className="h-[300px] border border-line rounded-xl bg-card overflow-hidden shadow-inner">
                 <RichEditor content={task.noteHTML || ""} onChange={onNoteChange} placeholder={`${task.text} görevi için detaylı notlar, komutlar, araçlar...`} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  ); 
}

function CalendarGrid({ days, month, setMonth, tasks, full = false, onDayClick }: { days: Date[]; month: Date; setMonth: (date: Date) => void; tasks: Array<Task & { areaName: string; subName: string }>; full?: boolean; onDayClick: (day: string) => void }) { 
  return (
    <section className={`${full ? "" : "mt-6"} rounded-2xl border border-line bg-card p-6 shadow-sm`}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Takvim</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Önceki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-page text-muted transition-colors hover:text-ink hover:bg-hover">‹</button>
          <span className="min-w-32 text-center text-sm font-semibold">{new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(month)}</span>
          <button type="button" aria-label="Sonraki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-page text-muted transition-colors hover:text-ink hover:bg-hover">›</button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <div className="contents">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(dayName => (
            <div key={dayName} className="bg-page px-2 py-3 text-center text-xs font-semibold text-muted">{dayName}</div>
          ))}
        </div>
        
        {days.map(day => { 
          const key = dateKey(day); 
          const dayTasks = tasks.filter(task => task.dueDate === key || task.dueDates?.includes(key));
          const outside = day.getMonth() !== month.getMonth(); 
          const isToday = key === dateKey(today);
          
          return (
            <div key={key} onClick={() => dayTasks.length > 0 && onDayClick(key)} className={`min-h-24 bg-card p-2 transition-colors ${dayTasks.length > 0 ? "cursor-pointer hover:bg-page/50" : ""} ${outside ? "opacity-40" : ""}`}>
              <div className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-accent font-bold text-white shadow-sm" : "text-muted font-medium"}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task.id} title={`${task.areaName} / ${task.subName}`} className={`truncate rounded border px-1.5 py-1 text-[10px] font-medium ${task.priority ? PRIORITY_COLORS[task.priority] : 'bg-accent/10 text-accent border-accent/20'} ${task.done ? 'opacity-50 line-through' : ''}`}>
                    {task.text}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted font-medium pl-1">+{dayTasks.length - 3} görev</div>
                )}
              </div>
            </div>
          ); 
        })}
      </div>
    </section>
  ); 
}

function Archive({ tasks, onDelete }: { tasks: Array<Task & { areaName: string; subName: string }>; onDelete: (id: number) => void }) { 
  return (
    <section>
      <div className="mb-10">
        <p className="text-sm font-medium text-accent">Görev geçmişi</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Arşiv</h1>
      </div>
      
      {tasks.length === 0 ? (
        <Empty text="Henüz arşivlenmiş görev yok." />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="flex flex-col gap-2 rounded-xl border border-line bg-card px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent border border-accent/20">
                <Check size={14} strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink line-through opacity-80">{task.text}</p>
                <p className="mt-1 text-xs font-medium text-muted">{task.areaName} / {task.subName}</p>
              </div>
              <div className="flex items-center gap-3">
                <time className="shrink-0 text-xs font-medium text-faint">
                  {task.completedAt ? formatDate(task.completedAt.slice(0, 10)) : "Arşivlendi"}
                </time>
                <button type="button" onClick={() => onDelete(task.id)} className="flex items-center justify-center rounded-lg bg-danger-subtle px-2 py-1.5 text-danger transition-colors hover:bg-danger hover:text-white" title="Kalıcı Olarak Sil">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  ); 
}

function Empty({ text }: { text: string }) { 
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/50 px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-line/50 p-3 text-muted">
        <ArchiveIcon size={24} />
      </div>
      <p className="text-sm font-medium text-muted">{text}</p>
    </div>
  ); 
}

function EntryModal({ modal, name, setName, taskDraft, setTaskDraft, close, save, selectedDay, tasks }: { modal: Exclude<Modal, null>; name: string; setName: (v: string) => void; taskDraft: { text: string; dueDates: string[], priority: Priority }; setTaskDraft: (v: { text: string; dueDates: string[], priority: Priority }) => void; close: () => void; save: () => void; selectedDay?: string | null; tasks?: Array<Task & { areaName: string; subName: string }> }) { 
  const isTask = modal === "task"; 
  const isDay = modal === "day";
  const dayTasks = isDay && selectedDay && tasks ? tasks.filter(t => t.dueDate === selectedDay || t.dueDates?.includes(selectedDay)) : []; 
  
  const [modalMonth, setModalMonth] = useState(new Date());
  const modalDays = useMemo(() => { 
    const first = new Date(modalMonth.getFullYear(), modalMonth.getMonth(), 1); 
    const start = new Date(first); 
    start.setDate(first.getDate() - (first.getDay() === 0 ? 6 : first.getDay() - 1)); 
    return Array.from({ length: 42 }, (_, index) => { 
      const dayDate = new Date(start); 
      dayDate.setDate(start.getDate() + index); 
      return dayDate; 
    }); 
  }, [modalMonth]);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && close()}>
      <motion.form initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onSubmit={event => { event.preventDefault(); save(); }} className="w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar rounded-2xl border border-line bg-card p-6 shadow-2xl">
        
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{isTask ? "Yeni Görev" : isDay ? formatDate(selectedDay || "") : modal === "subarea" ? "Yeni Alt Alan" : "Yeni Alan"}</h2>
          </div>
          <button type="button" onClick={close} className="rounded-full bg-page p-2 text-muted transition-colors hover:bg-hover hover:text-ink">
            <X size={18} />
          </button>
        </div>
        
        {isTask ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">GÖREV ADI</label>
              <input autoFocus required value={taskDraft.text} onChange={event => setTaskDraft({ ...taskDraft, text: event.target.value })} placeholder="Örn. Dokümantasyonu oku" className="w-full rounded-xl border border-line bg-page px-4 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-muted">ÖNCELİK</label>
                <select value={taskDraft.priority} onChange={event => setTaskDraft({ ...taskDraft, priority: event.target.value as Priority })} className="w-full appearance-none rounded-xl border border-line bg-page px-4 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20">
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted">
                  <span>TARİHLER (İsteğe Bağlı)</span>
                  {taskDraft.dueDates.length > 0 && <span className="text-accent">{taskDraft.dueDates.length} tarih seçildi</span>}
                </label>
                
                <div className="rounded-xl border border-line bg-page p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => setModalMonth(new Date(modalMonth.getFullYear(), modalMonth.getMonth() - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-hover hover:text-ink transition-colors">‹</button>
                    <span className="text-sm font-semibold">{new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(modalMonth)}</span>
                    <button type="button" onClick={() => setModalMonth(new Date(modalMonth.getFullYear(), modalMonth.getMonth() + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-hover hover:text-ink transition-colors">›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted font-medium">
                    {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {modalDays.map(d => {
                      const dStr = dateKey(d);
                      const isSelected = taskDraft.dueDates.includes(dStr);
                      const isCurrentMonth = d.getMonth() === modalMonth.getMonth();
                      const isToday = dStr === dateKey(today);
                      return (
                        <button 
                          type="button" 
                          key={dStr} 
                          onClick={() => setTaskDraft({
                            ...taskDraft,
                            dueDates: isSelected ? taskDraft.dueDates.filter((x: string) => x !== dStr) : [...taskDraft.dueDates, dStr].sort()
                          })}
                          className={`flex aspect-square items-center justify-center rounded-lg transition-all ${isSelected ? 'bg-accent text-white font-bold shadow-md' : isCurrentMonth ? 'text-ink hover:bg-hover hover:scale-105' : 'text-muted/30 hover:bg-hover'} ${!isSelected && isToday ? 'border border-accent/50 text-accent font-semibold' : ''}`}
                        >
                          {d.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">Aynı görevi birden fazla güne (örn: staj veya tekrarlı iş) eklemek için takvimde o günlere tıklaman yeterli.</p>
              </div>
            </div>
          </div>
        ) : isDay ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar pr-2">
            {dayTasks.length === 0 ? (
              <Empty text="Bu tarihte planlanmış bir görev yok." />
            ) : (
              dayTasks.map(task => (
                <div key={task.id} className="flex flex-col gap-1 rounded-xl border border-line bg-page px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${task.priority === 'high' ? 'bg-danger' : task.priority === 'medium' ? 'bg-priority-medium' : 'bg-priority-low'}`} />
                    <span className={`text-sm font-medium ${task.done ? 'line-through text-muted' : 'text-ink'}`}>{task.text}</span>
                  </div>
                  <div className="text-xs text-muted pl-4">
                    {task.areaName} / {task.subName}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">AD</label>
            <input autoFocus required value={name} onChange={event => setName(event.target.value)} placeholder={modal === "subarea" ? "Örn. Pratik" : "Örn. Tasarım"} className="w-full rounded-xl border border-line bg-page px-4 py-3 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20" />
          </div>
        )}
        
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={close} className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink">{isDay ? "Kapat" : "Vazgeç"}</button>
          {!isDay && (
            <button type="submit" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg">Kaydet</button>
          )}
        </div>
      </motion.form>
    </motion.div>
  ); 
}
