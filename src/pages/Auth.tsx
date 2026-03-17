import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/f2538387-3854-4fd9-9797-76f064a160ca";

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  color: string;
}

interface AuthProps {
  onAuth: (user: User, sessionId: string) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) setPin(p => p + digit);
  };
  const handlePinDelete = () => setPin(p => p.slice(0, -1));

  const submit = async () => {
    if (pin.length < 4) { setError("Пин-код должен быть не менее 4 цифр"); return; }
    if (mode === "register" && (!name.trim() || !username.trim())) {
      setError("Заполните имя и никнейм"); return;
    }
    if (mode === "login" && !username.trim()) {
      setError("Введите никнейм"); return;
    }

    setError("");
    setLoading(true);

    const body = mode === "register"
      ? { name: name.trim(), username: username.trim(), pin }
      : { username: username.trim(), pin };

    const res = await fetch(`${AUTH_URL}/?action=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Ошибка"); setPin(""); return; }
    localStorage.setItem("nex_session", data.session_id);
    onAuth(data.user, data.session_id);
  };

  return (
    <div className="h-screen w-screen bg-mesh flex items-center justify-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-600/10 blur-3xl animate-float" style={{ animationDelay: "0.75s" }} />
      </div>

      <div className="relative w-full max-w-sm mx-4 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl btn-gradient flex items-center justify-center neon-glow mb-4 animate-float">
            <span className="text-white font-bold text-2xl" style={{ fontFamily: "Golos Text" }}>N</span>
          </div>
          <h1 className="text-3xl font-bold grad-text" style={{ fontFamily: "Golos Text" }}>Nex</h1>
          <p className="text-white/40 text-sm mt-1">Защищённый мессенджер</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); setPin(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "btn-gradient text-white shadow-lg" : "text-white/40 hover:text-white/70"}`}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); setPin(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "register" ? "btn-gradient text-white shadow-lg" : "text-white/40 hover:text-white/70"}`}
            >
              Создать аккаунт
            </button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <div className="animate-fade-in">
                <label className="text-xs text-white/40 mb-1 block">Ваше имя</label>
                <input
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-purple-500/50 transition-all"
                  placeholder="Алина Морозова"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-xs text-white/40 mb-1 block">Никнейм</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                <input
                  className="w-full bg-white/6 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-purple-500/50 transition-all"
                  placeholder="username"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                />
              </div>
            </div>
          </div>

          {/* PIN display */}
          <div className="mt-5">
            <label className="text-xs text-white/40 mb-3 block text-center">Пин-код</label>
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length
                    ? "bg-gradient-to-br from-purple-400 to-cyan-400 scale-125 shadow-[0_0_8px_rgba(147,51,234,0.6)]"
                    : "bg-white/15 border border-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                <button
                  key={i}
                  onClick={() => d === "⌫" ? handlePinDelete() : d ? handlePinInput(d) : undefined}
                  disabled={!d}
                  className={`h-12 rounded-xl text-lg font-semibold transition-all ${
                    d === "⌫"
                      ? "bg-white/8 text-white/50 hover:bg-white/12 active:scale-95"
                      : d
                        ? "glass text-white hover:bg-white/12 active:scale-95 hover:border-purple-500/30"
                        : "invisible"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <Icon name="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading || pin.length < 4}
            className="w-full mt-4 py-3 rounded-xl btn-gradient text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={15} />
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </>
            )}
          </button>
        </div>

        {/* E2E badge */}
        <div className="flex items-center justify-center gap-2 mt-4 encrypt-badge mx-auto w-fit">
          <Icon name="Shield" size={10} />
          <span>Сквозное шифрование E2E</span>
        </div>
      </div>
    </div>
  );
}
