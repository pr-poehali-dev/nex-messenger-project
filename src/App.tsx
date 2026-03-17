
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
const AUTH_URL = "https://functions.poehali.dev/f2538387-3854-4fd9-9797-76f064a160ca";

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  color: string;
}

function AppRoot() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const sid = localStorage.getItem("nex_session");
    if (!sid) { setChecking(false); return; }
    fetch(`${AUTH_URL}/?action=me&session_id=${sid}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) { setUser(data.user); setSessionId(sid); }
        else localStorage.removeItem("nex_session");
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleAuth = (u: User, sid: string) => {
    setUser(u);
    setSessionId(sid);
  };

  const handleLogout = async () => {
    await fetch(`${AUTH_URL}/?action=logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => {});
    localStorage.removeItem("nex_session");
    setUser(null);
    setSessionId("");
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
        <Route path="/" element={<Index user={user} sessionId={sessionId} onLogout={handleLogout} />} />
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