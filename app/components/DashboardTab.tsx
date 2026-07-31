import { Check, Clock, Plus, Target, Trophy, Activity, ArrowRight, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Priority = "low" | "medium" | "high";
type Task = { id: number; text: string; dueDate?: string; dueDates?: string[]; done: boolean; archived?: boolean; completedAt?: string; priority?: Priority; areaName?: string; subName?: string };
type SubArea = { id: number; name: string; tasks: Task[]; noteHTML?: string };
type Area = { id: number; name: string; subareas: SubArea[] };

const AREA_TONES = [
  { dot: "bg-sky-400", fill: "bg-sky-400", wash: "bg-sky-400/10", ring: "ring-sky-400/20" },
  { dot: "bg-emerald-400", fill: "bg-emerald-400", wash: "bg-emerald-400/10", ring: "ring-emerald-400/20" },
  { dot: "bg-amber-400", fill: "bg-amber-400", wash: "bg-amber-400/10", ring: "ring-amber-400/20" },
  { dot: "bg-rose-400", fill: "bg-rose-400", wash: "bg-rose-400/10", ring: "ring-rose-400/20" },
  { dot: "bg-cyan-400", fill: "bg-cyan-400", wash: "bg-cyan-400/10", ring: "ring-cyan-400/20" },
  { dot: "bg-violet-400", fill: "bg-violet-400", wash: "bg-violet-400/10", ring: "ring-violet-400/20" },
] as const;

const getAreaTone = (areaId: number) => AREA_TONES[(areaId - 1) % AREA_TONES.length];

export default function DashboardTab({ 
  tasks, 
  areas, 
  archivedTasks, 
  openModal,
  toggleTask,
  setTab
}: { 
  tasks: Task[];
  areas: Area[];
  archivedTasks: Task[];
  openModal: (type: "task" | "area") => void;
  toggleTask: (taskId: number) => void;
  setTab: (t: any) => void;
}) {
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  
  // Today's tasks (due today or overdue, not done)
  const todayTasks = tasks.filter(t => !t.done && ((t.dueDate && t.dueDate <= todayStr) || (t.dueDates && t.dueDates.some(d => d <= todayStr))))
    .sort((a, b) => (a.priority === "high" ? -1 : 1));

  // Recent 5 completed tasks
  const recentCompleted = archivedTasks.slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "İyi Geceler";
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  return (
    <div className="space-y-8 mt-4 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent mb-1">{new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
          <h1 className="text-4xl font-bold tracking-tight">{getGreeting()}, Berat!</h1>
          <p className="mt-2 text-muted max-w-lg">Bugün odaklanman gereken {todayTasks.length} adet görev bulunuyor. Hadi güne harika bir başlangıç yapalım.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Tasks */}
        <section className="lg:col-span-2 flex flex-col border border-line rounded-3xl bg-card/60 backdrop-blur-md overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-line/80">
          <div className="p-6 border-b border-line/50 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="text-accent" /> Bugünün Görevleri
            </h2>
            <span className="bg-accent/10 text-accent font-semibold px-2.5 py-1 rounded-lg text-xs">
              {todayTasks.length} Görev
            </span>
          </div>
          
          <div className="p-6 flex-1 bg-gradient-to-b from-transparent to-page/20">
            {todayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-80">
                <div className="w-16 h-16 bg-line/50 rounded-full flex items-center justify-center mb-4">
                  <Check size={28} className="text-muted" />
                </div>
                <h3 className="font-semibold text-ink">Bugün için her şey tamam!</h3>
                <p className="text-sm text-muted mt-1">Harika bir iş çıkardın, yeni bir görev ekleyebilir veya dinlenebilirsin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {todayTasks.map(task => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center gap-4 rounded-xl border border-line bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <button type="button" onClick={() => toggleTask(task.id)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-muted transition-all hover:border-accent hover:bg-accent/10">
                        {task.done && <Check size={14} strokeWidth={3} />}
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-ink truncate">{task.text}</span>
                        <span className="text-xs font-medium text-muted truncate">{task.areaName} / {task.subName}</span>
                      </div>
                      {task.priority === "high" && <span className="w-2 h-2 rounded-full bg-danger shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="Yüksek Öncelik" />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Progress & Recent */}
        <div className="space-y-6">
          {/* Areas Progress */}
          <section className="border border-line rounded-3xl bg-card/60 backdrop-blur-md overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="p-5 border-b border-line/50 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity size={18} className="text-priority-low" /> Alan İlerlemesi
              </h2>
              <button onClick={() => setTab("areas")} className="text-xs font-medium text-muted hover:text-ink flex items-center">
                Tümü <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {areas.length === 0 ? (
                <p className="text-xs text-muted text-center">Henüz alan eklenmedi.</p>
              ) : (
                areas.slice(0, 4).map(area => {
                  let total = 0;
                  let done = 0;
                  area.subareas.forEach(sub => {
                    total += sub.tasks.length;
                    done += sub.tasks.filter(t => t.done || t.archived).length;
                  });
                  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
                  const tone = getAreaTone(area.id);
                  
                  return (
                    <div key={area.id} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-ink truncate pr-2 flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                          {area.name}
                        </span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.wash} ${tone.ring}`}>{percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-line rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${tone.fill}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="border border-line rounded-3xl bg-card/60 backdrop-blur-md overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="p-5 border-b border-line/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Trophy size={18} className="text-priority-medium" /> Son Başarılar
              </h2>
            </div>
            <div className="p-5">
              {recentCompleted.length === 0 ? (
                <p className="text-xs text-muted text-center py-2">Henüz tamamlanan görev yok.</p>
              ) : (
                <div className="space-y-4">
                  {recentCompleted.map(task => (
                    <div key={task.id} className="flex gap-3">
                      <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-priority-low/20 text-priority-low flex items-center justify-center">
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate opacity-90 line-through decoration-muted">{task.text}</p>
                        <p className="text-[10px] font-medium text-faint mt-0.5 truncate">{task.areaName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
