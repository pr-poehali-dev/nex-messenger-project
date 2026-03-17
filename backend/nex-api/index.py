import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

"""
Nex Messenger API — чаты, сообщения, контакты
"""

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}

    action = params.get("action", "")

    # GET ?action=chats&user_id=1 — список чатов пользователя
    if method == "GET" and action == "chats":
        user_id = int(params.get("user_id", 1))
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        c.id,
                        c.is_group,
                        c.name,
                        CASE WHEN c.is_group THEN c.name
                             ELSE u.name
                        END AS display_name,
                        CASE WHEN c.is_group THEN '🚀'
                             ELSE u.avatar
                        END AS avatar,
                        CASE WHEN c.is_group THEN 'from-violet-500 to-cyan-500'
                             ELSE u.color
                        END AS color,
                        CASE WHEN c.is_group THEN 'online'
                             ELSE u.status
                        END AS status,
                        (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
                        (SELECT id FROM users WHERE id != %s AND id IN (SELECT user_id FROM chat_members WHERE chat_id = c.id) LIMIT 1) AS partner_id
                    FROM chats c
                    JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
                    LEFT JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s AND NOT c.is_group
                    LEFT JOIN users u ON u.id = cm2.user_id
                    ORDER BY last_message_at DESC NULLS LAST
                """, (user_id, user_id, user_id))
                chats = cur.fetchall()
        return resp(list(chats))

    # GET ?action=messages&chat_id=1 — сообщения чата
    if method == "GET" and action == "messages":
        chat_id = int(params.get("chat_id", 1))
        user_id = int(params.get("user_id", 1))
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT m.id, m.chat_id, m.sender_id, m.text, m.encrypted, m.created_at,
                           (m.sender_id = %s) AS is_out,
                           u.name AS sender_name
                    FROM messages m
                    JOIN users u ON u.id = m.sender_id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (user_id, chat_id))
                msgs = cur.fetchall()
        return resp(list(msgs))

    # POST — отправить сообщение
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        chat_id = int(body.get("chat_id", 0))
        sender_id = int(body.get("sender_id", 1))
        text = str(body.get("text", "")).strip()
        if not text or not chat_id:
            return resp({"error": "chat_id and text required"}, 400)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO messages (chat_id, sender_id, text, encrypted)
                    VALUES (%s, %s, %s, TRUE)
                    RETURNING id, chat_id, sender_id, text, encrypted, created_at
                """, (chat_id, sender_id, text))
                msg = cur.fetchone()
            conn.commit()
        return resp({**dict(msg), "is_out": True})

    # GET ?action=contacts&user_id=1 — контакты
    if method == "GET" and action == "contacts":
        user_id = int(params.get("user_id", 1))
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT u.id, u.name, u.avatar, u.color, u.status,
                           (SELECT COUNT(*) FROM contacts c2 WHERE c2.user_id = u.id AND c2.contact_id IN (SELECT contact_id FROM contacts WHERE user_id = %s)) AS mutual
                    FROM users u
                    JOIN contacts c ON c.contact_id = u.id AND c.user_id = %s
                    ORDER BY u.name
                """, (user_id, user_id))
                contacts = cur.fetchall()
        return resp(list(contacts))

    return resp({"error": "not found"}, 404)