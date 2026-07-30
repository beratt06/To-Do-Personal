import { useState, useEffect } from "react";
import { Plus, Trash2, Briefcase, Link2, Clock, CheckCircle, XCircle, Search, Building2 } from "lucide-react";
import RichEditor from "./RichEditor";

export type AppStatus = "applied" | "interview" | "rejected" | "offer";

export type Application = {
  id: number;
  company: string;
  position: string;
  date: string;
  link: string;
  status: AppStatus;
  noteHTML: string;
  updatedAt: string;
};

const STATUS_CONFIG = {
  applied: { label: "Beklemede", color: "text-priority-medium border-priority-medium/30 bg-priority-medium/10", icon: Clock },
  interview: { label: "Mülakat", color: "text-accent border-accent/30 bg-accent/10", icon: Briefcase },
  rejected: { label: "Red", color: "text-danger border-danger/30 bg-danger/10", icon: XCircle },
  offer: { label: "Kabul", color: "text-priority-low border-priority-low/30 bg-priority-low/10", icon: CheckCircle },
};

export default function ApplicationsTab({ playSound }: { playSound: (type: "pop" | "dink" | "delete") => void }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("focusflow-applications");
    if (saved) {
      const parsed = JSON.parse(saved);
      setApplications(parsed);
      if (parsed.length > 0) setActiveAppId(parsed[0].id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("focusflow-applications", JSON.stringify(applications));
    }
  }, [applications, isLoaded]);

  const activeApp = applications.find(a => a.id === activeAppId);

  const filteredApps = applications.filter(app => 
    app.company.toLowerCase().includes(search.toLowerCase()) || 
    app.position.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const createApp = () => {
    const newApp: Application = {
      id: Date.now(),
      company: "Yeni Şirket",
      position: "Pozisyon",
      date: new Date().toISOString().slice(0, 10),
      link: "",
      status: "applied",
      noteHTML: "",
      updatedAt: new Date().toISOString()
    };
    setApplications(prev => [newApp, ...prev]);
    setActiveAppId(newApp.id);
    setSearch("");
    playSound("dink");
  };

  const updateApp = (id: number, updates: Partial<Application>) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
  };

  const deleteApp = (id: number) => {
    if (!confirm("Bu başvuruyu kalıcı olarak silmek istediğine emin misin?")) return;
    playSound("delete");
    setApplications(prev => {
      const next = prev.filter(a => a.id !== id);
      if (activeAppId === id) {
        setActiveAppId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] h-[calc(100vh-140px)] min-h-[600px] mt-4">
      {/* Sidebar List */}
      <aside className="flex flex-col border border-line rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line bg-page/50 space-y-3">
          <button type="button" onClick={createApp} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md">
            <Plus size={18} /> Yeni Başvuru
          </button>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Şirket veya pozisyon ara..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-page pl-9 pr-4 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar p-2 space-y-1">
          {filteredApps.length === 0 ? (
            <div className="text-center p-6 text-sm text-muted">
              {search ? "Sonuç bulunamadı." : "Henüz başvuru yok."}
            </div>
          ) : (
            filteredApps.map(app => {
              const statusConf = STATUS_CONFIG[app.status];
              const StatusIcon = statusConf.icon;
              return (
                <button 
                  type="button"
                  key={app.id} 
                  onClick={() => setActiveAppId(app.id)}
                  className={`group flex w-full flex-col text-left rounded-xl px-4 py-3 transition-all ${activeAppId === app.id ? "bg-selected border-line/50 border shadow-sm" : "hover:bg-hover border border-transparent"}`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`font-semibold block truncate text-sm ${activeAppId === app.id ? "text-ink" : "text-ink/90"}`}>
                        {app.company}
                      </span>
                      <span className="text-xs font-medium text-muted block truncate mt-0.5">
                        {app.position}
                      </span>
                    </div>
                    <div onClick={e => { e.stopPropagation(); deleteApp(app.id); }} className={`p-1.5 shrink-0 rounded text-muted hover:text-danger hover:bg-danger-subtle transition-colors ${activeAppId === app.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} title="Başvuruyu Sil">
                      <Trash2 size={14} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${statusConf.color}`}>
                      <StatusIcon size={10} />
                      {statusConf.label}
                    </span>
                    <span className="text-[10px] font-medium text-faint">
                      {new Date(app.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Main Content View */}
      <section className="flex flex-col border border-line rounded-2xl bg-card overflow-hidden shadow-sm relative">
        {activeApp ? (
          <>
            <div className="px-8 pt-8 pb-6 border-b border-line bg-page/30 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="shrink-0 h-16 w-16 bg-line/30 rounded-2xl flex items-center justify-center text-muted border border-line/50 shadow-sm">
                  <Building2 size={32} />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    type="text"
                    value={activeApp.company}
                    onChange={(e) => updateApp(activeApp.id, { company: e.target.value })}
                    placeholder="Şirket Adı"
                    className="w-full bg-transparent text-3xl font-bold text-ink outline-none placeholder:text-muted/40 transition-colors focus:placeholder:text-muted/20"
                  />
                  <input
                    type="text"
                    value={activeApp.position}
                    onChange={(e) => updateApp(activeApp.id, { position: e.target.value })}
                    placeholder="Pozisyon (Örn: Frontend Developer)"
                    className="w-full bg-transparent text-lg font-medium text-muted outline-none placeholder:text-muted/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-faint uppercase tracking-wider">Durum</label>
                  <select 
                    value={activeApp.status} 
                    onChange={e => { updateApp(activeApp.id, { status: e.target.value as AppStatus }); playSound("pop"); }}
                    className={`w-full appearance-none rounded-xl border border-line bg-page px-3 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent ${STATUS_CONFIG[activeApp.status].color.split(' ')[0]}`}
                  >
                    <option value="applied">Beklemede</option>
                    <option value="interview">Mülakat Süreci</option>
                    <option value="rejected">Reddedildi</option>
                    <option value="offer">Kabul Edildi</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-faint uppercase tracking-wider">Başvuru Tarihi</label>
                  <input 
                    type="date" 
                    value={activeApp.date} 
                    onChange={e => updateApp(activeApp.id, { date: e.target.value })}
                    className="w-full rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-faint uppercase tracking-wider">İlan Linki (Opsiyonel)</label>
                  <div className="relative">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="url" 
                      value={activeApp.link} 
                      onChange={e => updateApp(activeApp.id, { link: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-line bg-page pl-8 pr-3 py-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted/50"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rich Editor for notes specific to this application */}
            <div className="flex-1 overflow-hidden bg-card">
              <RichEditor 
                content={activeApp.noteHTML} 
                onChange={(html) => updateApp(activeApp.id, { noteHTML: html })} 
                placeholder="Mülakat soruları, şirket hakkında bilgiler veya notlar..." 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted p-12 text-center">
            <div className="mb-4 p-5 rounded-full bg-line/30">
              <Briefcase size={32} className="text-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-ink/70 mb-2">Başvuru Takibi</h3>
            <p className="text-sm font-medium max-w-sm">Sol taraftan bir başvuru seçerek detaylarına ulaşabilir veya yeni bir başvuru ekleyebilirsin.</p>
          </div>
        )}
      </section>
    </div>
  );
}
