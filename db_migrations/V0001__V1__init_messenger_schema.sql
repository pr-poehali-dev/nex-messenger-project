
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(10) NOT NULL DEFAULT 'U',
  color VARCHAR(80) NOT NULL DEFAULT 'from-purple-500 to-pink-500',
  status VARCHAR(20) NOT NULL DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  contact_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  is_group BOOLEAN DEFAULT FALSE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_members (
  chat_id INTEGER NOT NULL REFERENCES chats(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (name, avatar, color, status) VALUES
  ('Вы', 'ВЫ', 'from-violet-500 to-cyan-500', 'online'),
  ('Алина Морозова', 'AM', 'from-purple-500 to-pink-500', 'online'),
  ('Денис Калинин', 'ДК', 'from-cyan-500 to-blue-500', 'online'),
  ('Юля Захарова', 'ЮЗ', 'from-orange-500 to-pink-500', 'offline'),
  ('Артём Волков', 'АВ', 'from-emerald-500 to-teal-500', 'offline'),
  ('Мария Соколова', 'МС', 'from-rose-500 to-orange-500', 'online');

INSERT INTO contacts (user_id, contact_id) VALUES
  (1,2),(1,3),(1,4),(1,5),(1,6),
  (2,1),(3,1),(4,1),(5,1),(6,1);

INSERT INTO chats (is_group, name) VALUES
  (FALSE, NULL),
  (FALSE, NULL),
  (FALSE, NULL),
  (TRUE, 'Команда Nex');

INSERT INTO chat_members (chat_id, user_id) VALUES
  (1,1),(1,2),
  (2,1),(2,3),
  (3,1),(3,4),
  (4,1),(4,2),(4,3);

INSERT INTO messages (chat_id, sender_id, text) VALUES
  (1, 2, 'Привет! Как дела? 😊'),
  (1, 1, 'Всё отлично! Работаю над новым проектом'),
  (1, 2, 'О, расскажи подробнее! Что за проект?'),
  (1, 1, 'Создаём мессенджер со сквозным шифрованием — Nex! 🔐'),
  (1, 2, 'Звучит круто! Когда релиз?'),
  (1, 1, 'Скоро! Уже тестируем первую версию 🚀'),
  (2, 3, 'Привет! Видел новые анонсы от Apple?'),
  (2, 1, 'Да, очень интересно смотрится!'),
  (3, 4, 'Созвонимся вечером?'),
  (3, 1, 'Да, в 19:00 удобно?'),
  (3, 4, 'Отлично, договорились! 👍'),
  (4, 2, '🚀 Всем привет! Новая версия уже в деплое'),
  (4, 1, 'Супер! Какие изменения?'),
  (4, 3, 'Исправили баги с уведомлениями и добавили анимации'),
  (4, 1, 'Огонь 🔥');
