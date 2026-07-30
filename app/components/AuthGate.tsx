import { FormEvent, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthGate() {
  const configuredEmail = process.env.NEXT_PUBLIC_FOCUSFLOW_LOGIN_EMAIL || "";
  const [email, setEmail] = useState(configuredEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMessage("Parola veya giriş bilgisi hatalı.");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-page p-5 text-ink">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-line bg-card p-7 shadow-xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-3 text-accent"><LockKeyhole size={24} /></div>
          <div><h1 className="text-2xl font-bold">FocusFlow</h1><p className="text-sm text-muted">Kişisel çalışma alanın</p></div>
        </div>
        {!configuredEmail && <label className="mb-4 block text-sm font-medium">E-posta
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-page px-3"><Mail size={17} className="text-muted" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="sen@ornek.com" /></div>
        </label>}
        <label className="mb-5 block text-sm font-medium">Parola
          <input autoFocus required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-page px-3 py-3 outline-none focus:border-accent" placeholder="Parolanızı yazın" />
        </label>
        {message && <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{message}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60">
          <LockKeyhole size={18} />{busy ? "Bekleyin..." : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
