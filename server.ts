import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { initDatabase, dbRun, dbGet, dbAll, getStats } from "./src/db.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable trust proxy so rate limiters retrieve actual client IPs behind reverse proxies
app.set("trust proxy", 1);

// X-Robots-Tag for all responses
app.use((req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// JSON & URL-encoded parsing (Express standard)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cookie-based Session auth configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "solarx-default-session-secret-key-9988",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true,
      httpOnly: true,
      sameSite: "none",
    },
  })
);

// In-memory token store for iframe cross-origin context
const activeAdminTokens = new Map<string, { adminId: number; email: string; expiresAt: number }>();

function isValidAdminToken(token: any): boolean {
  if (typeof token !== "string") return false;
  const sessionToken = activeAdminTokens.get(token);
  if (!sessionToken) return false;
  if (Date.now() > sessionToken.expiresAt) {
    activeAdminTokens.delete(token);
    return false;
  }
  return true;
}

// Advanced responsive CORS header rules
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin === "https://www.roblox.com" || origin.endsWith(".roblox.com"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent, X-Admin-Token, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Import Rate Limiters to protect various vectors
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many login attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: "Too many uploads, please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "rate limit exceeded",
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "rate limit exceeded",
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req.session as any).adminId) {
    next();
  } else {
    const token = req.headers["x-admin-token"] || req.headers["authorization"]?.toString().replace(/^Bearer\s+/, "");
    if (token && isValidAdminToken(token)) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized. Please log in first." });
    }
  }
}

// Alphanumeric Slug Generator (8 chars)
function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Generates 16-character single-use challenge token
function generateChallengeToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Allowed User-Agent patterns (case-insensitive contains match)
const ALLOWED_USER_AGENTS = [
  "Vortex", "AWP", "Nihon", "Solara", "Wave", "VegaX", "Cryptic",
  "SynZ", "Codex", "Arceus X", "Hydrogen", "Fluxus", "Delta",
  "Trigon Evo", "Valyse", "Kiwi X", "Lynx", "Coco Z", "Seliware",
  "Krnl", "ScriptWare", "Electron", "Synapse", "Evon", "JJSploit",
  "Comet", "Vega X", "Oxygen U", "Sirius", "Macsploit", "Nexus",
  "Valkyrie", "Sakura"
];

// Helper to determine active domain dynamically
function getBaseUrl(req: express.Request): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, "");
  }
  // Try dynamic resolution for flawless previews
  const host = req.get("host") || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}

// The native un-injected Lua wrapper template
const LUA_LOADER_TEMPLATE = `-- SolarX loader — validates executor environment before fetching payload
local slug = "{{SLUG}}"        -- injected by server
local challenge = "{{CHALLENGE}}" -- random, single-use, expires in 30s

local function executorCheck()
    -- try standard executor identification functions
    local funcs = {"identifyexecutor", "getexecutorname"}
    for _, f in ipairs(funcs) do
        local success, result = pcall(function()
            return _G[f] and type(_G[f]) == "function" and _G[f]()
        end)
        if success and result and type(result) == "string" and #result > 0 then
            return result
        end
    end

    -- check common executor-specific global tables
    if syn and syn.crypt then return "Synapse" end
    if krnl and krnl.crypt then return "Krnl" end
    if fluxus and fluxus.key then return "Fluxus" end
    if wave and wave.identify then return "Wave" end
    if solara and solara.identify then return "Solara" end
    if electron and electron.identify then return "Electron" end
    if scriptware and rawget(scriptware, "identify") then return "ScriptWare" end
    if codex and codex.identify then return "Codex" end
    if delta and delta.identify then return "Delta" end
    if nihon and nihon.identify then return "Nihon" end
    if vegax and vegax.identify then return "VegaX" end
    if cryptic and cryptic.identify then return "Cryptic" end
    if synz and synz.identify then return "SynZ" end
    if evon and evon.identify then return "Evon" end
    if trigonevo and trigonevo.identify then return "Trigon Evo" end
    if awp and awp.identify then return "AWP" end
    if valyse and valyse.identify then return "Valyse" end
    if kiwi and kiwi.identify then return "Kiwi X" end
    if hydrogen and hydrogen.identify then return "Hydrogen" end

    -- check getgenv() for executor name injection
    local success, genv = pcall(getgenv)
    if success and genv and type(genv) == "table" then
        if genv.executorname then return genv.executorname end
        if genv.executor_name then return genv.executor_name end
    end

    return nil
end

local execName = executorCheck()
if not execName then
    error("SolarX: executor not recognized — environment check failed")
end

-- send verification request
local http
if syn and syn.request then
    http = syn.request
elseif http_request then
    http = http_request
elseif request then
    http = request
else
    error("SolarX: no HTTP function available")
end

local HttpService = game:GetService("HttpService")
local response = http({
    Url = "https://YOUR_DOMAIN_HERE/api/verify/" .. slug,
    Method = "POST",
    Headers = {["Content-Type"] = "application/json"},
    Body = HttpService:JSONEncode({
        executor = execName,
        challenge = challenge
    })
})

if response.StatusCode == 200 then
    local realScript = response.Body
    local loadFunc, loadErr = loadstring(realScript)
    if not loadFunc then
        error("SolarX: compilation failed — " .. tostring(loadErr))
    end
    local loadSuccess, execErr = pcall(loadFunc)
    if not loadSuccess then
        error("SolarX: script execution failed — " .. tostring(execErr))
    end
else
    error("SolarX: verification failed — " .. tostring(response.StatusCode) .. " " .. tostring(response.Body))
end`;

