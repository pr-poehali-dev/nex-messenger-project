import { useState } from "react";
import Icon from "@/components/ui/icon";

const CONTACTS = [
  { id: 1, name: "Алина Морозова", status: "online", avatar: "AM", color: "from-purple-500 to-pink-500", lastSeen: "сейчас", unread: 3 },
  { id: 2, name: "Денис Калинин", status: "online", avatar: "ДК", color: "from-cyan-500 to-blue-500", lastSeen: "сейчас", unread: 0 },
  { id: 3, name: "Юля Захарова", status: "offline", avatar: "ЮЗ", color: "from-orange-500 to-pink-500", lastSeen: "1 ч назад", unread: 1 },
  { id: 4, name: "Команда Nex", status: "online", avatar: "🚀", color: "from-violet-500 to-cyan-500", lastSeen: "сейчас", unread: 5, isGroup: true },
  { id: 5, name: "Артём Волков", status: "offline", avatar: "АВ", color: "from-emerald-500 to-teal-500", lastSeen: "3 ч назад", unread: 0 },
  { id: 6, name: "Мария Соколова", status: "online", avatar: "МС", color: "from-rose-500 to-orange-500", lastSeen: "сейчас", unread: 0 },
];

const MESSAGES: Record<number, { id: number; text: string; out: boolean; time: string; encrypted?: boolean }[]> = {
  1: [
    { id: 1, text: "Привет! Как дела? 😊", out: false, time: "12:30", encrypted: true },
    { id: 2, text: "Всё отлично, спасибо! Работаю над новым проектом", out: true, time: "12:31", encrypted: true },
    { id: 3, text: "О, расскажи подробнее! Что за проект?", out: false, time: "12:32", encrypted: true },
    { id: 4, text: "Создаём мессенджер со сквозным шифрованием — Nex! 🔐", out: true, time: "12:33", encrypted: true },
    { id: 5, text: "Звучит круто! Когда релиз?", out: false, time: "12:35", encrypted: true },
    { id: 6, text: "Скоро! Уже тестируем первую версию 🚀", out: true, time: "12:36", encrypted: true },
  ],
  2: [
    { id: 1, text: "Привет! Видел новые анонсы от Apple?", out: false, time: "11:00", encrypted: true },
    { id: 2, text: "Да, очень интересно смотрится!", out: true, time: "11:05", encrypted: true },
  ],
  3: [
    { id: 1, text: "Созвонимся вечером?", out: false, time: "10:00", encrypted: true },
    { id: 2, text: "Да, в 19:00 удобно?", out: true, time: "10:02", encrypted: true },
    { id: 3, text: "Отлично, договорились! 👍", out: false, time: "10:03", encrypted: true },
  ],
  4: [
    { id: 1, text: "🚀 Всем привет! Новая версия уже в деплое", out: false, time: "09:00", encrypted: true },
    { id: 2, text: "Супер! Какие изменения?", out: true, time: "09:05", encrypted: true },
    { id: 3, text: "Исправили баги с уведомлениями и добавили анимации", out: false, time: "09:06", encrypted: true },
    { id: 4, text: "Огонь 🔥", out: true, time: "09:10", encrypted: true },
    { id: 5, text: "Тестируем и деплоим в продакшн завтра утром", out: false, time: "09:15", encrypted: true },
  ],
  5: [{ id: 1, text: "Привет, Артём!", out: true, time: "Вчера", encrypted: true }],
  6: [{ id: 1, text: "Привет, Мария! Рады знакомству 😊", out: true, time: "Вчера", encrypted: true }],
};

const NOTIFICATIONS = [
  { id: 1, icon: "MessageCircle", text: "Алина Морозова написала вам", time: "2 мин назад", color: "text-purple-400", read: false },
  { id: 2, icon: "Users", text: "Команда Nex: 5 новых сообщений", time: "15 мин назад", color: "text-cyan-400", read: false },
  { id: 3, icon: "UserPlus", text: "Артём Волков принял заявку", time: "1 ч назад", color: "text-emerald-400", read: true },
  { id: 4, icon: "Shield", text: "Шифрование обновлено успешно", time: "2 ч назад", color: "text-green-400", read: true },
  { id: 5, icon: "Bell", text: "Добро пожаловать в Nex!", time: "вчера", color: "text-violet-400", read: true },
];

const ALL_CONTACTS = [
  { id: 1, name: "Алина Морозова", avatar: "AM", color: "from-purple-500 to-pink-500", status: "online", mutual: 12 },
  { id: 2, name: "Денис Калинин", avatar: "ДК", color: "from-cyan-500 to-blue-500", status: "online", mutual: 5 },
  { id: 3, name: "Юля Захарова", avatar: "ЮЗ", color: "from-orange-500 to-pink-500", status: "offline", mutual: 8 },
  { id: 4, name: "Артём Волков", avatar: "АВ", color: "from-emerald-500 to-teal-500", status: "offline", mutual: 3 },
  { id: 5, name: "Мария Соколова", avatar: "МС", color: "from-rose-500 to-orange-500", status: "online", mutual: 7 },
  { id: 6, name: "Иван Петров", avatar: "ИП", color: "from-blue-500 to-violet-500", status: "offline", mutual: 2 },
];

