# Formula 1 BD Instagram Creator Studio & Automated Publisher

A modern Content Management System (CMS) and automated background publisher built for the Instagram Creator account **@formula1.bd**.

This architecture combines a desktop-grade Streamlit creation studio, a high-definition **Pillow compositing engine** (1080×1080 1:1 square & 1080×1350 4:5 vertical), transparent logo overlays, an SQLite/Supabase database layer running in concurrent **Write-Ahead Logging (WAL)** mode, and an automated background publishing daemon powered by **pyngrok** and the **Meta Instagram Graph API v21.0**.

---

## 📁 System Architecture & Directory Structure

```
formula1-creator-cms/
├── assets/
│   └── logos/
│       ├── f1bd_white_transparent_tight.png  <- Tight-cropped white transparent logo
│       ├── f1bd_black_transparent_tight.png  <- Tight-cropped black transparent logo
│       └── f1bd_white_solid.png              <- Solid framed badge logo
├── public/
│   └── logos/                                <- Frontend public logo directory
├── fonts/
│   └── Roboto-Black.ttf                      <- Authentic Roboto Black TrueType font
├── formula1_posts.db                         <- SQLite database (auto-created on first run with WAL mode)
├── ready/                                    <- Queued 1080×1080 / 1080×1350 JPEG graphics awaiting publication
├── published/                                <- Successfully published graphics archived here
├── app.py                                    <- Streamlit WYSIWYG Creator Studio & Queue interface
├── graphics.py                               <- High-definition Pillow compositing engine (-50 tracking)
├── database.py                               <- SQLite WAL database layer (check_same_thread=False)
├── publisher.py                              <- Meta Graph API v21.0 background publisher daemon
├── terminal_ui.py                            <- ANSI styling & terminal dashboard
├── requirements.txt                          <- Python package dependencies
└── .env                                      <- Local credentials (Meta tokens, Instagram ID, Ngrok)
```

---

## 🎨 High-Definition Compositing Pipeline

The canvas rendering pipeline strictly enforces three distinct layers to guarantee exact visual identity without procedural artifacts:

1. **Layer 1 (Bottom): Background Photo**
   - User-uploaded image scaled to cover the **1080×1080 (1:1)** or **1080×1350 (4:5)** canvas.
   - Supports interactive **Zoom** ($1.0\times$ – $3.0\times$), **Pan X** ($-500\text{px}$ to $+500\text{px}$), **Pan Y** ($-500\text{px}$ to $+500\text{px}$), and **Rotation** ($-45^\circ$ to $+45^\circ$) with high-quality bicubic resampling.
2. **Layer 1b: Dynamic Contrast Scrim**
   - Graduated top scrim for watermark logo readability.
   - Graduated bottom scrim for headline text contrast against complex track photography.
3. **Layer 2 (Middle): Formula 1 BD Watermark Logo**
   - Selectable transparent logo version:
     - `f1bd_white_transparent_tight.png` (for dark / track photos)
     - `f1bd_black_transparent_tight.png` (for bright daylight photos)
     - `f1bd_white_solid.png` (framed badge emblem)
   - Configurable placement (`center`, `left`, `right`) and scale.
4. **Layer 3 (Top): Left-Aligned Dynamic Headline**
   - Rendered using **Roboto-Black.ttf** in all caps.
   - Photoshop **-50 Tracking**: Character-by-character layout with letter offset:
     $$\text{offset} = \left(\frac{-50}{1000}\right) \times \text{font\_size}$$
   - **Auto-Fit Safeguard**: If text wraps beyond the bounding box, font size automatically decrements until it fits within the safe zone.

---

## 📦 Dependencies & Installation

### 1. Python Environment (Python 3.10 - 3.12 recommended)
Open your terminal inside the project directory and create a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate on macOS / Linux:
source venv/bin/activate

# Activate on Windows (PowerShell):
venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🔑 External API & Token Setup Guide

This system requires two external integrations for direct Instagram publishing:
1. **Meta Graph API** (to publish directly to `@formula1.bd`).
2. **Ngrok** (to temporarily expose your local `/ready/` graphic via HTTPS so Meta's servers can fetch it).

### Part A: Meta Developer & Instagram Creator Setup

#### Step 1: Account Requirements
1. Ensure your Instagram account `@formula1.bd` is converted to an **Instagram Creator** or **Instagram Business** account.
2. Link your Instagram account to a Facebook Page in Instagram Settings $\rightarrow$ **Creator tools and controls** $\rightarrow$ **Connect or create a Facebook Page**.

#### Step 2: Create a Meta Developer App
1. Go to the [Meta for Developers Portal](https://developers.facebook.com/) and log in.
2. Click **My Apps** $\rightarrow$ **Create App**.
3. Select **Business** as the app type $\rightarrow$ Click **Create App** (e.g. `F1 BD Publisher`).

#### Step 3: Add Instagram Graph API & Scopes
1. Add **Instagram Graph API** in your App Dashboard.
2. In Graph API Explorer, request the following permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
3. Generate and exchange your token for a **60-day Long-Lived User Access Token**.

---

## 🔐 Environment Variables (`.env`)

Create a `.env` file in the root project directory:

```env
# Meta Instagram Graph API Credentials
META_ACCESS_TOKEN="EAAxxxxxx..."
IG_USER_ID="17841400000000000"

# Ngrok Configuration
NGROK_AUTHTOKEN="2xxxxxx..."
NGROK_DOMAIN="f1bd-studio.ngrok-free.app"

# Local Server Configuration
LOCAL_HTTP_PORT="8088"
```

---

## 🚀 Execution Guide

Run the **Streamlit UI** and the **Publisher Daemon** in separate terminal windows:

### Terminal 1: Streamlit Creator Studio
```bash
streamlit run app.py
```
- Open `http://localhost:8501`.
- Upload your track or motorsport image.
- Select your transparent logo version (White / Black / Solid).
- Enter the uppercase headline.
- Schedule the post to the queue.

### Terminal 2: Background Publisher Daemon
```bash
python publisher.py
```
- The daemon checks `formula1_posts.db` every 60 seconds for due posts and publishes them directly to `@formula1.bd`.
