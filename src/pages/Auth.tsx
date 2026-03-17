import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_API = "https://functions.poehali.dev/f2538387-3854-4fd9-9797-76f064a160ca";

interface AuthUser {
  id: number;
  name: string;
  avatar: string;
  color: string;
  phone: string;
}

interface AuthProps {
  onAuth: (user: AuthUser, token: string) => void;
}

type Step = "phone" | "otp" | "name";

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  let d = digits;
  if (d.startsWith("8")) d = "7" + d.slice(1);
  let out = "+";
  if (d.length > 0) out += d.slice(0, 1);
  if (d.length > 1) out += " (" + d.slice(1, 4);
  if (d.length > 4) out += ") " + d.slice(4, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  if (d.length > 9) out += "-" + d.slice(9, 11);
  return out;
}

export default function Auth({ onAuth }: AuthProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const rawDigits = phone.replace(/\D/g, "");

  const sendOtp = async () => {
    if (rawDigits.length < 11) { setError("Введите номер полностью"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setHint(data.hint || "");
      setStep("otp");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (overrideName?: string) => {
    if (otp.length < 4) { setError("Введите 4-значный код"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", phone, otp, name: overrideName ?? name }),
      });
      const data = await res.json();
      if (data.need_name) { setStep("name"); return; }
      if (data.error) { setError(data.error); return; }
      if (data.success) {
        localStorage.setItem("nex_token", data.token);
        localStorage.setItem("nex_user", JSON.stringify(data.user));
        onAuth(data.user, data.token);
      }
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  const submitName = () => {
    if (name.trim().length < 2) { setError("Минимум 2 символа"); return; }
    verifyOtp(name.trim());
  };

  return (
    <div className="h-screen w-screen bg-mesh flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl btn-gradient flex items-center justify-center neon-glow mb-4 animate-float">
            <span className="text-white font-bold text-2xl" style={{ fontFamily: "Golos Text" }}>N</span>
          </div>
          <h1 className="text-3xl font-bold grad-text" style={{ fontFamily: "Golos Text" }}>Nex</h1>
          <p className="text-white/40 text-sm mt-1">Защищённый мессенджер</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-6 border border-white/10 animate-fade-in" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>

          {/* PHONE */}
          {step === "phone" && (
            <div>
              <h2 className="text-white font-semibold text-base mb-1">Войти или зарегистрироваться</h2>
              <p className="text-white/40 text-sm mb-5">Введите номер телефона</p>

              <div className="relative mb-3">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl select-none">🇷🇺</span>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/25 outline-none focus:border-purple-500/50 transition-all text-sm tracking-wide"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === "Enter" && sendOtp()}
                  type="tel"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-400 text-xs mb-3 flex items-center gap-1.5"><Icon name="AlertCircle" size={12} />{error}</p>}

              <button
                onClick={sendOtp}
                disabled={loading || rawDigits.length < 11}
                className="w-full btn-gradient rounded-xl py-3 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><span>Получить код</span><Icon name="ArrowRight" size={15} /></>
                }
              </button>

              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/15">
                <Icon name="Lock" size={12} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-cyan-400/80 leading-relaxed">Все сообщения защищены сквозным шифрованием E2E</p>
              </div>
            </div>
          )}

          {/* OTP */}
          {step === "otp" && (
            <div>
              <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} className="flex items-center gap-1 text-white/35 hover:text-white/60 text-xs mb-4 transition-colors">
                <Icon name="ArrowLeft" size={13} /><span>Изменить номер</span>
              </button>

              <h2 className="text-white font-semibold text-base mb-1">Введите код</h2>
              <p className="text-white/40 text-sm mb-4">Отправлен на <span className="text-white/65">{phone}</span></p>

              {hint && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Icon name="Info" size={12} className="text-violet-400" />
                  <span className="text-xs text-violet-400">{hint}</span>
                </div>
              )}

              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 outline-none focus:border-purple-500/50 transition-all text-center text-3xl font-bold tracking-[0.6em] mb-3"
                placeholder="····"
                value={otp}
                maxLength={4}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={e => e.key === "Enter" && verifyOtp()}
                type="tel"
                autoFocus
              />

              {error && <p className="text-red-400 text-xs mb-3 flex items-center gap-1.5"><Icon name="AlertCircle" size={12} />{error}</p>}

              <button
                onClick={() => verifyOtp()}
                disabled={loading || otp.length < 4}
                className="w-full btn-gradient rounded-xl py-3 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Icon name="ShieldCheck" size={15} /><span>Подтвердить</span></>
                }
              </button>

              <button onClick={sendOtp} className="w-full text-center text-white/30 hover:text-white/55 text-xs mt-3 transition-colors">
                Отправить код повторно
              </button>
            </div>
          )}

          {/* NAME */}
          {step === "name" && (
            <div>
              <div className="w-12 h-12 rounded-2xl btn-gradient flex items-center justify-center mx-auto mb-4">
                <Icon name="UserPlus" size={22} className="text-white" />
              </div>
              <h2 className="text-white font-semibold text-base mb-1 text-center">Как вас зовут?</h2>
              <p className="text-white/40 text-sm mb-5 text-center">Это имя увидят ваши контакты</p>

              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-purple-500/50 transition-all text-sm mb-3"
                placeholder="Имя Фамилия"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitName()}
                autoFocus
              />

              {error && <p className="text-red-400 text-xs mb-3 flex items-center gap-1.5"><Icon name="AlertCircle" size={12} />{error}</p>}

              <button
                onClick={submitName}
                disabled={loading || name.trim().length < 2}
                className="w-full btn-gradient rounded-xl py-3 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Icon name="Rocket" size={15} /><span>Войти в Nex</span></>
                }
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 encrypt-badge mx-auto w-fit animate-fade-in" style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <Icon name="Shield" size={10} /><span>Nex · E2E шифрование</span>
        </div>
      </div>
    </div>
  );
}
