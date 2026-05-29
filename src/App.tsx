import { useState, useEffect, FormEvent } from "react";
import { 
  Lock, 
  Terminal, 
  Copy, 
  Check, 
  Trash2, 
  LogOut, 
  Upload, 
  Layers, 
  Plus, 
  Search, 
  ExternalLink,
  Code2,
  Calendar,
  AlertTriangle,
  Play
} from "lucide-react";

// Custom fetch helper to automatically inject the authentication header safely
const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === "string" ? input : (input && (input as any).url) || "";
  if (typeof url === "string" && url.includes("/api/")) {
    const token = localStorage.getItem("solarx_token");
    if (token) {
      init = init || {};
      if (init.headers instanceof Headers) {
        init.headers.set("X-Admin-Token", token);
      } else if (Array.isArray(init.headers)) {
        init.headers.push(["X-Admin-Token", token]);
      } else {
        init.headers = {
          ...init.headers,
          "X-Admin-Token": token,
        };
      }
    }
  }
  return window.fetch(input, init);
};

interface ScriptItem {
  id: number;
  name: string;
  description: string;
  slug: string;
  created_at: string;
  executions?: number;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  
  // Navigation Helper
  const navigate = (targetPath: string) => {
    window.history.pushState({}, "", targetPath);
    setPath(targetPath);
  };