type Tab = "chats" | "contacts" | "notifications" | "search" | "settings";

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearch, setChatSearch] = useState("");

  const currentContact = CONTACTS.find(c => c.id === activeChat);
  const currentMessages = activeChat ? (messages[activeChat] || []) : [];

  const sendMessage = () => {
    if (!message.trim() || !activeChat) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), {
        id: Date.now(), text: message, out: true, time, encrypted: true
      }]
    }));
    setMessage("");
  };

  const filteredChats = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const filteredAll = ALL_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = CONTACTS.reduce((acc, c) => acc + c.unread, 0);
  const unreadNotifs = NOTIFICATIONS.filter(n => !n.read).length;

  const navItems: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "chats", icon: "MessageCircle", label: "Чаты", badge: totalUnread },
    { id: "contacts", icon: "Users", label: "Контакты" },
    { id: "notifications", icon: "Bell", label: "Уведомления", badge: unreadNotifs },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="h-screen w-screen bg-mesh flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-16 flex flex-col items-center py-6 gap-1 glass border-r border-white/5 z-10">
        <div className="mb-6 flex flex-col items-center">
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
            <Icon name={item.icon} size={20} className="nav-icon" style={{ color: activeTab === item.id ? "hsl(270, 80%, 70%)" : undefined }} />
            {item.badge ? (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </button>
        ))}

        <div className="mt-auto">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform">
            ВЫ
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

          {activeTab === "chats" && (
            <div className="space-y-0.5">
              {filteredChats.map((contact, i) => (
                <button
                  key={contact.id}
                  onClick={() => setActiveChat(contact.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group animate-fade-in ${activeChat === contact.id ? "glass-strong" : "hover:bg-white/5"}`}
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {contact.avatar}
                    </div>
                    {contact.status === "online" && (
                      <div className="online-dot absolute -bottom-0.5 -right-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">{contact.name}</span>
                      <span className="text-[10px] text-white/30 ml-1">{contact.lastSeen}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="Lock" size={9} className="text-cyan-400 flex-shrink-0" />
                      <span className="text-xs text-white/35 truncate">Зашифровано</span>
                    </div>
                  </div>
                  {contact.unread > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full text-[11px] text-white font-bold flex items-center justify-center px-1.5">
                      {contact.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-0.5">
              <p className="text-xs text-white/30 px-2 mb-2 uppercase tracking-wider">Все контакты · {ALL_CONTACTS.length}</p>
              {ALL_CONTACTS.map((c, i) => (
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

          {activeTab === "search" && (
            <div>
              {searchQuery.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl glass mx-auto flex items-center justify-center mb-3 animate-float">
                    <Icon name="Search" size={24} className="text-purple-400" />
                  </div>
                  <p className="text-white/40 text-sm">Введите имя или @никнейм</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-xs text-white/30 px-2 mb-2 uppercase tracking-wider">Результаты · {filteredAll.length}</p>
                  {filteredAll.map((c, i) => (
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
        {activeChat && currentContact ? (
          <>
            <div className="h-16 glass border-b border-white/5 flex items-center px-5 gap-4">
              <div className="relative">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentContact.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {currentContact.avatar}
                </div>
                {currentContact.status === "online" && <div className="online-dot absolute -bottom-0.5 -right-0.5" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{currentContact.name}</p>
                <div className="flex items-center gap-1.5">
                  <Icon name="Lock" size={10} className="text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-medium">E2E шифрование</span>
                  {currentContact.status === "online" && (
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

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-white/25 px-2">Сегодня</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {currentMessages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`}
                  style={{ animationDelay: `${i * 0.04}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className={`max-w-[65%] ${msg.out ? "msg-out px-4 py-2.5" : "msg-in px-4 py-2.5"}`}>
                    <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.out ? "justify-end" : "justify-start"}`}>
                      {msg.encrypted && <Icon name="Lock" size={9} className="text-white/30" />}
                      <span className="text-[10px] text-white/30">{msg.time}</span>
                      {msg.out && <Icon name="CheckCheck" size={11} className="text-cyan-400/70" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
                  disabled={!message.trim()}
                  className="w-8 h-8 rounded-xl btn-gradient flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icon name="Send" size={14} className="text-white" />
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
            <h1 className="font-bold text-2xl grad-text mb-2" style={{ fontFamily: "Golos Text" }}>Добро пожаловать в Nex</h1>
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