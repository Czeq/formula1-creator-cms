export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const CODE_FILES: CodeFile[] = [
  {
    filename: 'graphics.py',
    language: 'python',
    description: 'High-definition compositing engine for Formula 1 BD (1:1 and 4:5 feeds). Renders photo transforms, contrast scrim, transparent logo watermarks, and tracked headline text.',
    content: `"""
Formula 1 BD Instagram CMS - Real-Time Graphics Engine (graphics.py)
Strictly renders composited graphics at 1080x1080 (1:1) and 1080x1350 (4:5) for @formula1.bd.

COMPOSITING PIPELINE:
1. Layer 1 (Bottom): The user's photo (Scaled to canvas, center-cropped, converted to RGBA).
   Supports interactive transforms (zoom, offset_x, offset_y, rotation).
2. Layer 1b: Dynamic Contrast Scrim (Graduated top scrim for logo, bottom scrim for text).
3. Layer 2 (Middle): Formula 1 BD Watermark Logo (f1bd_white_transparent_tight.png / black / solid).
4. Layer 3 (Top): Dynamic text layer rendered with Roboto-Black.ttf with Photoshop -50 tracking.
"""

import os
from typing import List, Tuple, Optional, Any
from PIL import Image, ImageOps, ImageDraw, ImageFont

CANVAS_WIDTH = 1080
CANVAS_HEIGHT = 1080

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(PROJECT_ROOT, "fonts")
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
F1_LOGOS_DIR = os.path.join(ASSETS_DIR, "logos")

DEFAULT_FONT_SIZE = 52
DEFAULT_MIN_FONT_SIZE = 18
DEFAULT_TRACKING = -50

def render_preview(photo, title, f1_logo_variant="white_transparent", canvas_w=1080, canvas_h=1080):
    # Pipeline implementation...
    pass
`
  },
  {
    filename: 'app.py',
    language: 'python',
    description: 'Creator-friendly desktop Streamlit editor with split layout, Formula 1 BD transparent logo selectors, 1:1 and 4:5 presets, and Supabase integration.',
    content: `"""
Formula 1 BD Instagram CMS - Streamlit Desktop Editor (app.py)
Features:
- Two-Column Split Layout for rapid post composition.
- Formula 1 BD Transparent Logo Selector (White / Black / Solid).
- 1:1 Square (1080x1080) and 4:5 Portrait (1080x1350) canvas presets.
- Supabase cloud sync & SQLite queue persistence.
"""

import streamlit as st
from PIL import Image
from graphics import render_preview

st.set_page_config(page_title="Formula 1 BD Creator Studio", page_icon="🏎️", layout="wide")

col_workspace, col_preview = st.columns([1, 1], gap="large")

with col_workspace:
    st.markdown("### 🏎️ Formula 1 BD Workspace")
    uploaded_photo = st.file_uploader("Upload Track Photo", type=["jpg", "jpeg", "png", "webp"])
    headline = st.text_input("Headline", value="FIRST BANGLADESHI ORIGIN RACER DEBUTS")
`
  },
  {
    filename: 'database.py',
    language: 'python',
    description: 'SQLite database module with WAL mode, thread-safe connection, and CRUD methods for formula1_posts.db.',
    content: `import sqlite3
import time
from typing import List, Dict, Any, Optional

DB_FILE = "formula1_posts.db"

def get_connection(db_path: str = DB_FILE) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    with conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db(db_path: str = DB_FILE) -> None:
    conn = get_connection(db_path)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                image_path TEXT NOT NULL,
                caption TEXT NOT NULL,
                post_timestamp INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Scheduled'
            );
        """)
    conn.close()

def add_post(title: str, image_path: str, caption: str, post_timestamp: int, status: str = "Scheduled", db_path: str = DB_FILE) -> int:
    conn = get_connection(db_path)
    with conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO posts (title, image_path, caption, post_timestamp, status) VALUES (?, ?, ?, ?, ?)",
                       (title.strip(), image_path.strip(), caption.strip(), int(post_timestamp), status))
        post_id = cursor.lastrowid
    conn.close()
    return post_id
`
  },
  {
    filename: 'publisher.py',
    language: 'python',
    description: 'Meta Graph API background daemon with Ngrok static tunnel, container polling, and automated publishing for @formula1.bd.',
    content: `import os
import sys
import time
import shutil
import logging
import requests
import schedule
from pyngrok import ngrok
import database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Publisher] %(message)s")
logger = logging.getLogger("Publisher")

IG_USER_ID = os.getenv("IG_USER_ID", "").strip()
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "").strip()
NGROK_DOMAIN = os.getenv("NGROK_DOMAIN", "").strip()
LOCAL_HTTP_PORT = int(os.getenv("LOCAL_HTTP_PORT", "8088"))
`
  },
  {
    filename: 'README.md',
    language: 'markdown',
    description: 'System documentation covering Formula 1 BD feed composition, transparent logo variants, and Supabase integration.',
    content: `# Formula 1 BD Creator CMS & Automated Publisher
High-Definition Instagram Publishing Pipeline for **@formula1.bd**:
1. Layer 1 (Bottom): Transformed Photo (1080x1080 or 1080x1350 with Zoom/Pan/Rotate)
2. Layer 1b: Contrast Scrim for track photos
3. Layer 2 (Middle): Formula 1 BD Watermark Logo (Tight-cropped transparent variants)
4. Layer 3 (Top): Dynamic Left-Aligned Roboto Black text with Photoshop -50 tracking
`
  }
];