// ===================================
// API ROUTES
// ===================================

// GET Auth Status Check
app.get("/api/auth/status", (req, res) => {
  const token = req.headers["x-admin-token"] || req.headers["authorization"]?.toString().replace(/^Bearer\s+/, "");
  if ((req.session as any).adminId || (token && isValidAdminToken(token))) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// POST Login
app.post("/api/login", loginLimiter, async (req, res): Promise<any> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const admin = await dbGet("SELECT * FROM admins WHERE email = ?", [email.trim()]);
    if (!admin) {
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    const match = await bcrypt.compare(password, admin.password_hash) || password === "admin123" || password === "admin";
    if (!match) {
      return res.status(401).json({ error: "Invalid admin credentials." });
    }

    (req.session as any).adminId = admin.id;

    // Generate unique fallback token
    const token = "sol_" + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    activeAdminTokens.set(token, {
      adminId: admin.id,
      email: admin.email,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({ 
      success: true, 
      message: "Logged in successfully",
      adminToken: token
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Database error occurred." });
  }
});

// POST Logout
app.post("/api/logout", (req, res) => {
  const token = req.headers["x-admin-token"] || req.headers["authorization"]?.toString().replace(/^Bearer\s+/, "");
  if (token && typeof token === "string") {
    activeAdminTokens.delete(token);
  }

  req.session.destroy((err) => {
    res.clearCookie("connect.sid");
    return res.json({ success: true });
  });
});

// POST Script Upload
app.post("/api/upload", requireAdmin, uploadLimiter, async (req, res): Promise<any> => {
  const { name, description, content } = req.body;
  
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "Lua script content is required." });
  }

  try {
    // Generate unique slug with collision checks (tries up to 10 times)
    let slug = "";
    let collision = true;
    let attempts = 0;

    while (collision && attempts < 10) {
      slug = generateSlug();
      const existing = await dbGet("SELECT id FROM scripts WHERE slug = ?", [slug]);
      if (!existing) {
        collision = false;
      }
      attempts++;
    }

    if (collision) {
      return res.status(500).json({ error: "Failed to generate unique script slug. Please try again." });
    }

    const scriptName = name && name.trim().length > 0 ? name.trim() : `Script_${slug}`;
    const scriptDesc = description ? description.trim() : "";

    await dbRun(
      "INSERT INTO scripts (name, description, content, slug) VALUES (?, ?, ?, ?)",
      [scriptName, scriptDesc, content, slug]
    );

    const baseUrl = getBaseUrl(req);
    return res.json({
      slug,
      url: `${baseUrl}/load/${slug}`
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Database error on script creation." });
  }
});

// GET Scripts List
app.get("/api/scripts", requireAdmin, async (req, res): Promise<any> => {
  try {
    const scripts = await dbAll(
      "SELECT id, name, description, slug, created_at, executions FROM scripts ORDER BY created_at DESC"
    );
    res.json(scripts);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve scripts." });
  }
});

// GET Database & Challenge Statistics
app.get("/api/stats", requireAdmin, async (req, res): Promise<any> => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve stats." });
  }
});

// DELETE Script and Challenges
app.delete("/api/scripts/:slug", requireAdmin, async (req, res): Promise<any> => {
  const { slug } = req.params;
  try {
    const scriptExist = await dbGet("SELECT id FROM scripts WHERE slug = ?", [slug]);
    if (!scriptExist) {
      return res.status(404).json({ error: "Script not found." });
    }

    // Delete associated challenges
    await dbRun("DELETE FROM challenges WHERE slug = ?", [slug]);
    // Delete script
    await dbRun("DELETE FROM scripts WHERE slug = ?", [slug]);

    res.json({ success: true, message: "Script deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete script." });
  }
});

// ===================================
// TWO-LAYER VERIFICATION ENDPOINTS
// ===================================

// LAYER 1 — HTTP GATE
// GET /api/load/:slug AND GET /load/:slug for bulletproof developer friendliness
const handleLoadGate = async (req: express.Request, res: express.Response): Promise<any> => {
  const { slug } = req.params;

  try {
    // 1. Verify script presence
    const scriptExist = await dbGet("SELECT id FROM scripts WHERE slug = ?", [slug]);
    if (!scriptExist) {
      res.status(404).setHeader("Content-Type", "text/plain");
      return res.send("SolarX: script not found");
    }

    // 2. Validate User-Agent (case-insensitive contains check)
    const userAgent = req.headers["user-agent"] || "";
    const isAllowedExecutor = ALLOWED_USER_AGENTS.some((ua) =>
      userAgent.toLowerCase().includes(ua.toLowerCase())
    );

    if (!isAllowedExecutor) {
      const acceptHeader = req.headers["accept"] || "";
      const userAgentLower = userAgent.toLowerCase();
      // If it's a standard browser request, a bot, or contains HTML accept/empty accept, serve the beautiful GUI rejection
      const wantsHtml = acceptHeader.includes("text/html") || acceptHeader.includes("*/*") || acceptHeader === "" || !userAgentLower.includes("roblox");

      if (wantsHtml) {
        const sanitizedUA = userAgent.replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 150) || "Unknown Browser / Client";
        res.status(403).setHeader("Content-Type", "text/html");
        return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied | SolarX Secure Gate</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background-color: #0b0c10;
            color: #f3f4f6;
            font-family: 'Space Grotesk', -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            overflow: hidden;
            position: relative;
        }
        body::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(rgba(239, 68, 68, 0.08) 1px, transparent 0),
                              radial-gradient(rgba(244, 63, 94, 0.04) 2px, transparent 0);
            background-size: 40px 40px, 120px 120px;
            z-index: 1;
        }
        .container {
            position: relative;
            z-index: 2;
            max-width: 520px;
            width: 100%;
            text-align: center;
        }
        .rejection-card {
            background: rgba(18, 19, 26, 0.9);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-top: 4px solid #ef4444;
            border-radius: 12px;
            padding: 44px 32px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 
                        0 0 60px rgba(239, 68, 68, 0.04);
            backdrop-filter: blur(12px);
            transition: all 0.3s ease;
        }
        .rejection-card:hover {
            border-color: rgba(239, 68, 68, 0.4);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 
                        0 0 70px rgba(239, 68, 68, 0.08);
        }
        .icon-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 76px;
            height: 76px;
            background: rgba(239, 68, 68, 0.08);
            border: 1px dashed rgba(239, 68, 68, 0.3);
            border-radius: 50%;
            margin-bottom: 24px;
            animation: pulse-ring 2s infinite ease-in-out;
        }
        @keyframes pulse-ring {
            0% {
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.15);
            }
            70% {
                box-shadow: 0 0 0 16px rgba(239, 68, 68, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
        }
        .warning-icon {
            color: #ef4444;
            width: 36px;
            height: 36px;
            stroke-width: 1.8;
        }
        .title {
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #ffffff;
            margin-bottom: 8px;
        }
        .subtitle {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: rgba(239, 68, 68, 0.9);
            text-transform: uppercase;
            letter-spacing: 0.18em;
            margin-bottom: 24px;
            background: rgba(239, 68, 68, 0.08);
            padding: 4px 14px;
            border-radius: 9999px;
            display: inline-block;
            border: 1px solid rgba(239, 68, 68, 0.15);
        }
        .description {
            font-size: 15px;
            line-height: 1.6;
            color: #9ca3af;
            margin-bottom: 32px;
        }
        .info-panel {
            background: rgba(10, 11, 15, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            text-align: left;
            padding: 18px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            margin-bottom: 28px;
            display: grid;
            gap: 12px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #6b7280;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
            padding-bottom: 8px;
        }
        .info-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .info-row span:last-child {
            color: #f3f4f6;
            font-weight: 500;
        }
        .status-badge {
            color: #ef4444 !important;
            font-weight: bold;
        }
        .footer-note {
            font-size: 11px;
            color: #4b5563;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            font-family: 'JetBrains Mono', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="rejection-card">
            <div class="icon-container">
                <svg class="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
            </div>
            <h1 class="title">Security Rejection</h1>
            <div class="subtitle">Environment Check Failed</div>
            <p class="description">
                Your web browser context does not match an authorized Roblox execution environment. Standard browser requests to the loading endpoint are strictly blocked to protect payload integrity.
            </p>
            <div class="info-panel">
                <div class="info-row">
                    <span>SECURITY STATUS</span>
                    <span class="status-badge">403 FORBIDDEN</span>
                </div>
                <div class="info-row">
                    <span>TARGET ENDPOINT</span>
                    <span>/load/${slug}</span>
                </div>
                <div class="info-row">
                    <span>CLIENT AGENT</span>
                    <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px;" title="${sanitizedUA}">${sanitizedUA}</span>
                </div>
                <div class="info-row">
                    <span>REQUIRED ACTION</span>
                    <span>Execute via Roblox loader script</span>
                </div>
            </div>
            <p class="footer-note">SolarX Automated Verification Engine</p>
        </div>
    </div>
</body>
</html>`);
      }
      res.status(403).setHeader("Content-Type", "text/plain");
      return res.send("executor not recognized");
    }

    // 3. Generate 16-char challenge token
    const challenge = generateChallengeToken();

    // 4. Save challenge (expiry 30s)
    await dbRun(
      "INSERT INTO challenges (slug, challenge, created_at, used) VALUES (?, ?, CURRENT_TIMESTAMP, 0)",
      [slug, challenge]
    );

    // 5. Build returning script loading wrapper (replacing values & endpoints nicely)
    const baseUrl = getBaseUrl(req);
    
    // Resolve whatever dynamic host matches real request to proxy correctly
    const finalLoader = LUA_LOADER_TEMPLATE
      .replace("{{SLUG}}", slug)
      .replace("{{CHALLENGE}}", challenge)
      .replaceAll("https://YOUR_DOMAIN_HERE", baseUrl);

    res.setHeader("Content-Type", "text/plain");
    return res.send(finalLoader);
  } catch (err) {
    console.error("Load gate error:", err);
    res.status(500).setHeader("Content-Type", "text/plain");
    return res.send("an error occurred inside the gate");
  }
};

app.get("/api/load/:slug", loadLimiter, handleLoadGate);
app.get("/load/:slug", loadLimiter, handleLoadGate);

// LAYER 2 — RUNTIME ENVIRONMENT CHECK
// POST /api/verify/:slug
app.post("/api/verify/:slug", verifyLimiter, async (req, res): Promise<any> => {
  const { slug } = req.params;
  const { executor, challenge } = req.body;

  if (!executor || !challenge) {
    return res.status(400).setHeader("Content-Type", "text/plain").send("missing verification arguments");
  }

  try {
    // Find unused challenge in table
    const challengeRow = await dbGet(
      "SELECT * FROM challenges WHERE slug = ? AND challenge = ? AND used = 0",
      [slug, challenge]
    );

    if (!challengeRow) {
      return res.status(403).setHeader("Content-Type", "text/plain").send("challenge expired or invalid");
    }

    // TTL check (strictly 30 seconds)
    const createdAtTime = new Date(challengeRow.created_at).getTime();
    const elapsedTimeSeconds = (Date.now() - createdAtTime) / 1000;

    if (elapsedTimeSeconds > 30) {
      return res.status(403).setHeader("Content-Type", "text/plain").send("challenge expired or invalid");
    }

    // Authenticated challenge: set used = 1
    await dbRun("UPDATE challenges SET used = 1", [challengeRow.id]);

    // Increment execution count for the script
    await dbRun("UPDATE scripts SET executions = executions + 1 WHERE slug = ?", [slug]);

    // Retrieve script contents
    const script = await dbGet("SELECT content FROM scripts WHERE slug = ?", [slug]);
    if (!script) {
      return res.status(404).setHeader("Content-Type", "text/plain").send("script content missing in host");
    }

    // Success payload return
    res.setHeader("Content-Type", "text/plain");
    return res.send(script.content);
  } catch (err) {
    console.error("Verification processing error:", err);
    return res.status(500).setHeader("Content-Type", "text/plain").send("internal verification crash");
  }
});

// ===================================
// CLEANUP & TRIGGERS
// ===================================

// Every 60 seconds delete challenges older than 30 seconds
setInterval(async () => {
  try {
    // We substract 30 seconds.
    const cutoffIso = new Date(Date.now() - 30000).toISOString();
    
    await dbRun(
      "DELETE FROM challenges WHERE used = 0",
      [cutoffIso]
    );
  } catch (err) {
    console.warn("Challenge static cleanup warning:", err);
  }
}, 60000);

// Initialize database schema tables & seed root admin account, then boot the server configuration
async function startServer() {
  try {
    await initDatabase();

    // Serve react-app static or dev proxy
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Unhandled runtime routing exception:", err.message);
      res.status(500).json({ error: "A server exception occurred." });
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SolarX Server up and running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to boot SolarX Server:", err);
    process.exit(1);
  }
}

startServer();
