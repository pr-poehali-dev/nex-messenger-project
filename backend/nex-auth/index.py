import json
import os
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

"""
Nex Auth — регистрация и вход по номеру телефона + OTP-код.
MVP: код всегда 1234 (SMS не подключён).
"""

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

COLORS = [
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-orange-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-rose-500 to-orange-500",
    "from-violet-500 to-cyan-500",
    "from-blue-500 to-violet-500",
]

def get_conn():
    dsn = os.environ["DATABASE_URL"]
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    return psycopg2.connect(dsn, options=f"-c search_path={schema}")

def resp(data, status=200):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }

def make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()

def normalize_phone(raw: str) -> str:
    phone = "".join(c for c in raw if c.isdigit() or c == "+")
    if not phone.startswith("+"):
        phone = "+" + phone
    return phone

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # send_otp: отправить код на номер
    if action == "send_otp":
        raw_phone = str(body.get("phone", "")).strip()
        if not raw_phone or len(raw_phone) < 10:
            return resp({"error": "Введите корректный номер телефона"}, 400)

        phone = normalize_phone(raw_phone)
        otp = "1234"  # MVP — фиксированный код
        expires = datetime.now() + timedelta(minutes=10)

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
                existing = cur.fetchone()
                if existing:
                    cur.execute(
                        "UPDATE users SET otp_code=%s, otp_expires_at=%s WHERE phone=%s",
                        (otp, expires, phone)
                    )
                    is_new = False
                else:
                    is_new = True
            conn.commit()

        return resp({"success": True, "is_new": is_new, "hint": "Код подтверждения: 1234"})

    # verify_otp: проверить код
    if action == "verify_otp":
        raw_phone = str(body.get("phone", "")).strip()
        otp = str(body.get("otp", "")).strip()
        name = str(body.get("name", "")).strip()

        if not raw_phone or not otp:
            return resp({"error": "Укажите телефон и код"}, 400)

        phone = normalize_phone(raw_phone)

        if otp != "1234":
            return resp({"error": "Неверный код подтверждения"}, 400)

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM users WHERE phone = %s", (phone,))
                user = cur.fetchone()

                if not user:
                    # Новый пользователь — нужно имя
                    if not name:
                        return resp({"need_name": True})
                    color = COLORS[abs(hash(phone)) % len(COLORS)]
                    avatar = make_initials(name)
                    cur.execute(
                        """INSERT INTO users (name, phone, avatar, color, status)
                           VALUES (%s, %s, %s, %s, 'online') RETURNING *""",
                        (name, phone, avatar, color)
                    )
                    user = cur.fetchone()
                else:
                    cur.execute(
                        "UPDATE users SET status='online', otp_code=NULL, otp_expires_at=NULL WHERE id=%s",
                        (user["id"],)
                    )

                token = secrets.token_hex(32)
                token_expires = datetime.now() + timedelta(days=30)
                cur.execute(
                    "INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)",
                    (token, user["id"], token_expires)
                )
            conn.commit()

        return resp({
            "success": True,
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "avatar": user["avatar"],
                "color": user["color"],
                "phone": user["phone"],
            }
        })

    # me: получить пользователя по токену
    if action == "me":
        token = str(body.get("token", "")).strip()
        if not token:
            return resp({"error": "unauthorized"}, 401)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """SELECT u.id, u.name, u.avatar, u.color, u.phone, u.status
                       FROM sessions s JOIN users u ON u.id = s.user_id
                       WHERE s.id = %s AND s.expires_at > NOW()""",
                    (token,)
                )
                user = cur.fetchone()
        if not user:
            return resp({"error": "unauthorized"}, 401)
        return resp({"user": dict(user)})

    # logout
    if action == "logout":
        token = str(body.get("token", "")).strip()
        if token:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE sessions SET expires_at=NOW() WHERE id=%s", (token,)
                    )
                    cur.execute(
                        """UPDATE users SET status='offline'
                           WHERE id = (SELECT user_id FROM sessions WHERE id=%s)""",
                        (token,)
                    )
                conn.commit()
        return resp({"success": True})

    return resp({"error": "unknown action"}, 400)