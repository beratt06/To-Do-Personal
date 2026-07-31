import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { verifySharedPassword } from "../lib/shared-access";

export default function AuthGate() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const isValid = await verifySharedPassword(password);
    setBusy(false);

    if (!isValid) {
      setMessage("Girilen şifre hatalı.");
      return;
    }

    // Store granted flag and the plaintext password in sessionStorage (cleared on tab close)
    // We need the password to call secure RPCs that access shared state; keeping it in
    // sessionStorage limits exposure compared to persistent localStorage.
    try {
      sessionStorage.setItem("focusflow-shared-password", password);
      window.localStorage.setItem("focusflow-shared-access", "granted");
      window.location.reload();
    } catch (e) {
      console.error("Failed to persist shared access", e);
      setMessage("Giriş işlemi yapılamadı. Tarayıcı izinlerini kontrol et.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-page p-5 text-ink">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-line bg-card p-7 shadow-xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-3 text-accent"><LockKeyhole size={24} /></div>
          <div><h1 className="text-2xl font-bold">FocusFlow</h1><p className="text-sm text-muted">Kişisel çalışma alanın</p></div>
        </div>
        <label className="mb-5 block text-sm font-medium">Ortak parola
          <input autoFocus required minLength={4} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-page px-3 py-3 outline-none focus:border-accent" placeholder="Parolanızı yazın" />
        </label>
        {message && <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{message}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60">
          <LockKeyhole size={18} />{busy ? "Bekleyin..." : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
