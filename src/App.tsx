import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const AUTH_API = "https://functions.poehali.dev/f2538387-3854-4fd9-9797-76f064a160ca";

export interface AppUser {
  id: number;
  name: string;
  avatar: string;
  color: string;
  phone: string;
}

function AppRoot() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("nex_token");
    const savedUser = localStorage.getItem("nex_user");
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        setChecking(false);
        return;
      } catch { /* ignore */ }
    }
    if (savedToken) {
      fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "me", token: savedToken }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.user) { setUser(data.user); setToken(savedToken); }
          else { localStorage.removeItem("nex_token"); localStorage.removeItem("nex_user"); }
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleAuth = (u: AppUser, t: string) => {
    setUser(u);
    setToken(t);
  };

  const handleLogout = async () => {
    if (token) {
      fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", token }),
      }).catch(() => {});
    }
    localStorage.removeItem("nex_token");
    localStorage.removeItem("nex_user");
    setUser(null);
    setToken("");
  };

  if (checking) {
    return (
      <div className="h-screen w-screen bg-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl btn-gradient flex items-center justify-center neon-glow animate-float">
            <span className="text-white font-bold text-lg" style={{ fontFamily: "Golos Text" }}>N</span>
          </div>
          <div className="w-5 h-5 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return <Auth onAuth={handleAuth} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index user={user} token={token} onLogout={handleLogout} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoot />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
