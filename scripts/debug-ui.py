from pathlib import Path
import os
import re
import sqlite3
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
OUT = Path("artifacts/debug-ui")
OUT.mkdir(parents=True, exist_ok=True)

PNG_1X1 = (
    "data:image/png;base64,"
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


def check_no_horizontal_overflow(page, label):
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
    )
    if overflow:
        raise AssertionError(f"{label}: horizontal overflow detected")


def shot_name(prefix, path):
    clean = re.sub(r"[^a-zA-Z0-9_-]+", "-", path.strip("/") or "home").strip("-")
    return OUT / f"{prefix}-{clean or 'home'}.png"


def main():
    console_errors = []
    db_path = Path("data/social.db")
    if db_path.exists():
      with sqlite3.connect(db_path) as conn:
          conn.executescript(
              """
              DELETE FROM likes;
              DELETE FROM bookmarks;
              DELETE FROM comments;
              DELETE FROM notifications;
              DELETE FROM reports;
              DELETE FROM message_reports;
              DELETE FROM group_reports;
              DELETE FROM audit_logs;
              DELETE FROM follows;
              DELETE FROM messages;
              DELETE FROM conversation_members;
              DELETE FROM conversations;
              DELETE FROM group_requests;
              DELETE FROM group_members;
              DELETE FROM posts;
              DELETE FROM groups;
              DELETE FROM users;
              DELETE FROM sqlite_sequence WHERE name IN ('users', 'posts', 'comments', 'notifications', 'reports', 'audit_logs', 'groups', 'conversations', 'messages', 'message_reports', 'group_reports');
              """
          )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 1000})
        page = context.new_page()
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        suffix = "debugui"
        admin_email = f"admin-{suffix}@example.test"
        user_email = f"user-{suffix}@example.test"

        for payload in [
            {"name": "Marta Velluti", "email": admin_email, "password": "password123"},
            {"name": "Elia Roversi", "email": user_email, "password": "password123"},
        ]:
            context.request.post(f"{BASE_URL}/api/auth/register", data=payload)

        login = context.request.post(
            f"{BASE_URL}/api/auth/login",
            data={"email": admin_email, "password": "password123"},
        )
        assert login.ok

        context.request.patch(
            f"{BASE_URL}/api/profile",
            data={
                "name": "Marta Velluti",
                "bio": "Curatrice di appunti brevi, prototipi sociali e piccoli rituali digitali.",
                "avatar_data": PNG_1X1,
                "cover_data": PNG_1X1,
            },
        )
        post_response = context.request.post(
            f"{BASE_URL}/api/posts",
            data={"content": "Sto provando Piccolo con una bio, una copertina e un feed piu vivo."},
        )
        assert post_response.ok
        context.request.patch(
            f"{BASE_URL}/api/posts/1",
            data={"content": "Sto provando Piccolo con una bio, una copertina e un feed piu vivo. Modifica testata."},
        )
        context.request.post(f"{BASE_URL}/api/posts/1/bookmark")
        context.request.post(
            f"{BASE_URL}/api/posts/1/comments",
            data={"content": "Commento di prova: la conversazione ora ha una pagina dedicata."},
        )
        context.request.patch(
            f"{BASE_URL}/api/comments/1",
            data={"content": "Commento di prova modificato: la conversazione ora ha una pagina dedicata."},
        )
        context.request.post(
            f"{BASE_URL}/api/auth/login",
            data={"email": user_email, "password": "password123"},
        )
        context.request.post(f"{BASE_URL}/api/posts/1/like")
        context.request.post(
            f"{BASE_URL}/api/posts/1/comments",
            data={"content": "Da utente esterno: notifica e commento funzionano."},
        )
        context.request.post(
            f"{BASE_URL}/api/posts/1/report",
            data={"reason": "Controllo moderazione per il debug UI.", "category": "privacy"},
        )
        context.request.post(f"{BASE_URL}/api/users/1/follow")
        dm_response = context.request.post(
            f"{BASE_URL}/api/conversations",
            data={"memberIds": [1]},
        )
        assert dm_response.ok
        context.request.post(
            f"{BASE_URL}/api/conversations/1/messages",
            data={"content": "Ciao Marta, proviamo anche i DM."},
        )
        context.request.post(
            f"{BASE_URL}/api/auth/login",
            data={"email": admin_email, "password": "password123"},
        )
        group_response = context.request.post(
            f"{BASE_URL}/api/groups",
            data={
                "name": "Letture brevi",
                "description": "Un gruppo pubblico per appunti e link da leggere in pausa.",
                "privacy": "public",
            },
        )
        assert group_response.ok
        context.request.post(
            f"{BASE_URL}/api/groups/1/posts",
            data={"content": "Primo post nel gruppo pubblico: prove tecniche di community."},
        )
        private_response = context.request.post(
            f"{BASE_URL}/api/groups",
            data={
                "name": "Laboratorio privato",
                "description": "Spazio su invito per bozze e conversazioni riservate.",
                "privacy": "private",
            },
        )
        assert private_response.ok

        desktop_paths = ["/", "/feed", "/feed?scope=all", "/groups", "/groups/letture-brevi", "/groups/laboratorio-privato", "/messages", "/messages/1", "/post/1", "/notifications", "/search?q=Piccolo", "/saved", "/explore?q=Elia", "/profile/1", "/profile/1?tab=comments", "/settings/profile", "/settings/account", "/admin"]
        for path in desktop_paths:
            page.goto(f"{BASE_URL}{path}")
            page.wait_for_load_state("networkidle")
            check_no_horizontal_overflow(page, f"desktop {path}")
            page.screenshot(path=shot_name("desktop", path), full_page=True)

        theme_response = context.request.patch(
            f"{BASE_URL}/api/account/theme",
            data={"theme": "dark"},
        )
        assert theme_response.ok
        for path in ["/feed", "/settings/account"]:
            page.goto(f"{BASE_URL}{path}")
            page.wait_for_load_state("networkidle")
            check_no_horizontal_overflow(page, f"desktop dark {path}")
            page.screenshot(path=shot_name("desktop-dark", path), full_page=True)

        mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mpage = mobile.new_page()
        mpage.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        mobile.add_cookies(context.cookies())

        for path in ["/feed", "/feed?scope=all", "/groups", "/groups/letture-brevi", "/messages", "/messages/1", "/post/1", "/notifications", "/search?q=Piccolo", "/saved", "/explore?q=Elia", "/profile/1", "/profile/1?tab=comments", "/settings/profile", "/settings/account"]:
            mpage.goto(f"{BASE_URL}{path}")
            mpage.wait_for_load_state("networkidle")
            check_no_horizontal_overflow(mpage, f"mobile {path}")
            mpage.screenshot(path=shot_name("mobile", path), full_page=True)

        expect(mpage.get_by_role("navigation").last).to_be_visible()
        page.goto(f"{BASE_URL}/explore?q=Elia")
        page.wait_for_load_state("networkidle")
        expect(page.get_by_text("Directory")).to_be_visible()

        browser.close()

    if console_errors:
        raise AssertionError("Console errors:\n" + "\n".join(console_errors))

    print(f"UI debug screenshots written to {OUT.resolve()}")


if __name__ == "__main__":
    main()
