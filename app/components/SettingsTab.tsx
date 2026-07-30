import { useState, useEffect, useRef } from "react";
import { Download, Upload, RotateCcw, ShieldCheck, CheckCircle2, Lock, KeyRound, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PinLockModal from "./PinLockModal";

type Area = any; 

type BackupLog = {
  timestamp: number;
  data: string;
};

export default function SettingsTab({ areas, setAreas }: { areas: Area[], setAreas: (areas: Area[]) => void }) {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBackups();
    checkPinStatus();
  }, []);

  const checkPinStatus = () => {
    const pwd = localStorage.getItem("focusflow-password-hash") || localStorage.getItem("focusflow-password") || localStorage.getItem("focusflow-pin");
    setHasPin(Boolean(pwd));
  };

  const loadBackups = () => {
    try {
      const raw = localStorage.getItem("focusflow-backups");
      if (raw) {
        setBackups(JSON.parse(raw));
      }
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleRestore = (data: string) => {
    if (confirm("Seçilen yedeği geri yüklemek istediğinize emin misiniz? Mevcut verilerinizin üzerine yazılacak.")) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed)) {
          setAreas(parsed);
          showToast("Yedek başarıyla geri yüklendi!");
        }
      } catch (e) {
        alert("Yedek dosyası bozuk veya okunamıyor.");
      }
    }
  };

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(areas, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `focusflow-yedek-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showToast("Veriler başarıyla dışa aktarıldı!");
    } catch(e) {
      alert("Dışa aktarma sırasında bir hata oluştu.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        if (parsed && Array.isArray(parsed)) {
          if (confirm("Bu dosyayı içe aktarmak, mevcut tüm verilerinizin üzerine yazacaktır. Onaylıyor musunuz?")) {
            setAreas(parsed);
            showToast("Veriler başarıyla içe aktarıldı!");
          }
        } else {
          alert("Geçersiz yedek dosyası (Veriler dizi (array) formatında değil).");
        }
      } catch (err) {
        alert("Dosya okunamadı veya bozuk JSON formatı.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const removePin = () => {
    if (confirm("Şifre korumasını kaldırmak istediğinize emin misiniz?")) {
      localStorage.removeItem("focusflow-password-hash");
      localStorage.removeItem("focusflow-password");
      localStorage.removeItem("focusflow-pin");
      checkPinStatus();
      showToast("Şifre koruması kaldırıldı.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-8 pb-20">
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-5 py-3.5 text-sm font-medium text-accent shadow-lg">
            <CheckCircle2 size={18} />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {showPinModal && (
        <PinLockModal
          mode={hasPin ? "change" : "setup"}
          onSuccess={() => {
            setShowPinModal(false);
            checkPinStatus();
            showToast(hasPin ? "Şifre değiştirildi!" : "Şifre koruması aktif edildi!");
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      <div>
        <p className="text-sm font-medium text-accent">Ayarlar & Güvenlik</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Yedekleme & Güvenlik</h1>
        <p className="mt-2 text-muted max-w-2xl">
          Tüm verileriniz gizlilik için sadece bu cihazda (offline) saklanır. Olası felaket senaryolarına karşı sistem her değişikliği kaydeder.
        </p>
      </div>

      {/* Security & PIN Section */}
      <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${hasPin ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              <Lock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Özel Şifre Koruması</h2>
              <p className="text-xs text-muted">
                {hasPin ? "Uygulamanız belirlediğiniz özel şifre ile korunuyor." : "Henüz bir şifre koymadınız. Herkes uygulamanızı açabilir."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasPin && (
              <button type="button" onClick={removePin} className="flex items-center gap-1.5 rounded-xl border border-line bg-page px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors">
                <Trash2 size={14} /> Kaldır
              </button>
            )}
            <button type="button" onClick={() => setShowPinModal(true)} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-medium text-white shadow-md hover:bg-accent-hover transition-all">
              <KeyRound size={14} /> {hasPin ? "Şifre Değiştir" : "Şifre Koy"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <Download size={20} />
            </div>
            <h2 className="text-lg font-bold">Verileri İndir (Export)</h2>
          </div>
          <p className="text-sm text-muted mb-6">Mevcut tüm alanlarınızı, notlarınızı ve görevlerinizi güvenli bir JSON dosyası olarak bilgisayarınıza indirin.</p>
          <button type="button" onClick={handleExport} className="w-full flex justify-center items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg">
            <Download size={16} /> JSON Olarak İndir
          </button>
        </section>

        <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/10 text-success rounded-lg">
              <Upload size={20} />
            </div>
            <h2 className="text-lg font-bold">Verileri Yükle (Import)</h2>
          </div>
          <p className="text-sm text-muted mb-6">Daha önce indirdiğiniz bir `.json` yedek dosyasını yükleyerek tüm sistemi saniyeler içinde eski haline döndürün.</p>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={handleImportClick} className="w-full flex justify-center items-center gap-2 rounded-xl bg-card border border-line px-4 py-3 text-sm font-medium text-ink shadow-sm transition-all hover:bg-hover hover:shadow-md">
            <Upload size={16} /> JSON Dosyası Seç
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-line bg-card/50 flex items-center gap-3">
          <ShieldCheck size={24} className="text-accent" />
          <div>
            <h2 className="text-xl font-bold">Otomatik Geçmiş Logları</h2>
            <p className="text-sm text-muted">Sistem her önemli değişiklikte arka planda sessizce bir yedek alır (Maks. 15 versiyon).</p>
          </div>
        </div>
        
        <div className="divide-y divide-line">
          {backups.length === 0 ? (
            <div className="p-10 text-center text-muted">
              <RotateCcw size={32} className="mx-auto mb-3 opacity-20" />
              <p>Henüz alınmış bir otomatik yedek bulunmuyor.</p>
            </div>
          ) : (
            backups.map((backup, i) => (
              <div key={backup.timestamp} className="flex items-center justify-between p-5 hover:bg-hover transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">Otomatik Yedek {backups.length - i}</span>
                  <span className="text-sm text-muted">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "medium" }).format(new Date(backup.timestamp))}</span>
                </div>
                <button type="button" onClick={() => handleRestore(backup.data)} className="flex items-center gap-2 rounded-lg bg-card border border-line px-3 py-2 text-sm font-medium text-ink transition-all hover:border-accent hover:text-accent">
                  <RotateCcw size={16} /> Geri Yükle
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
}
