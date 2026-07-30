import { useState, useEffect } from "react";
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface PasswordLockModalProps {
  mode: "unlock" | "setup" | "change";
  onSuccess: (password?: string) => void;
  onCancel?: () => void;
}

export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function PasswordLockModal({ mode, onSuccess, onCancel }: PasswordLockModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"verify_current" | "enter_new" | "confirm_new">(
    mode === "change" ? "verify_current" : "enter_new"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    let timer: any;
    if (lockoutRemaining > 0) {
      timer = setInterval(() => {
        setLockoutRemaining(prev => {
          if (prev <= 1) {
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (lockoutRemaining > 0) return;

    const storedHash = localStorage.getItem("focusflow-password-hash");
    const legacyPwd = localStorage.getItem("focusflow-password") || localStorage.getItem("focusflow-pin");

    if (mode === "unlock") {
      const inputHash = await hashPassword(currentPassword);
      let isMatch = false;

      if (storedHash) {
        isMatch = inputHash === storedHash;
      } else if (legacyPwd) {
        isMatch = currentPassword === legacyPwd;
        if (isMatch) {
          localStorage.setItem("focusflow-password-hash", inputHash);
          localStorage.removeItem("focusflow-password");
          localStorage.removeItem("focusflow-pin");
        }
      }

      if (isMatch) {
        setAttempts(0);
        onSuccess();
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutRemaining(30);
          setError("5 kez hatalı şifre girildi! 30 saniye kilitlendiniz.");
        } else {
          setError(`Hatalı şifre! (Kalan deneme hakkı: ${5 - nextAttempts})`);
        }
        setCurrentPassword("");
      }
    } else if (mode === "change" && step === "verify_current") {
      const inputHash = await hashPassword(currentPassword);
      let isMatch = false;
      if (storedHash) {
        isMatch = inputHash === storedHash;
      } else if (legacyPwd) {
        isMatch = currentPassword === legacyPwd;
      }

      if (isMatch) {
        setStep("enter_new");
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutRemaining(30);
          setError("5 kez hatalı şifre girildi! 30 saniye kilitlendiniz.");
        } else {
          setError(`Mevcut şifreniz hatalı! (Kalan deneme hakkı: ${5 - nextAttempts})`);
        }
        setCurrentPassword("");
      }
    } else if (step === "enter_new") {
      if (!newPassword.trim()) {
        setError("Lütfen geçerli bir yeni şifre girin.");
        return;
      }
      setStep("confirm_new");
    } else if (step === "confirm_new") {
      if (confirmPassword === newPassword) {
        const hashed = await hashPassword(newPassword);
        localStorage.setItem("focusflow-password-hash", hashed);
        localStorage.removeItem("focusflow-password");
        localStorage.removeItem("focusflow-pin");
        onSuccess(newPassword);
      } else {
        setError("Yeni şifreler eşleşmedi! Tekrar deneyin.");
        setNewPassword("");
        setConfirmPassword("");
        setStep("enter_new");
      }
    }
  };

  const getInputValue = () => {
    if (mode === "unlock" || step === "verify_current") return currentPassword;
    if (step === "enter_new") return newPassword;
    return confirmPassword;
  };

  const setInputValue = (val: string) => {
    if (lockoutRemaining > 0) return;
    setError("");
    if (mode === "unlock" || step === "verify_current") setCurrentPassword(val);
    else if (step === "enter_new") setNewPassword(val);
    else setConfirmPassword(val);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.form initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl border border-line bg-card p-8 shadow-2xl text-center">
        
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-accent border border-accent/20">
          {lockoutRemaining > 0 ? <ShieldAlert size={28} className="text-danger" /> : mode === "unlock" ? <Lock size={28} /> : <KeyRound size={28} />}
        </div>

        <h2 className="text-xl font-bold tracking-tight text-ink">
          {lockoutRemaining > 0
            ? "Geçici Kilitlenme"
            : mode === "unlock"
            ? "Güvenlik Kilidi"
            : step === "verify_current"
            ? "Mevcut Şifrenizi Girin"
            : step === "enter_new"
            ? "Yeni Şifrenizi Belirleyin"
            : "Yeni Şifreyi Tekrar Girin"}
        </h2>
        <p className="mt-1 text-xs text-muted">
          {lockoutRemaining > 0
            ? `Brute-force koruması aktif. ${lockoutRemaining} saniye sonra tekrar deneyin.`
            : mode === "unlock"
            ? "Uygulamaya erişmek için şifrenizi girin."
            : step === "verify_current"
            ? "Şifreyi değiştirebilmek için önce mevcut şifrenizi onaylayın."
            : step === "enter_new"
            ? "İstediğiniz yeni şifreyi yazın."
            : "Doğrulamak için yeni şifrenizi tekrar yazın."}
        </p>

        <div className="relative my-6">
          <input
            type={showPassword ? "text" : "password"}
            autoFocus
            disabled={lockoutRemaining > 0}
            required
            value={getInputValue()}
            onChange={e => setInputValue(e.target.value)}
            placeholder={lockoutRemaining > 0 ? "Kilitlendi..." : "Şifrenizi yazın..."}
            className="w-full rounded-2xl border border-line bg-page px-4 py-3.5 pr-11 text-center text-sm font-medium text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
          />
          <button
            type="button"
            disabled={lockoutRemaining > 0}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 disabled:opacity-50"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <p className="mb-4 text-xs font-semibold text-danger animate-bounce">{error}</p>
        )}

        <div className="flex items-center gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="w-1/2 rounded-xl border border-line bg-page py-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink">
              İptal
            </button>
          )}
          <button type="submit" disabled={lockoutRemaining > 0} className={`${onCancel ? 'w-1/2' : 'w-full'} rounded-xl bg-accent py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg disabled:opacity-50`}>
            {mode === "unlock" ? "Giriş Yap" : step === "verify_current" ? "Şifreyi Onayla" : step === "enter_new" ? "Devam Et" : "Şifreyi Kaydet"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
