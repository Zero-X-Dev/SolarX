# SolarX — Secure Roblox Script Host

SolarX is a premium, multi-layer secure script hosting service designed specifically for serving Roblox scripts to real executors. It features robust User-Agent detection gating combined with an active in-game environment cryptographic challenge handshaking mechanism to prevent bot scraper extraction, indexers, curl, or deobfuscator analysis.

## ═══ Architecture Characteristics ═══

### Layer 1: HTTP Gate (Gatekeeper)
When a client requests a script via `GET /load/:slug`, SolarX evaluates the `User-Agent` header of the incoming call against a strict curated database of recognized Roblox executors (such as *Solara, Solara, Wave, Fluxus, Arcues X, Electron, Synapse, Codex, VegaX, and Seliware*). 
- Normal browsers, `curl`, indexers, or bots receive a strict `HTTP 403: executor not recognized` plain-text response, completely masking database presence.
- Deployed executors obtain a randomly generated single-use cryptographic `challenge token` which is valid for exactly 30 seconds. This is injected dynamically into a secure Lua loader wrapper returned as `text/plain` content.

### Layer 2: Runtime Environment Challenge (Verification)
The returned Lua wrapper initiates runtime verification directly inside Roblox's protected execution context:
1. It scans global indexes (`identifyexecutor`, `getexecutorname`, specific environment variables, etc.) of the execution engine.
2. It executes a `POST` request back to our secure handshaking terminal (`/api/verify/:slug`) containing the detected environment executor name and the challenge token.
3. The backend matches the token, validates its `30-second expiry TTL`, invalidates the token from the database, and finally returns the decrypted core Lua script content for runtime loadstrings.

---

## ═══ Quick Setup & Installation ═══

To start the SolarX environment on local or deployed servers, follow the instructions below:

### 1. Prerequisites & Dependencies
Ensure you have Node.js (v18+) and npm installed.

Install the necessary database engines and security dependencies:
```bash
npm install
```

### 2. Configure Environment Options
Create a `.env` file in your root folder (use `.env.example` as a template structure):
```env
PORT=3000
SESSION_SECRET="your-cyber-session-secret"
ADMIN_EMAIL="admin@solarx.dev"
# admin123 hashed with bcrypt:
ADMIN_PASSWORD_HASH="$2a$10$7vshA8g1P053PsnMh/rDaeSjL2B98uUa1FCS4iF2LqP3g69B8fXg6"
DATABASE_PATH="./solarx.db"
BASE_URL="https://YOUR_DOMAIN_HERE"
```

### 3. Run and Seed the Database
Database setups are automated. When starting the application, SolarX detects if tables exist and seeds the SQLite backend automatically under the credentials defined in your `.env` variables (default matches `admin@solarx.dev`).

### 4. Running the Server

#### Development Mode:
Boot local TSX and hot assets loading:
```bash
npm run dev
```

#### Production Compilation:
Compile the React frontend client and pack the secure Express backend into a single-file bundle using `esbuild`:
```bash
npm run build
```

#### Boot Production:
```bash
npm start
```

---

## ═══ Operational Maintenance ═══

- **Automatic Cleanup Interval**: A background recurring task executes every 60 seconds to prune old and unused challenge tokens from the active tables, maintaining low database footprint and high response speed under heavy executor traffic.
- **Trace-Free Environment**: SolarX returns zero meta tags regarding application purposes, doesn't generate `robots.txt` or sitemaps, and enforces `X-Robots-Tag: noindex, nofollow` headers globally.
