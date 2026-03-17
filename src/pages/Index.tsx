import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/eb00ad07-0b4d-4ba7-bbb8-d759cec2c379";

interface Chat {
  id: number;
  is_group: boolean;
  name: string | null;
  display_name: string;
  avatar: string;
  color: string;
  status: string;
  last_message: string | null;
  last_message_at: string | null;
  partner_id: number | null;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  text: string;
  encrypted: boolean;
  created_at: string;
  is_out: boolean;
}

interface Contact {
  id: number;
  name: string;
  avatar: string;
  color: string;
  status: string;
  mutual: number;
}

const NOTIFICATIONS = [
  { id: 1, icon: "MessageCircle", text: "Алина Морозова написала вам", time: "2 мин назад", color: "text-purple-400", read: false },
  { id: 2, icon: "Users", text: "Команда Nex: 5 новых сообщений", time: "15 мин назад", color: "text-cyan-400", read: false },
  { id: 3, icon: "UserPlus", text: "Артём Волков принял заявку", time: "1 ч назад", color: "text-emerald-400", read: true },
  { id: 4, icon: "Shield", text: "Шифрование обновлено успешно", time: "2 ч назад", color: "text-green-400", read: true },
  { id: 5, icon: "Bell", text: "Добро пожаловать в Nex!", time: "вчера", color: "text-violet-400", read: true },
];

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface AppUser {
  id: number;
  name: string;
  avatar: string;
  color: string;
  phone?: string;
}

interface IndexProps {
  user: AppUser;
  token: string;
  onLogout: () => void;
}

type Tab = "chats" | "contacts" | "notifications" | "search" | "settings";

