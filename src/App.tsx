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
  Play,
  Key,
  Timer,
  Globe,
  Activity
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
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/public/scripts")
      .then((res) => res.json())
      .then((data) => {
        setScripts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Public scripts retrieval failure:", err);
        setLoading(false);
      });
  }, []);

  const handleCopy = (slug: string) => {
    const baseUrl = window.location.origin;
    const loadstring = `loadstring(game:HttpGet("${baseUrl}/load/${slug}"))()`;
    navigator.clipboard.writeText(loadstring);
    setCopiedStates((prev) => ({ ...prev, [slug]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [slug]: false }));
    }, 2000);
  };

  const filtered = scripts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    ((s as any).target_game || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col items-center justify-start relative px-4 py-12 md:py-20">
      {/* Absolute ambient lights */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#8B00FF]/10 to-[#D000FF]/15 blur-3xl pointer-events-none z-0" />

      {/* Access portal corner hook */}
      <div className="w-full max-w-5xl flex justify-end mb-8 relative z-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#8B00FF]/20 bg-[#8B00FF]/5 hover:bg-[#8B00FF]/10 hover:border-[#8B00FF]/40 rounded-lg text-xs font-mono font-medium text-[#c084fc] tracking-wider uppercase transition-all"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Operator login</span>
        </button>
      </div>

      <div className="relative text-center max-w-xl mb-12 z-10">
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-[#8B00FF] via-[#cf59ff] to-[#D000FF] bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(139,0,255,0.2)]">
          SolarX Hub
        </h1>
        <p className="mt-4 text-[#a1a1aa] text-sm md:text-base font-mono">
          Public Databank Cache & Secure Loader Gateway
        </p>
      </div>

      {/* Interactive catalog layout */}
      <div className="w-full max-w-5xl relative z-10">
        {/* Search header bar */}
        <div className="bg-[#0f0e15]/90 border border-[#211f30] rounded-xl p-4.5 mb-8 flex items-center shadow-lg backdrop-blur-md">
          <Search className="w-4.5 h-4.5 text-[#8b00ff] shrink-0 mr-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deployed distribution nodes by name or targeted game..."
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#f3f4f6] text-xs md:text-sm placeholder-[#52525b]"
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center font-mono text-xs text-[#a855f7] gap-3">
            <div className="w-6 h-6 border-2 border-t-transparent border-[#8b00ff] rounded-full animate-spin" />
            <span>Connecting to live databank sockets...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-[#1f1d2d] rounded-2xl flex flex-col items-center justify-center text-[#52525b] text-sm font-mono text-center p-6 bg-[#0c0b11]/50">
            <Terminal className="w-10 h-10 text-[#211f32] mb-3" />
            <span>Zero matching Lua arrays or keyless structures found.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((script) => {
              const isCopied = copiedStates[script.slug] || false;
              const targetGameStr = (script as any).target_game || "Generic Roblox";
              const isKeyless = (script as any).requires_key === 0;

              return (
                <div
                  key={script.id}
                  className="bg-[#0f0e15] border border-[#211f30] hover:border-[#8b00ff]/30 hover:shadow-lg hover:shadow-[#8b00ff]/2 transition-all duration-300 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Keyless top bar glow indicator */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] ${
                      isKeyless
                        ? "bg-gradient-to-r from-[#10b981] to-[#34d399]"
                        : "bg-gradient-to-r from-[#8B00FF] to-[#D000FF]"
                    }`}
                  />

                  <div>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="font-bold text-sm text-white text-left line-clamp-2">
                        {script.name}
                      </h3>
                    </div>

                    <p className="text-xs text-[#8e8e95] text-left line-clamp-3 leading-relaxed mb-4 min-h-[48px]">
                      {script.description || "No public operational notes registered for this payload."}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mb-5">
                      <span className="bg-[#171424] text-[#cf9eff] text-[10px] font-mono px-2 py-0.5 rounded border border-[#8b00ff]/10">
                        {targetGameStr}
                      </span>
                      {isKeyless ? (
                        <span className="bg-emerald-950/20 text-[#34d399] text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/10">
                          🔓 Keyless
                        </span>
                      ) : (
                        <span className="bg-purple-950/20 text-[#c084fc] text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/10">
                          🔑 Key Gateway
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#211f30] pt-4">
                    <button
                      onClick={() => handleCopy(script.slug)}
                      className="w-full bg-[#1b1929] hover:bg-[#8b00ff] hover:text-white border border-[#2b293e] hover:border-[#8b00ff] text-[#e3e3e3] font-mono font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-300" />
                          <span className="text-green-300">Loader Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#cf9eff]" />
                          <span>Copy Loader snippet</span>
                        </>
                      )}
                    </button>

                    {!isKeyless && (
                      <a
                        href={`/getkey/${script.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center text-[10px] font-mono text-[#71717a] hover:text-[#d8b4fe] transition-colors"
                      >
                        Acquire Gateway bypass passkey manually →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
  const [targetGame, setTargetGame] = useState("Generic Roblox");
  const [requiresKey, setRequiresKey] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Premium key lists logic state
  const [premiumKeysList, setPremiumKeysList] = useState<string[]>([]);
  const [premiumCreateSuccess, setPremiumCreateSuccess] = useState("");
  const [generatingPremium, setGeneratingPremium] = useState(false);

  // Separate tab layout state: "scripts" or "keysystem"
  const [adminActiveTab, setAdminActiveTab] = useState<"scripts" | "keysystem">("scripts");

  // Last uploaded loadstring output state
  const [generatedLoadstring, setGeneratedLoadstring] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // General list copying status map (slug -> boolean)
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});

  // Key system controller states
  const [keySystemEnabled, setKeySystemEnabled] = useState(false);
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [keyExpiryHours, setKeyExpiryHours] = useState(24);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const loadPremiumKeys = async () => {
    try {
      const response = await apiFetch("/api/key-system/premium-keys");
      if (response.ok) {
        const data = await response.json();
        setPremiumKeysList(data || []);
      }
    } catch (err) {
      console.error("Premium keys loading error:", err);
    }
  };

  const handleGeneratePremiumKey = async () => {
    setGeneratingPremium(true);
    setPremiumCreateSuccess("");
    try {
      const response = await apiFetch("/api/key-system/premium-keys", {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setPremiumKeysList(prev => [data.key, ...prev]);
        setPremiumCreateSuccess(`Successfully engineered direct bypass: ${data.key}`);
        setTimeout(() => setPremiumCreateSuccess(""), 4000);
        loadStats();
      } else {
        alert("Failed to generate premium license key.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPremium(false);
    }
  };

  const handleRevokePremiumKey = async (key: string) => {
    if (!window.confirm(`Revoke this premium gate key? This will immediately lock and sever access for active user lease ${key}.`)) {
      return;
    }
    try {
      const response = await apiFetch(`/api/key-system/premium-keys/${encodeURIComponent(key)}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setPremiumKeysList(prev => prev.filter(k => k !== key));
        loadStats();
      } else {
        alert("Failed to revoke premium license key.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await apiFetch("/api/key-system/settings");
      if (response.ok) {
        const data = await response.json();
        setKeySystemEnabled(data.keySystemEnabled);
        setAdLinkUrl(data.adLinkUrl || "");
        setKeyExpiryHours(data.keyExpiryHours || 24);
      }
    } catch (err) {
      console.error("Configuration system load error:", err);
    }
  };

  const handleSettingsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess("");
    try {
      const response = await apiFetch("/api/key-system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keySystemEnabled,
          adLinkUrl,
          keyExpiryHours: Number(keyExpiryHours)
        })
      });
      if (response.ok) {
        setSettingsSuccess("Security configurations updated successfully!");
        setTimeout(() => setSettingsSuccess(""), 3000);
        loadStats(); // Reload stats as key counts could have changed
      } else {
        alert("Action failure from key gateway server.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

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
          loadSettings();
          loadPremiumKeys();
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
          content: luaContent,
          target_game: targetGame,
          requires_key: requiresKey ? 1 : 0
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
        setTargetGame("Generic Roblox");
        setRequiresKey(true);
        
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
         {/* Total Scripts Card */}
         <div id="stats-total-scripts-card" className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-5 relative overflow-hidden flex items-center justify-between transition-all hover:border-[#8B00FF]/50 shadow-md">
           {/* Accent Line */}
           <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#8B00FF] to-[#a855f7]" />
           
           <div className="space-y-1">
             <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-mono block">
               Total Scripts
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
               Total Executions
             </span>
             <span className="text-4xl font-extrabold text-white tracking-tight block">
               {stats !== null ? ((stats as any).totalExecutions ?? 0) : "—"}
             </span>
           </div>
           
           <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/25 rounded-xl text-[#34D399]/90 shrink-0">
             <Play className="w-5.5 h-5.5" />
           </div>
         </div>

         {/* Total Registered Active Keys Card */}
         <div id="stats-registered-keys-card" className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-5 relative overflow-hidden flex items-center justify-between transition-all hover:border-[#3B82F6]/50 shadow-md">
           {/* Accent Line */}
           <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#3B82F6] to-[#60A5FA]" />
           
           <div className="space-y-1">
             <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-mono block">
               Active Generated Keys
             </span>
             <span className="text-4xl font-extrabold text-white tracking-tight block">
               {stats !== null ? ((stats as any).totalKeys ?? 0) : "—"}
             </span>
           </div>
           
           <div className="p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-xl text-[#60A5FA]/90 shrink-0">
             <Key className="w-5.5 h-5.5" />
           </div>
         </div>

         {/* Temporary Active Bans Card */}
         <div id="stats-active-bans-card" className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-5 relative overflow-hidden flex items-center justify-between transition-all hover:border-[#EF4444]/50 shadow-md">
           {/* Accent Line */}
           <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-[#EF4444] to-[#F87171]" />
           
           <div className="space-y-1">
             <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-mono block">
               Active AdBlock Bans
             </span>
             <span className="text-4xl font-extrabold text-white tracking-tight block font-mono text-red-400">
               {stats !== null ? ((stats as any).activeBans ?? 0) : "—"}
             </span>
           </div>
           
           <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl text-[#F87171]/90 shrink-0">
             <AlertTriangle className="w-5.5 h-5.5" />
           </div>
         </div>
       </div>

      {/* TABS SELECTION BAR */}
      <div className="flex border-b border-[#1c1a27] mb-8 gap-2 p-1 bg-[#09080e] rounded-xl max-w-sm">
        <button
          onClick={() => setAdminActiveTab("scripts")}
          className={`flex-1 text-center py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all ${
            adminActiveTab === "scripts"
              ? "bg-[#8B00FF] text-white shadow-md shadow-[#8B00FF]/15"
              : "text-[#8e8e9c] hover:text-white"
          }`}
        >
          📂 Scripts List
        </button>
        <button
          onClick={() => setAdminActiveTab("keysystem")}
          className={`flex-1 text-center py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all relative ${
            adminActiveTab === "keysystem"
              ? "bg-[#8B00FF] text-white shadow-md shadow-[#8B00FF]/15"
              : "text-[#8e8e9c] hover:text-white"
          }`}
        >
          ⚙️ Key Gateway
          {premiumKeysList.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#a855f7] text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {premiumKeysList.length}
            </span>
          )}
        </button>
      </div>

      {adminActiveTab === "scripts" ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1 font-mono font-mono">
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
                  <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1 font-mono font-mono">
                    Target Roblox Game
                  </label>
                  <input
                    type="text"
                    value={targetGame}
                    onChange={(e) => setTargetGame(e.target.value)}
                    placeholder="e.g. Phantom Forces"
                    className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium mb-1 font-mono font-mono flex items-center justify-between">
                  <span>Operational Description (Optional)</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#a855f7]">
                    <input
                      type="checkbox"
                      checked={requiresKey}
                      onChange={(e) => setRequiresKey(e.target.checked)}
                      className="accent-[#8b00ff]"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{requiresKey ? "🔑 Tasks Gate Enforced" : "🔓 Bypass (Keyless)"}</span>
                  </label>
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

          {/* SECURE KEY GATEWAY CONTROL CENTER */}
          <div className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B00FF] to-[#D000FF]" />

            <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#8B00FF]" />
              <span>Gate Key System Configuration</span>
            </h2>

            <form onSubmit={handleSettingsSubmit} className="space-y-5">
              {/* Toggle switch */}
              <div className="flex items-center justify-between p-3.5 bg-[#15131f] border border-[#262438] rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block uppercase tracking-wider font-mono">
                    Enforce Key System Verification
                  </span>
                  <span className="text-[10px] text-[#63636b] block font-medium leading-normal">
                    Requires all execution boots to complete the active Ad Gateway task.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setKeySystemEnabled(!keySystemEnabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    keySystemEnabled ? "bg-[#8b00ff]" : "bg-zinc-850"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      keySystemEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Ad Link target input */}
              <div className="space-y-1">
                <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium font-mono">
                  CUSTOM PUBLISHER AD LINK (LINKVERTISE)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-650">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="url"
                    value={adLinkUrl}
                    onChange={(e) => setAdLinkUrl(e.target.value)}
                    placeholder="e.g. https://linkvertise.com/12345/my-key?url=https://mysolarx.com/key/claim?slug={{slug}}&session={{session}}"
                    className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-xs rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                  />
                </div>
                <p className="text-[10px] text-[#52525b] leading-normal font-medium italic mt-1 font-mono">
                  Include macros <span className="text-[#a855f7] font-semibold">{"{{slug}}"}</span> and <span className="text-[#a855f7] font-semibold">{"{{session}}"}</span> to automatically handle the secure claimant redirection callback. Keep blank to use standard timers!
                </p>
              </div>

              {/* Key expiry parameter */}
              <div className="space-y-1">
                <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium font-mono">
                  AUTHORIZED KEY EXPIRATION LEASE (HOURS)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-650">
                    <Timer className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={keyExpiryHours}
                    onChange={(e) => setKeyExpiryHours(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] text-xs rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                  />
                </div>
                <p className="text-[10px] text-[#52525b]">
                  Keys assigned successfully will automatically revoke from active state cache after this duration.
                </p>
              </div>

              {settingsSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-900/30 rounded-lg text-green-400 text-xs font-mono">
                  {settingsSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-[#14121d] hover:bg-[#1d1a2a] disabled:opacity-50 border border-[#232135] text-[#8B00FF] font-semibold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingSettings ? (
                  <span>Saving Cryptographic Directives...</span>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Apply Gate Rules</span>
                  </>
                )}
              </button>
            </form>
          </div>
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="bg-[#1f1d2e] text-[#b49ebf] text-[10px] font-mono px-1.5 py-0.5 rounded">
                              {script.slug}
                            </span>
                            <span className="bg-[#1a142e] text-[#cf9eff] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#8b00ff]/10">
                              {(script as any).target_game || "Generic Roblox"}
                            </span>
                            {(script as any).requires_key === 0 ? (
                              <span className="bg-emerald-950/20 text-[#34d399] text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/15">
                                🔓 Keyless
                              </span>
                            ) : (
                              <span className="bg-purple-950/20 text-[#c084fc] text-[10px] font-mono px-1.5 py-0.5 rounded border border-purple-500/15">
                                🔑 Key Gateway
                              </span>
                            )}
                            <span className="bg-[#10B981]/10 text-[#34D399] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#10B981]/10 flex items-center gap-1">
                              <Play className="w-2.5 h-2.5" />
                              <span>{(script as any).executions ?? 0} runs</span>
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
      ) : (
        /* TAB 2: KEY SYSTEM & PREMIUM MANAGEMENT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: SETTINGS */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B00FF] to-[#D000FF]" />

              <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#8B00FF]" />
                <span>Gate Key System Configuration</span>
              </h2>

              <form onSubmit={handleSettingsSubmit} className="space-y-5">
                <div className="flex items-center justify-between p-3.5 bg-[#15131f] border border-[#262438] rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block uppercase tracking-wider font-mono">
                      Enforce Key System Verification
                    </span>
                    <span className="text-[10px] text-[#63636b] block font-medium leading-normal">
                      Requires all execution boots to complete the active Ad Gateway task.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setKeySystemEnabled(!keySystemEnabled)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      keySystemEnabled ? "bg-[#8b00ff]" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        keySystemEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium font-mono">
                    CUSTOM PUBLISHER AD LINK (LINKVERTISE)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-650">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="url"
                      value={adLinkUrl}
                      onChange={(e) => setAdLinkUrl(e.target.value)}
                      placeholder="e.g. https://linkvertise.com/12300/example"
                      className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] placeholder-[#52525b] text-xs rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                    />
                  </div>
                  <p className="text-[10.5px] text-[#52525b] leading-normal font-medium italic mt-1 font-mono">
                    Include macros <span className="text-[#a855f7] font-semibold">{"{{slug}}"}</span> and <span className="text-[#a855f7] font-semibold">{"{{session}}"}</span> to automatically track callbacks securely.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] font-medium font-mono">
                    AUTHORIZED KEY EXPIRATION LEASE (HOURS)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-655 font-mono">
                      <Timer className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={keyExpiryHours}
                      onChange={(e) => setKeyExpiryHours(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-[#15141d] border border-[#262438] text-[#eeeeee] text-xs rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[#8B00FF] focus:border-[#8B00FF] transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-[#52525b]">
                    Keys assigned successfully will automatically expire from cache after this session length.
                  </p>
                </div>

                {settingsSuccess && (
                  <div className="p-3 bg-green-950/20 border border-green-905/30 rounded-lg text-green-400 text-xs font-mono">
                    {settingsSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-[#14121d] hover:bg-[#1d1a2a] disabled:opacity-50 border border-[#232135] text-[#8B00FF] font-semibold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingSettings ? (
                    <span>Saving Cryptographic Directives...</span>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5" />
                      <span>Apply Gate Rules</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: PREMIUM KEY BYPASS LIST */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#0f0e15] border border-[#211f30] rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#8B00FF]" />
                <span>Premium Direct Bypass License Keys</span>
              </h2>
              <p className="text-xs text-[#a1a1aa] mb-4 leading-relaxed">
                Generate elite premium authorization tokens. Handing these license tokens to users allows them to verify instantly on the checkpoint landing page—completely bypassing any ad link tasks.
              </p>

              <button
                type="button"
                onClick={handleGeneratePremiumKey}
                disabled={generatingPremium}
                className="w-full bg-gradient-to-r from-[#8B00FF] to-[#cf59ff] text-white font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mb-5"
              >
                {generatingPremium ? (
                  <span>ENGINEERING DIGITAL LICENSE...</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate New Premium Bypass Key</span>
                  </>
                )}
              </button>

              {premiumCreateSuccess && (
                <div className="p-1 px-3.5 bg-green-950/25 border border-green-500/35 rounded-lg text-emerald-400 text-xs font-mono mb-4 select-all">
                  {premiumCreateSuccess}
                </div>
              )}

              <h3 className="text-xs uppercase tracking-wider text-white/80 mb-2 font-mono">Active Premium Keys ({premiumKeysList.length})</h3>
              {premiumKeysList.length === 0 ? (
                <div className="py-8 border border-dashed border-[#1f1d2d] rounded-xl text-center text-[#52525b] text-xs font-mono p-4">
                  No custom premium gate bypasses registered.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {premiumKeysList.map((key) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-[#13121b] border border-[#212032] hover:border-zinc-700 rounded-lg group">
                      <span className="font-mono text-xs text-amber-300 select-all">{key}</span>
                      <button
                        type="button"
                        onClick={() => handleRevokePremiumKey(key)}
                        className="text-[#9ea3b2] hover:text-red-400 p-1 rounded-md transition-colors"
                        title="Revoke License Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