  // Listen to popstate changes
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#060508] text-[#eeeeee] relative overflow-hidden flex flex-col selection:bg-[#8B00FF] selection:text-white">
      {/* Dynamic Purple Backlight Glow */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full bg-[#8B00FF]/5 -top-40 -left-40 pointer-events-none blur-3xl" 
        style={{ zIndex: 0 }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full bg-[#D000FF]/5 bottom-0 right-0 pointer-events-none blur-3xl" 
        style={{ zIndex: 0 }}
      />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 subtle-purple-grid pointer-events-none" style={{ zIndex: 0 }} />

      {/* Content wrapper */}
      <div className="relative flex-grow flex flex-col" style={{ zIndex: 1 }}>
        {path === "/" && <LandingPage navigate={navigate} />}
        {path === "/admin" && <AdminPage navigate={navigate} />}
        {path === "/dashboard" && <DashboardPage navigate={navigate} />}
        
        {/* Support basic catchall fallback (404-ish but safe) */}
        {path !== "/" && path !== "/admin" && path !== "/dashboard" && (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
              404 — Cyber-Link Severed
            </h1>
            <p className="mt-2 text-[#a1a1aa] text-sm font-mono leading-relaxed">
              The requested address is offline or restricted.
            </p>
            <button 
              onClick={() => navigate("/")}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[#8B00FF] to-[#D000FF] text-white font-medium rounded-lg text-xs tracking-wider uppercase transition-transform hover:scale-105 active:scale-95"
            >
              Exfiltrate To Root
            </button>
          </div>
        )}
      </div>

      {/* Humble, literal subtle copyright / telemetry-free footer */}
      <footer className="py-4 border-t border-[#1a1824] bg-[#07060a]/80 backdrop-blur-md relative" style={{ zIndex: 2 }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#52525b] font-mono">
          <p>© 2026 SolarX. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span className="text-[#a855f7]/60">Secure Two-Layer Node Protection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===================================
// 1. LANDING PAGE VIEW (/)
// ===================================
function LandingPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="flex-grow flex flex-col items-center justify-center relative px-6 py-12">
      {/* Large faint glowing pulsing background blob behind text */}
      <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-gradient-to-r from-[#8B00FF] to-[#D000FF] ambient-fade -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative text-center select-none z-10 flex flex-col items-center">
        {/* Glowing Title Grid - Now clickable to navigate to /admin */}
        <h1 
          onClick={() => navigate("/admin")}
          className="text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-[#8B00FF] via-[#af3aff] to-[#D000FF] bg-clip-text text-transparent filter drop-shadow-[0_0_35px_rgba(139,0,255,0.4)] cursor-pointer hover:scale-[1.02] transition-transform duration-300 select-none animate-pulse"
          title="Click to enter SolarX Admin Portal"
        >
          SolarX
        </h1>
        
        {/* Discrete key/portal entry - slightly visible on hover with a smooth transition */}
        <button 
          onClick={() => navigate("/admin")}
          className="mt-6 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-xs font-mono text-white/20 select-none cursor-pointer tracking-widest hover:text-[#a855f7] hover:border-[#8B00FF]/30 hover:bg-[#8B00FF]/5 transition-all duration-300"
        >
          ACCESS PORTAL
        </button>
      </div>
    </div>
  );
}

// ===================================
// 2. ADMIN LOGIN VIEW (/admin)
// ===================================
function AdminPage({ navigate }: { navigate: (p: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth check first - if already logged in, redirect straight to dashboard
  useEffect(() => {
    apiFetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          navigate("/dashboard");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide all required credentials.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.adminToken) {
          localStorage.setItem("solarx_token", data.adminToken);
        }
        navigate("/dashboard");
      } else {
        setError(data.error || "Credentials authorization rejected.");
      }
    } catch (err) {
      setError("Failed to coordinate auth with server gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 relative">
      <div className="w-full max-w-sm" id="login-container">
        {/* Sub title */}
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#a855f7] font-semibold">
            SolarX — Admin Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-8 shadow-2xl shadow-[#8B00FF]/5 relative overflow-hidden">
          {/* Subtle line accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B00FF] to-[#D000FF]" />

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1.5 font-mono">
                Operator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@solarx.dev"
                  autoComplete="email"
                  className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1.5 font-mono">
                Gateway Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-sm rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-xs font-mono select-none flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#8B00FF] to-[#a855f7] hover:from-[#9d24ff] hover:to-[#b86eff] active:scale-[0.98] disabled:opacity-50 text-white font-medium text-xs uppercase tracking-widest py-3 px-4 rounded-lg transition-all shadow-lg shadow-[#8B00FF]/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Requesting Handshake...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-5">
          <button 
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-[#52525b] hover:text-[#a1a1aa] font-mono transition-colors"
          >
            ← Return to Outer Ring
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================
// 3. SCRIPT MANAGER DASHBOARD VIEW (/dashboard)
// ===================================
function DashboardPage({ navigate }: { navigate: (p: string) => void }) {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [stats, setStats] = useState<{ totalScripts: number; activeChallenges: number; totalExecutions?: number } | null>(null);

  // Form states
  const [scriptName, setScriptName] = useState("");
  const [description, setDescription] = useState("");
  const [luaContent, setLuaContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Last uploaded loadstring output state
  const [generatedLoadstring, setGeneratedLoadstring] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // General list copying status map (slug -> boolean)
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});

  // Verify authorization first
  useEffect(() => {
    const runAuthCheck = async () => {
      try {
        const response = await apiFetch("/api/auth/status");
        const data = await response.json();
        if (!data.authenticated) {
          navigate("/admin");
        } else {
          setAuthChecked(true);
          loadScripts();
        }
      } catch (err) {
        navigate("/admin");
      }
    };
    runAuthCheck();
  }, [navigate]);

  // Read stats
  const loadStats = async () => {
    try {
      const response = await apiFetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Stats fetching failure:", err);
    }
  };

  // Poll stats every 5 seconds
  useEffect(() => {
    if (!authChecked) return;
    loadStats();
    const interval = setInterval(() => {
      loadStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [authChecked]);

  // Read list
  const loadScripts = async () => {
    setLoadingList(true);
    try {
      const response = await apiFetch("/api/scripts");
      if (response.ok) {
        const data = await response.json();
        setScripts(data);
        loadStats();
      }
    } catch (err) {
      console.error("Scripts fetching failure:", err);
    } finally {
      setLoadingList(false);
    }
  };

  // Perform upload
  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setGeneratedLoadstring("");

    if (!luaContent.trim()) {
      setUploadError("Lua script content is required to prepare transmission.");
      return;
    }

    setUploading(true);

    try {
      const response = await apiFetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scriptName,
          description: description,
          content: luaContent
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Formulated script loadstring template
        // Replace with the window-siting origin dynamically so it is ready for copy-pasting
        const baseUrl = window.location.origin;
        const loadstringTemplate = `loadstring(game:HttpGet("${baseUrl}/load/${data.slug}"))()`;
        
        setGeneratedLoadstring(loadstringTemplate);
        
        // Reset state
        setScriptName("");
        setDescription("");
        setLuaContent("");
        
        // Refresh scripts list and stats
        loadScripts();
      } else {
        setUploadError(data.error || "Uploader rejected file properties.");
      }
    } catch (err) {
      setUploadError("Critical failure sending package to host.");
    } finally {
      setUploading(false);
    }
  };

  // Delete script
  const handleDeleteScript = async (slug: string) => {
    if (!window.confirm("Purge script from live databank? Associated clients will lose immediate load routing.")) {
      return;
    }

    try {
      const response = await apiFetch(`/api/scripts/${slug}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setScripts(prev => prev.filter(item => item.slug !== slug));
        loadStats();
        // If they just deleted the one that is showing in copyable, reset copy string
        if (generatedLoadstring.includes(slug)) {
          setGeneratedLoadstring("");
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to purge script.");
      }
    } catch (err) {
      alert("A communication error blocked database deletion.");
    }
  };

  // Copy wrapper to clipboard
  const handleCopyText = (text: string, isResultBox = false, slugKey?: string) => {
    navigator.clipboard.writeText(text);
    
    if (isResultBox) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (slugKey) {
      setCopyStates(prev => ({ ...prev, [slugKey]: true }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [slugKey]: false }));
      }, 2000);
    }
  };

  // Do logout
  const handleLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
      localStorage.removeItem("solarx_token");
      navigate("/admin");
    } catch (err) {
      localStorage.removeItem("solarx_token");
      navigate("/admin");
    }
  };

  if (!authChecked) {
    return (
      <div className="flex-grow flex items-center justify-center font-mono text-xs text-[#a855f7]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-t-transparent border-[#8B00FF] rounded-full animate-spin" />
          <span>Synchronizing security keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 relative">
      {/* Top Header Panel */}
      <div className="flex items-center justify-between border-b border-[#1d1b2a] pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#8B00FF]/15 border border-[#8B00FF]/30 flex items-center justify-center text-[#8B00FF] font-black tracking-tighter text-xl">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-transparent">
              SolarX — Controller Panel
            </h1>
            <p className="text-xs text-[#63636b] font-mono">Secure Lua Databank Manager</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14121d] hover:bg-red-950/20 hover:text-red-400 border border-[#232135] hover:border-red-900/30 rounded-lg text-xs text-[#a1a1aa] font-mono transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Secure Dismissal</span>
        </button>
      </div>

      {/* Statistics Cards Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Total Scripts Card */}
        <div id="stats-total-scripts-card" className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-5 relative overflow-hidden flex items-center justify-between transition-all hover:border-[#8B00FF]/50 shadow-md">
          {/* Accent Line */}
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#8B00FF] to-[#a855f7]" />
          
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-mono block">
              Total Databank Scripts
            </span>
            <span className="text-4xl font-extrabold text-white tracking-tight block">
              {stats !== null ? stats.totalScripts : "—"}
            </span>
          </div>
          
          <div className="p-3 bg-[#8B00FF]/10 border border-[#8B00FF]/25 rounded-xl text-[#a855f7]/90 shrink-0">
            <Terminal className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total Executions Card */}
        <div id="stats-total-executions-card" className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-5 relative overflow-hidden flex items-center justify-between transition-all hover:border-[#10B981]/50 shadow-md">
          {/* Accent Line */}
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#10B981] to-[#34D399]" />
          
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-mono block">
              Total Script Executions
            </span>
            <span className="text-4xl font-extrabold text-white tracking-tight block">
              {stats !== null ? (stats.totalExecutions ?? 0) : "—"}
            </span>
          </div>
          
          <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/25 rounded-xl text-[#34D399]/90 shrink-0">
            <Play className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Active Challenges Pending Card */}
        <div id="stats-active-challenges-card" className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-5 relative overflow-hidden flex items-center justify-between transition-all hover:border-[#D000FF]/50 shadow-md">
          {/* Accent Line */}
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#D000FF] to-[#e879f9]" />
          
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-mono flex items-center gap-2">
              <span>Active Pending Challenges</span>
              <span className="inline-flex w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </span>
            <span className="text-4xl font-extrabold text-white tracking-tight block">
              {stats !== null ? stats.activeChallenges : "—"}
            </span>
          </div>
          
          <div className="p-3 bg-[#D000FF]/10 border border-[#D000FF]/25 rounded-xl text-[#e879f9]/90 shrink-0">
            <Layers className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: UPLOADER FORM (7 grid units) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B00FF] to-[#D000FF]" />
            
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#8B00FF]" />
              <span>Queue New Distribution Payload</span>
            </h2>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1 font-mono">
                  Script Identifier (Optional)
                </label>
                <input
                  type="text"
                  value={scriptName}
                  onChange={(e) => setScriptName(e.target.value)}
                  placeholder="e.g. Universal Aimbot v3.2"
                  className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1 font-mono">
                  Operational Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Insert notes, version updates, or client-restrictions here..."
                  rows={2}
                  className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-red-400 font-medium mb-1 font-mono flex items-center justify-between">
                  <span>Lua Script Payload (Required)</span>
                  <span className="text-[10px] text-[#52525b] font-normal lowercase">Raw loadstring target</span>
                </label>
                <textarea
                  value={luaContent}
                  onChange={(e) => setLuaContent(e.target.value)}
                  placeholder="print('SolarX Active Environment Loaded successfully!')&#10;-- Insert secure script code payload here..."
                  rows={12}
                  required
                  className="w-full bg-[#111016] border border-[#262438] text-green-400 font-mono text-xs rounded-lg p-3.5 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all leading-normal"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-xs font-mono flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-[#8B00FF] hover:bg-[#9d24ff] active:scale-[0.98] disabled:opacity-50 text-white font-medium text-xs uppercase tracking-widest py-3 px-4 rounded-lg transition-all shadow-md shadow-[#8B00FF]/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <span>Deploying Encryption Shield...</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload & Obfuscate Gate Link</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success Box: Displaying copyable results */}
          {generatedLoadstring && (
            <div className="bg-[#100c1d] border border-[#a855f7]/30 rounded-xl p-6 relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 py-1.5 px-3 bg-[#8B00FF]/25 text-[#d8b4fe] text-[10px] uppercase font-mono font-semibold tracking-wider rounded-bl-lg">
                Gate Link Dynamic Output
              </div>

              <h3 className="text-xs uppercase tracking-wider text-[#d8b4fe] font-semibold mb-2 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#8B00FF]" />
                <span>Loader Loadstring Code snippet</span>
              </h3>

              <p className="text-xs text-[#9d9da4] leading-relaxed mb-3">
                Send this secure boot loader wrapper to clients or script forums. Only recognized Roblox executors will pass validation gates and download the core lua payload.
              </p>

              {/* Code Box container */}
              <div className="bg-[#0c0a13] border border-[#2a2240] rounded-lg p-3.5 flex flex-col md:flex-row items-stretch gap-3 justify-between relative">
                <div className="font-mono text-xs text-[#c4b5fd] select-all break-all pr-2 flex items-center">
                  {generatedLoadstring}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(generatedLoadstring, true)}
                  className="shrink-0 bg-[#8B00FF] text-white hover:bg-[#a855f7] active:scale-[0.96] rounded-md px-3.5 py-2 text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-300 animate-bounce" />
                      <span className="text-green-200">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PREVIOUSLY UPLOADED LIST (5 grid units) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D000FF]" />
                <span>Live Script Repositories</span>
              </div>
              <span className="bg-[#1b1928] text-[#a1a1aa] font-mono text-[10px] px-2 py-0.5 rounded-full">
                {scripts.length} Total
              </span>
            </h2>

            {loadingList && scripts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#52525b] text-xs font-mono gap-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-[#D000FF] rounded-full animate-spin" />
                <span>Reading Active Sockets...</span>
              </div>
            ) : scripts.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-[#1e1c2a] rounded-xl flex flex-col items-center justify-center text-[#52525b] text-xs font-mono p-4">
                <Terminal className="w-8 h-8 text-[#262438] mb-2" />
                <span>No active loadlinks deployed.</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {scripts.map((script) => {
                  const scriptUrl = `${window.location.origin}/load/${script.slug}`;
                  const fullLoader = `loadstring(game:HttpGet("${scriptUrl}"))()`;
                  const isCopied = copyStates[script.slug] || false;

                  return (
                    <div 
                      key={script.id} 
                      className="p-4 bg-[#14121d] border border-[#232135] rounded-xl flex flex-col gap-3.5 hover:border-[#383552] transition-all relative group"
                    >
                      <div className="flex items-start justify-between min-w-0">
                        <div className="min-w-0 pr-2">
                          <h4 className="font-semibold text-xs text-white truncate break-words">
                            {script.name}
                          </h4>
                          {script.description && (
                            <p className="text-[11px] text-[#80808b] truncate mt-0.5 max-w-[280px]">
                              {script.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="bg-[#1f1d2e] text-[#b49ebf] text-[10px] font-mono px-1.5 py-0.5 rounded">
                              {script.slug}
                            </span>
                            <span className="bg-[#10B981]/10 text-[#34D399] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#10B981]/20 flex items-center gap-1">
                              <Play className="w-2.5 h-2.5" />
                              <span>{script.executions ?? 0} executions</span>
                            </span>
                            <span className="text-[10px] text-[#52525b] flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-[#3f3e50]" />
                              {new Date(script.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteScript(script.slug)}
                          className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-neutral-800/30 transition-colors cursor-pointer"
                          title="Purge Script"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="border-t border-[#232135] pt-3 flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopyText(fullLoader, false, script.slug)}
                          className="flex-grow bg-[#1d1b2a] hover:bg-[#252336] active:scale-[0.98] border border-[#2b2940] rounded-lg py-1.5 px-3 text-[11px] text-zinc-300 font-mono font-medium flex items-center justify-center gap-1.5 transition-all text-center truncate cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-300 shrink-0" />
                              <span className="text-green-300">Booter Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#8B00FF] shrink-0" />
                              <span className="truncate">Copy Loader</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/load/${script.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-[#1a1826] hover:bg-[#222033] border border-[#2b2940] rounded-lg text-zinc-400 hover:text-white transition-colors"
                          title="Test Loader Gate Link File (Forces HTTP Agent Rules)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
