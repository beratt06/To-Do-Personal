import { useState, useEffect } from "react";
import { Plus, Trash2, Map, CheckCircle, Circle, ArrowRight, Edit3, ChevronRight, ChevronDown } from "lucide-react";
import RichEditor from "./RichEditor";

export type RoadmapNode = {
  id: number;
  title: string;
  status: "pending" | "done";
  noteHTML: string;
  children: RoadmapNode[];
  isExpanded?: boolean;
};

export type Roadmap = {
  id: number;
  title: string;
  nodes: RoadmapNode[];
  updatedAt: string;
};

export default function RoadmapsTab({ playSound }: { playSound: (type: "pop" | "dink" | "delete") => void }) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<number | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("focusflow-roadmaps-v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      setRoadmaps(parsed);
      if (parsed.length > 0) setActiveRoadmapId(parsed[0].id);
    } else {
      // Migrate from v1 if exists
      const old = localStorage.getItem("focusflow-roadmaps");
      if (old) {
        const parsed = JSON.parse(old);
        const migrated = parsed.map((r: any) => ({
          ...r,
          nodes: r.nodes.map((n: any) => ({ ...n, children: n.children || [], isExpanded: true }))
        }));
        setRoadmaps(migrated);
        if (migrated.length > 0) setActiveRoadmapId(migrated[0].id);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("focusflow-roadmaps-v2", JSON.stringify(roadmaps));
    }
  }, [roadmaps, isLoaded]);

  const activeRoadmap = roadmaps.find(r => r.id === activeRoadmapId);

  // Helper to find a node deep in the tree
  const findNode = (nodes: RoadmapNode[], id: number): RoadmapNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const activeNode = activeRoadmap ? findNode(activeRoadmap.nodes, activeNodeId || 0) : null;

  const createRoadmap = () => {
    const newRoadmap: Roadmap = {
      id: Date.now(),
      title: "Yeni Yol Haritası",
      nodes: [
        { id: Date.now() + 1, title: "Başlangıç", status: "pending", noteHTML: "", children: [], isExpanded: true }
      ],
      updatedAt: new Date().toISOString()
    };
    setRoadmaps(prev => [newRoadmap, ...prev]);
    setActiveRoadmapId(newRoadmap.id);
    setActiveNodeId(null);
    playSound("dink");
  };

  const updateRoadmapTitle = (id: number, title: string) => {
    setRoadmaps(prev => prev.map(r => r.id === id ? { ...r, title, updatedAt: new Date().toISOString() } : r));
  };

  const deleteRoadmap = (id: number) => {
    if (!confirm("Bu yol haritasını tamamen silmek istediğine emin misin?")) return;
    playSound("delete");
    setRoadmaps(prev => {
      const next = prev.filter(r => r.id !== id);
      if (activeRoadmapId === id) setActiveRoadmapId(next.length > 0 ? next[0].id : null);
      return next;
    });
  };

  const addNode = (roadmapId: number, parentId: number | null = null) => {
    const newNode: RoadmapNode = { id: Date.now(), title: "Yeni Aşama", status: "pending", noteHTML: "", children: [], isExpanded: true };
    
    setRoadmaps(prev => prev.map(r => {
      if (r.id !== roadmapId) return r;
      if (parentId === null) {
        return { ...r, nodes: [...r.nodes, newNode], updatedAt: new Date().toISOString() };
      }
      
      const insertRecursive = (nodes: RoadmapNode[]): RoadmapNode[] => {
        return nodes.map(n => {
          if (n.id === parentId) return { ...n, isExpanded: true, children: [...n.children, newNode] };
          return { ...n, children: insertRecursive(n.children) };
        });
      };
      return { ...r, nodes: insertRecursive(r.nodes), updatedAt: new Date().toISOString() };
    }));
    playSound("dink");
  };

  const updateNode = (roadmapId: number, nodeId: number, updates: Partial<RoadmapNode>) => {
    setRoadmaps(prev => prev.map(r => {
      if (r.id !== roadmapId) return r;
      const updateRecursive = (nodes: RoadmapNode[]): RoadmapNode[] => {
        return nodes.map(n => {
          if (n.id === nodeId) return { ...n, ...updates };
          return { ...n, children: updateRecursive(n.children) };
        });
      };
      return { ...r, nodes: updateRecursive(r.nodes), updatedAt: new Date().toISOString() };
    }));
  };

  const deleteNode = (roadmapId: number, nodeId: number) => {
    if (!confirm("Bu aşamayı (ve varsa tüm alt aşamalarını) silmek istediğine emin misin?")) return;
    playSound("delete");
    setRoadmaps(prev => prev.map(r => {
      if (r.id !== roadmapId) return r;
      const deleteRecursive = (nodes: RoadmapNode[]): RoadmapNode[] => {
        return nodes.filter(n => n.id !== nodeId).map(n => ({ ...n, children: deleteRecursive(n.children) }));
      };
      return { ...r, nodes: deleteRecursive(r.nodes), updatedAt: new Date().toISOString() };
    }));
    if (activeNodeId === nodeId) setActiveNodeId(null);
  };

  const renderNodes = (nodes: RoadmapNode[], depth: number = 0) => {
    return (
      <div className="space-y-4 relative">
        {nodes.map((node, index) => {
          const isDone = node.status === "done";
          const isActive = activeNodeId === node.id;
          const hasChildren = node.children && node.children.length > 0;
          
          return (
            <div key={node.id} className="relative">
              <div className="flex items-start gap-4 group">
                {/* Connecting lines logic for tree depth > 0 */}
                {depth > 0 && (
                  <div className="absolute -left-6 top-4 w-6 h-[2px] bg-line/80" />
                )}

                {/* Status Toggle / Dot */}
                <button 
                  onClick={() => {
                    updateNode(activeRoadmap!.id, node.id, { status: isDone ? "pending" : "done" });
                    playSound(isDone ? "dink" : "pop");
                  }}
                  className={`mt-1 h-7 w-7 shrink-0 z-10 rounded-full flex items-center justify-center border-2 transition-all bg-card ${isDone ? 'border-accent text-accent shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-line text-muted hover:border-accent/50'}`}
                >
                  {isDone ? <CheckCircle size={16} /> : <Circle size={12} />}
                </button>
                
                {/* Node Card */}
                <div 
                  className={`flex-1 rounded-xl border p-3 cursor-pointer transition-all ${isActive ? 'border-accent bg-accent/5 shadow-md scale-[1.01]' : 'border-line bg-card hover:border-accent/40 hover:shadow-sm'}`}
                  onClick={() => setActiveNodeId(node.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      {hasChildren && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateNode(activeRoadmap!.id, node.id, { isExpanded: !node.isExpanded }); }}
                          className="p-1 rounded bg-line/50 text-muted hover:text-ink hover:bg-line transition-colors"
                        >
                          <ChevronRight size={14} className={`transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                      <input
                        type="text"
                        value={node.title}
                        onChange={(e) => updateNode(activeRoadmap!.id, node.id, { title: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Aşama Adı..."
                        className={`bg-transparent text-sm font-bold outline-none w-full ${isDone ? 'text-muted line-through' : 'text-ink'}`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); addNode(activeRoadmap!.id, node.id); }} className="p-1.5 rounded bg-line/30 text-muted hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all" title="Alt Aşama Ekle"><Plus size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteNode(activeRoadmap!.id, node.id); }} className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger-subtle opacity-0 group-hover:opacity-100 transition-all" title="Sil"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recursive Children Rendering */}
              {hasChildren && node.isExpanded && (
                <div className="mt-4 ml-3.5 pl-8 border-l-2 border-line/50 relative">
                  {renderNodes(node.children, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isLoaded) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-[calc(100vh-140px)] min-h-[600px] mt-4 pb-12">
      {/* Sidebar List */}
      <aside className="flex flex-col border border-line rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line bg-page/50">
          <button type="button" onClick={createRoadmap} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md">
            <Plus size={18} /> Yeni Harita
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar p-2 space-y-1">
          {roadmaps.length === 0 ? (
            <div className="text-center p-6 text-sm text-muted">Henüz yol haritası yok.</div>
          ) : (
            roadmaps.map(roadmap => (
              <button 
                type="button"
                key={roadmap.id} 
                onClick={() => { setActiveRoadmapId(roadmap.id); setActiveNodeId(null); }}
                className={`group flex w-full items-center justify-between text-left rounded-xl px-4 py-3 transition-all ${activeRoadmapId === roadmap.id ? "bg-selected border-line/50 border shadow-sm" : "hover:bg-hover border border-transparent"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`shrink-0 p-1.5 rounded-lg ${activeRoadmapId === roadmap.id ? "bg-accent/20 text-accent" : "bg-line text-muted"}`}>
                    <Map size={14} />
                  </div>
                  <span className={`font-semibold truncate text-sm ${activeRoadmapId === roadmap.id ? "text-ink" : "text-ink/90"}`}>
                    {roadmap.title}
                  </span>
                </div>
                <div onClick={e => { e.stopPropagation(); deleteRoadmap(roadmap.id); }} className={`p-1.5 shrink-0 rounded text-muted hover:text-danger hover:bg-danger-subtle transition-colors ${activeRoadmapId === roadmap.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} title="Sil">
                  <Trash2 size={14} />
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content View */}
      <section className="flex flex-col border border-line rounded-2xl bg-card overflow-hidden shadow-sm relative">
        {activeRoadmap ? (
          <div className={`flex flex-col md:flex-row h-full transition-all`}>
            {/* Tree/Timeline View */}
            <div className={`${activeNode ? 'hidden md:flex md:w-2/5 border-r border-line' : 'w-full'} flex-col bg-page/30`}>
              <div className="p-6 border-b border-line bg-card/50">
                <input
                  type="text"
                  value={activeRoadmap.title}
                  onChange={(e) => updateRoadmapTitle(activeRoadmap.id, e.target.value)}
                  placeholder="Yol Haritası Adı"
                  className="w-full bg-transparent text-2xl font-bold text-ink outline-none placeholder:text-muted/40 transition-colors focus:placeholder:text-muted/20"
                />
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar p-6 md:p-8 relative">
                {activeRoadmap.nodes.length > 0 && (
                  <div className="absolute left-[37px] md:left-[45px] top-8 bottom-8 w-[2px] bg-line rounded-full" />
                )}
                
                <div className="relative z-10">
                  {renderNodes(activeRoadmap.nodes)}
                </div>
                
                <button 
                  onClick={() => addNode(activeRoadmap.id)}
                  className="mt-6 ml-[3px] md:ml-[11px] flex items-center gap-3 text-sm font-semibold text-muted hover:text-accent transition-colors bg-card border border-line hover:border-accent/30 rounded-full pr-4 p-1 shadow-sm relative z-10"
                >
                  <div className="h-7 w-7 rounded-full bg-page flex items-center justify-center border border-line"><Plus size={14} /></div>
                  Yeni Ana Aşama
                </button>
              </div>
            </div>

            {/* Note Editor View */}
            {activeNode && (
              <div className="flex-1 flex flex-col bg-card relative z-20 h-full border-t md:border-t-0 border-line">
                <div className="p-4 border-b border-line flex items-center justify-between bg-page/50">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveNodeId(null)} className="md:hidden p-1.5 rounded-lg bg-line text-muted hover:text-ink"><ArrowRight className="rotate-180" size={16} /></button>
                    <h3 className="font-bold text-ink truncate flex items-center gap-2">
                      <Edit3 size={16} className="text-accent" /> {activeNode.title} Notları
                    </h3>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <RichEditor 
                    content={activeNode.noteHTML} 
                    onChange={(html) => updateNode(activeRoadmap.id, activeNode.id, { noteHTML: html })} 
                    placeholder="Bu aşamada öğrenilmesi gerekenler, kaynaklar ve projeler..." 
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted p-12 text-center">
            <div className="mb-4 p-5 rounded-full bg-line/30">
              <Map size={32} className="text-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-ink/70 mb-2">Yol Haritaları</h3>
            <p className="text-sm font-medium max-w-sm">Sol taraftan yeni bir yol haritası oluşturarak hedeflerini adım adım planlayabilirsin.</p>
          </div>
        )}
      </section>
    </div>
  );
}