export default function Index({ user, onLogout }: IndexProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const msgsEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === activeChat);
  const unreadNotifs = NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    fetch(`${API}/?action=chats&user_id=${user.id}`)
      .then(r => r.json())
      .then((data: Chat[]) => {
        setChats(data);
        if (data.length > 0) setActiveChat(data[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    if (!activeChat) return;
    fetch(`${API}/?action=messages&chat_id=${activeChat}&user_id=${user.id}`)
      .then(r => r.json())
      .then((data: Message[]) => setMessages(data));
  }, [activeChat, user.id]);

  useEffect(() => {
    if (activeTab === "contacts" && contacts.length === 0) {
      fetch(`${API}/?action=contacts&user_id=${user.id}`)
        .then(r => r.json())
        .then((data: Contact[]) => setContacts(data));
    }
  }, [activeTab, user.id, contacts.length]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !activeChat || sending) return;
    const text = message.trim();
    setMessage("");
    setSending(true);
    const res = await fetch(`${API}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: activeChat, sender_id: user.id, text }),
    });
    const msg: Message = await res.json();
    setMessages(prev => [...prev, msg]);
    setSending(false);
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, last_message: text } : c));
  };

  const filteredChats = chats.filter(c =>
    c.display_name.toLowerCase().includes(chatSearch.toLowerCase())
  );
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "chats", icon: "MessageCircle", label: "Чаты" },
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "notifications", icon: "Bell", label: "Уведомления", badge: unreadNotifs },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="h-screen w-screen bg-mesh flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-6 gap-1 glass border-r border-white/5 z-10">
        <div className="mb-6">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center neon-glow">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "Golos Text" }}>N</span>
          </div>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item w-12 h-12 rounded-xl flex items-center justify-center relative ${activeTab === item.id ? "active glass-strong" : "hover:bg-white/5"}`}
            title={item.label}
          >
            <Icon name={item.icon} size={20} className="nav-icon" style={{ color: activeTab === item.id ? "hsl(270,80%,70%)" : undefined }} />
            {item.badge ? (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={onLogout}
            title="Выйти"
            className="w-9 h-9 rounded-xl hover:bg-white/8 flex items-center justify-center transition-colors group"
          >
            <Icon name="LogOut" size={16} className="text-white/30 group-hover:text-red-400 transition-colors" />
          </button>
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform`} title={user.name}>
            {user.avatar}
          </div>
        </div>
      </aside>

      {/* Panel */}
      <div className="w-72 flex flex-col glass border-r border-white/5">
        <div className="p-4 pb-3">
          <h2 className="font-bold text-lg text-white mb-1" style={{ fontFamily: "Golos Text" }}>
            {activeTab === "chats" && "Сообщения"}
            {activeTab === "contacts" && "Контакты"}
            {activeTab === "notifications" && "Уведомления"}
            {activeTab === "search" && "Поиск"}
            {activeTab === "settings" && "Настройки"}
          </h2>
          {(activeTab === "chats" || activeTab === "search") && (
            <div className="relative mt-2">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className="search-input w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-white/80 placeholder-white/25 outline-none transition-all"
                placeholder={activeTab === "chats" ? "Поиск чатов..." : "Найти людей..."}
                value={activeTab === "chats" ? chatSearch : searchQuery}
                onChange={e => activeTab === "chats" ? setChatSearch(e.target.value) : setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {/* CHATS */}
          {activeTab === "chats" && (
            <div className="space-y-0.5">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/8 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/8 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredChats.map((chat, i) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group animate-fade-in ${activeChat === chat.id ? "glass-strong" : "hover:bg-white/5"}`}
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {chat.avatar}
                    </div>
                    {chat.status === "online" && <div className="online-dot absolute -bottom-0.5 -right-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{chat.display_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="Lock" size={9} className="text-cyan-400 flex-shrink-0" />
                      <span className="text-xs text-white/35 truncate">{chat.last_message || "Нет сообщений"}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CONTACTS */}
          {activeTab === "contacts" && (
            <div className="space-y-0.5">
              <p className="text-xs text-white/30 px-2 mb-2 uppercase tracking-wider">Все контакты · {contacts.length}</p>
              {contacts.length === 0 ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/8 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/8 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : contacts.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {c.avatar}
                    </div>
                    {c.status === "online" && <div className="online-dot absolute -bottom-0.5 -right-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-white/30">{c.mutual} общих контакта</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10">
                    <Icon name="MessageCircle" size={14} className="text-purple-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-1">
              {NOTIFICATIONS.map((n, i) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-all animate-fade-in ${n.read ? "opacity-60" : "bg-white/4 border border-white/6"}`}
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                  <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                    <Icon name={n.icon} size={14} className={n.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">{n.text}</p>
                    <p className="text-xs text-white/30 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0 animate-pulse-glow" />}
                </div>
              ))}
            </div>
          )}

          {/* SEARCH */}
          {activeTab === "search" && (
            <div>
              {searchQuery.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl glass mx-auto flex items-center justify-center mb-3 animate-float">
                    <Icon name="Search" size={24} className="text-purple-400" />
                  </div>
                  <p className="text-white/40 text-sm">Введите имя для поиска</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-xs text-white/30 px-2 mb-2 uppercase tracking-wider">Результаты · {filteredContacts.length}</p>
                  {filteredContacts.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {c.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-white/30">{c.status === "online" ? "В сети" : "Не в сети"}</p>
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Icon name="UserPlus" size={14} className="text-cyan-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-1">
              {[
                { icon: "User", label: "Профиль", desc: "Имя, фото, статус", color: "text-purple-400" },
                { icon: "Shield", label: "Конфиденциальность", desc: "Сквозное шифрование E2E", color: "text-cyan-400" },
                { icon: "Bell", label: "Уведомления", desc: "Push, звук, вибрация", color: "text-orange-400" },
                { icon: "Palette", label: "Оформление", desc: "Темы и цвета", color: "text-pink-400" },
                { icon: "Link", label: "Устройства", desc: "Активные сессии", color: "text-emerald-400" },
                { icon: "HelpCircle", label: "Помощь", desc: "FAQ и поддержка", color: "text-blue-400" },
              ].map((s, i) => (
                <button key={s.label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                  <div className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0">
                    <Icon name={s.icon} size={16} className={s.color} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{s.label}</p>
                    <p className="text-xs text-white/35">{s.desc}</p>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-white/20 ml-auto" />
                </button>
              ))}
              <div className="mt-4 p-3 rounded-xl glass border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Lock" size={13} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400">Сквозное шифрование</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">Все сообщения защищены протоколом E2E. Только вы и собеседник видите содержимое.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat && currentChat ? (
          <>
            {/* Header */}
            <div className="h-16 glass border-b border-white/5 flex items-center px-5 gap-4">
              <div className="relative">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentChat.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {currentChat.avatar}
                </div>
                {currentChat.status === "online" && <div className="online-dot absolute -bottom-0.5 -right-0.5" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{currentChat.display_name}</p>
                <div className="flex items-center gap-1.5">
                  <Icon name="Lock" size={10} className="text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-medium">E2E шифрование</span>
                  {currentChat.status === "online" && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-emerald-400">В сети</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="w-9 h-9 rounded-xl hover:bg-white/8 flex items-center justify-center transition-colors">
                  <Icon name="Phone" size={16} className="text-white/50" />
                </button>
                <button className="w-9 h-9 rounded-xl hover:bg-white/8 flex items-center justify-center transition-colors">
                  <Icon name="Video" size={16} className="text-white/50" />
                </button>
                <button className="w-9 h-9 rounded-xl hover:bg-white/8 flex items-center justify-center transition-colors">
                  <Icon name="MoreVertical" size={16} className="text-white/50" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-white/25 px-2">История</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_out ? "justify-end" : "justify-start"} animate-fade-in`}
                  style={{ animationDelay: `${i * 0.03}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className={`max-w-[65%] ${msg.is_out ? "msg-out px-4 py-2.5" : "msg-in px-4 py-2.5"}`}>
                    <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.is_out ? "justify-end" : "justify-start"}`}>
                      <Icon name="Lock" size={9} className="text-white/30" />
                      <span className="text-[10px] text-white/30">{fmtTime(msg.created_at)}</span>
                      {msg.is_out && <Icon name="CheckCheck" size={11} className="text-cyan-400/70" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 glass border-t border-white/5">
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/8 focus-within:border-purple-500/40 transition-all focus-within:shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                <button className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
                  <Icon name="Paperclip" size={16} />
                </button>
                <input
                  className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/25 outline-none"
                  placeholder="Сообщение зашифровано..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                />
                <button className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
                  <Icon name="Smile" size={16} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="w-8 h-8 rounded-xl btn-gradient flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {sending
                    ? <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <Icon name="Send" size={14} className="text-white" />
                  }
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 justify-center">
                <Icon name="Shield" size={9} className="text-white/20" />
                <span className="text-[10px] text-white/20">Защищено сквозным шифрованием E2E</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-3xl btn-gradient flex items-center justify-center mb-6 neon-glow animate-float">
              <span className="text-white font-bold text-3xl" style={{ fontFamily: "Golos Text" }}>N</span>
            </div>
            <h1 className="font-bold text-2xl grad-text mb-1" style={{ fontFamily: "Golos Text" }}>Привет, {user.name.split(" ")[0]}!</h1>
            <p className="text-white/35 text-sm">Выберите чат, чтобы начать общение</p>
            <div className="mt-4 flex items-center gap-2 encrypt-badge">
              <Icon name="Lock" size={10} />
              <span>Сквозное шифрование E2E</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}