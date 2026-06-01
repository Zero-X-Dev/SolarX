import path from "path";
import bcrypt from "bcryptjs";
import fs from "fs";

// Resolve JSON DB file path
const dbPathSetting = process.env.DATABASE_PATH || "./solarx_db.json";
const dbPath = path.isAbsolute(dbPathSetting) 
  ? dbPathSetting 
  : path.join(process.cwd(), dbPathSetting.endsWith(".db") ? dbPathSetting.replace(".db", ".json") : dbPathSetting);

interface Admin {
  id: number;
  email: string;
  password_hash: string;
}

interface Script {
  id: number;
  name: string;
  description: string;
  content: string;
  slug: string;
  created_at: string;
  executions?: number;
  target_game?: string;
  requires_key?: number; // 0 or 1
}

interface Challenge {
  id: number;
  slug: string;
  challenge: string;
  created_at: string;
  used: number; // 0 or 1
}

interface Setting {
  keySystemEnabled: boolean;
  adLinkUrl: string;
  keyExpiryHours: number;
}

interface KeyVal {
  key: string;
  ip: string;
  slug: string;
  created_at: string;
  expires_at: string;
}

interface Ban {
  ip: string;
  expires_at: string;
}

interface Schema {
  admins: Admin[];
  scripts: Script[];
  challenges: Challenge[];
  settings?: Setting;
  keys?: KeyVal[];
  bans?: Ban[];
  premiumKeys?: string[];
}

// Initial state
let dataStore: Schema = {
  admins: [],
  scripts: [],
  challenges: [],
  settings: {
    keySystemEnabled: false,
    adLinkUrl: "",
    keyExpiryHours: 24
  },
  keys: [],
  bans: [],
  premiumKeys: []
};

// Ensure directory exists & read file
function loadDatabaseSync() {
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, "utf-8");
      dataStore = JSON.parse(fileData);
      if (!dataStore.admins) dataStore.admins = [];
      if (!dataStore.scripts) dataStore.scripts = [];
      if (!dataStore.challenges) dataStore.challenges = [];
      if (!dataStore.settings) {
        dataStore.settings = {
          keySystemEnabled: false,
          adLinkUrl: "",
          keyExpiryHours: 24
        };
      }
      if (!dataStore.keys) dataStore.keys = [];
      if (!dataStore.bans) dataStore.bans = [];
      if (!dataStore.premiumKeys) dataStore.premiumKeys = [];
    } else {
      saveDatabaseSync();
    }
  } catch (err) {
    console.error("Failed to load JSON database:", err);
  }
}

function saveDatabaseSync() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dataStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save JSON database:", err);
  }
}

// Initialize on load
loadDatabaseSync();

export async function initDatabase() {
  console.log("Initializing pure-JS database system...");

  const defaultHash = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("admin123", 10);
  const emailsToSeed = [
    "admin@solarx.dev",
    "harshmeena072012@gmail.com",
    "renukumari23.1986@gmail.com"
  ];

  // Also include ADMIN_EMAIL env if set
  if (process.env.ADMIN_EMAIL) {
    emailsToSeed.push(process.env.ADMIN_EMAIL);
  }

  const lowercaseEmails = [...new Set(emailsToSeed.map(e => e.toLowerCase().trim()))];

  for (const email of lowercaseEmails) {
    const existingIndex = dataStore.admins.findIndex(a => a.email.toLowerCase() === email);
    if (existingIndex === -1) {
      console.log(`Seeding initial admin account: ${email}`);
      dataStore.admins.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        email: email,
        password_hash: defaultHash
      });
    } else {
      console.log(`Resetting admin password hash to match baseline for: ${email}`);
      dataStore.admins[existingIndex].password_hash = defaultHash;
    }
  }

  saveDatabaseSync();
  console.log("Seeded and verified admin accounts list:", dataStore.admins.map(a => a.email));
}

// Emulate SQLite callbacks using promises for query actions
export async function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  loadDatabaseSync();
  const sqlNormalized = sql.trim().replace(/\s+/g, " ");

  // 1. CREATE TABLE (No-op)
  if (sqlNormalized.startsWith("CREATE TABLE")) {
    return { lastID: 0, changes: 0 };
  }

  // 2. INSERT INTO admins
  if (sqlNormalized.startsWith("INSERT INTO admins")) {
    const [email, password_hash] = params;
    const admin: Admin = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      email,
      password_hash
    };
    dataStore.admins.push(admin);
    saveDatabaseSync();
    return { lastID: admin.id, changes: 1 };
  }

  // 3. UPDATE admins
  if (sqlNormalized.startsWith("UPDATE admins SET password_hash = ? WHERE email = ?")) {
    const [password_hash, email] = params;
    const admin = dataStore.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (admin) {
      admin.password_hash = password_hash;
      saveDatabaseSync();
      return { lastID: admin.id, changes: 1 };
    }
    return { lastID: 0, changes: 0 };
  }

  // 4. INSERT INTO scripts
  if (sqlNormalized.startsWith("INSERT INTO scripts")) {
    const [name, description, content, slug, target_game, requires_key] = params;
    const script: Script = {
      id: Date.now() + Math.random(),
      name,
      description,
      content,
      slug,
      created_at: new Date().toISOString(),
      executions: 0,
      target_game: target_game || "Generic Roblox",
      requires_key: requires_key !== undefined ? Number(requires_key) : 1
    };
    dataStore.scripts.push(script);
    saveDatabaseSync();
    return { lastID: script.id, changes: 1 };
  }

  // 5. INSERT INTO challenges
  if (sqlNormalized.startsWith("INSERT INTO challenges")) {
    const [slug, challenge] = params;
    const challengeObj: Challenge = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      slug,
      challenge,
      created_at: new Date().toISOString(),
      used: 0
    };
    dataStore.challenges.push(challengeObj);
    saveDatabaseSync();
    return { lastID: challengeObj.id, changes: 1 };
  }

  // 6. UPDATE challenges SET used = 1
  if (sqlNormalized.startsWith("UPDATE challenges SET used = 1")) {
    const [id] = params;
    const chall = dataStore.challenges.find(c => c.id === id);
    if (chall) {
      chall.used = 1;
      saveDatabaseSync();
      return { lastID: id, changes: 1 };
    }
    return { lastID: 0, changes: 0 };
  }

  // 7. DELETE FROM challenges WHERE slug = ?
  if (sqlNormalized.startsWith("DELETE FROM challenges WHERE slug = ?")) {
    const [slug] = params;
    const lenBefore = dataStore.challenges.length;
    dataStore.challenges = dataStore.challenges.filter(c => c.slug !== slug);
    saveDatabaseSync();
    return { lastID: 0, changes: lenBefore - dataStore.challenges.length };
  }

  // 8. DELETE FROM scripts WHERE slug = ?
  if (sqlNormalized.startsWith("DELETE FROM scripts WHERE slug = ?")) {
    const [slug] = params;
    const lenBefore = dataStore.scripts.length;
    dataStore.scripts = dataStore.scripts.filter(s => s.slug !== slug);
    saveDatabaseSync();
    return { lastID: 0, changes: lenBefore - dataStore.scripts.length };
  }

  // 9. DELETE FROM challenges WHERE used = 0 AND datetime(created_at) < datetime(?)
  if (sqlNormalized.startsWith("DELETE FROM challenges WHERE used = 0")) {
    const [cutoffSql] = params; // SQLite format: 'YYYY-MM-DD HH:MM:SS'
    const cutoffTime = new Date(cutoffSql.replace(" ", "T") + ".000Z").getTime();
    
    const lenBefore = dataStore.challenges.length;
    dataStore.challenges = dataStore.challenges.filter(c => {
      if (c.used === 1) return true; // Keep used ones
      const createdAtTime = new Date(c.created_at).getTime();
      return createdAtTime >= cutoffTime; // Keep if newer than cutoff
    });
    saveDatabaseSync();
    return { lastID: 0, changes: lenBefore - dataStore.challenges.length };
  }

  // 10. UPDATE scripts SET executions = executions + 1 WHERE slug = ?
  if (sqlNormalized.startsWith("UPDATE scripts SET executions")) {
    const [slug] = params;
    const script = dataStore.scripts.find(s => s.slug === slug);
    if (script) {
      script.executions = (script.executions || 0) + 1;
      saveDatabaseSync();
      return { lastID: 0, changes: 1 };
    }
    return { lastID: 0, changes: 0 };
  }

  console.warn("Unmatched JSON dbRun SQL query:", sql);
  return { lastID: 0, changes: 0 };
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  loadDatabaseSync();
  const sqlNormalized = sql.trim().replace(/\s+/g, " ");

  // 1. SELECT * FROM admins
  if (sqlNormalized.startsWith("SELECT * FROM admins WHERE email = ?")) {
    const [email] = params;
    const admin = dataStore.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    return admin as T | undefined;
  }

  // 2. SELECT id FROM scripts WHERE slug = ?
  if (sqlNormalized.startsWith("SELECT id FROM scripts WHERE slug = ?") || sqlNormalized.startsWith("SELECT id, requires_key FROM scripts WHERE slug = ?")) {
    const [slug] = params;
    const script = dataStore.scripts.find(s => s.slug === slug);
    return script ? { id: script.id, requires_key: script.requires_key !== undefined ? script.requires_key : 1 } as T : undefined;
  }

  // 2b. SELECT metadata OR complete scripts fields WHERE slug = ?
  if (sqlNormalized.startsWith("SELECT name, description") || sqlNormalized.startsWith("SELECT id, name, description") || sqlNormalized.startsWith("SELECT * FROM scripts WHERE slug = ?")) {
    const [slug] = params;
    const script = dataStore.scripts.find(s => s.slug === slug);
    return script ? { 
      id: script?.id,
      name: script?.name, 
      description: script?.description, 
      content: script?.content,
      slug: script?.slug,
      target_game: script?.target_game || "Generic Roblox",
      requires_key: script?.requires_key !== undefined ? script.requires_key : 1
    } as T : undefined;
  }

  // 3. SELECT content FROM scripts WHERE slug = ?
  if (sqlNormalized.startsWith("SELECT content FROM scripts WHERE slug = ?") || sqlNormalized.startsWith("SELECT content, requires_key FROM scripts WHERE slug = ?")) {
    const [slug] = params;
    const script = dataStore.scripts.find(s => s.slug === slug);
    return script ? { content: script.content, requires_key: script.requires_key !== undefined ? script.requires_key : 1 } as T : undefined;
  }

  // 4. SELECT * FROM challenges
  if (sqlNormalized.startsWith("SELECT * FROM challenges WHERE slug = ? AND challenge = ? AND used = 0")) {
    const [slug, challenge] = params;
    const chall = dataStore.challenges.find(c => c.slug === slug && c.challenge === challenge && c.used === 0);
    return chall as T | undefined;
  }

  console.warn("Unmatched JSON dbGet SQL query:", sql);
  return undefined;
}

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  loadDatabaseSync();
  const sqlNormalized = sql.trim().replace(/\s+/g, " ");

  // 1. SELECT all scripts
  if (sqlNormalized.startsWith("SELECT id, name, description, slug, created_at") || sqlNormalized.startsWith("SELECT * FROM scripts") || sqlNormalized.startsWith("SELECT id, name, description, slug, created_at, executions")) {
    const list = [...dataStore.scripts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        slug: s.slug,
        created_at: s.created_at,
        executions: s.executions || 0,
        target_game: s.target_game || "Generic Roblox",
        requires_key: s.requires_key !== undefined ? s.requires_key : 1
      }));
    return list as T[];
  }

  console.warn("Unmatched JSON dbAll SQL query:", sql);
  return [];
}

export function getSettingsSync() {
  loadDatabaseSync();
  return dataStore.settings || { keySystemEnabled: false, adLinkUrl: "", keyExpiryHours: 24 };
}

export function saveSettingsSync(settings: { keySystemEnabled: boolean; adLinkUrl: string; keyExpiryHours: number }) {
  loadDatabaseSync();
  dataStore.settings = settings;
  saveDatabaseSync();
}

export function addKeySync(key: string, ip: string, slug: string, durationHours: number) {
  loadDatabaseSync();
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
  // Remove existing key for same IP/slug if any exists
  dataStore.keys = (dataStore.keys || []).filter(k => !(k.ip === ip && k.slug === slug));
  dataStore.keys.push({
    key,
    ip,
    slug,
    created_at: new Date().toISOString(),
    expires_at: expiresAt
  });
  saveDatabaseSync();
}

export function validateKeySync(key: string, ip: string, slug: string): boolean {
  loadDatabaseSync();

  // If the key is in our premium master keys list, validate instantly!
  const premKeys = dataStore.premiumKeys || [];
  if (premKeys.includes(key)) {
    return true;
  }

  const keys = dataStore.keys || [];
  const found = keys.find(k => k.key === key && k.slug === slug && (k.ip === ip || !ip));
  if (!found) return false;
  if (new Date(found.expires_at).getTime() < Date.now()) {
    // expired
    dataStore.keys = keys.filter(k => k.key !== key);
    saveDatabaseSync();
    return false;
  }
  return true;
}

export function checkIpKeySync(ip: string, slug: string): string | null {
  loadDatabaseSync();
  const keys = dataStore.keys || [];
  const found = keys.find(k => k.slug === slug && k.ip === ip);
  if (!found) return null;
  if (new Date(found.expires_at).getTime() < Date.now()) {
    dataStore.keys = keys.filter(k => k !== found);
    saveDatabaseSync();
    return null;
  }
  return found.key;
}

export function addBanSync(ip: string, durationMinutes: number) {
  loadDatabaseSync();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  dataStore.bans = (dataStore.bans || []).filter(b => b.ip !== ip);
  dataStore.bans.push({
    ip,
    expires_at: expiresAt
  });
  saveDatabaseSync();
}

export function isBannedSync(ip: string): boolean {
  loadDatabaseSync();
  const bans = dataStore.bans || [];
  const found = bans.find(b => b.ip === ip);
  if (!found) return false;
  if (new Date(found.expires_at).getTime() < Date.now()) {
    // expired
    dataStore.bans = bans.filter(b => b.ip !== ip);
    saveDatabaseSync();
    return false;
  }
  return true;
}

export function getRemainingBanSeconds(ip: string): number {
  loadDatabaseSync();
  const bans = dataStore.bans || [];
  const found = bans.find(b => b.ip === ip);
  if (!found) return 0;
  const remainingMs = new Date(found.expires_at).getTime() - Date.now();
  if (remainingMs <= 0) {
    dataStore.bans = bans.filter(b => b.ip !== ip);
    saveDatabaseSync();
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
}

export function getStats() {
  loadDatabaseSync();
  const totalScripts = dataStore.scripts.length;
  const now = Date.now();
  const activeChallenges = dataStore.challenges.filter(c => {
    if (c.used === 1) return false;
    const createdAtTime = new Date(c.created_at).getTime();
    return (now - createdAtTime) <= 30000;
  }).length;
  const totalExecutions = dataStore.scripts.reduce((acc, s) => acc + (s.executions || 0), 0);
  const totalKeys = (dataStore.keys || []).length;
  const activeBans = (dataStore.bans || []).filter(b => new Date(b.expires_at).getTime() > now).length;
  const totalPremiumKeys = (dataStore.premiumKeys || []).length;
  return { totalScripts, activeChallenges, totalExecutions, totalKeys, activeBans, totalPremiumKeys };
}

export function getPremiumKeysSync(): string[] {
  loadDatabaseSync();
  return dataStore.premiumKeys || [];
}

export function addPremiumKeySync(key: string) {
  loadDatabaseSync();
  if (!dataStore.premiumKeys) dataStore.premiumKeys = [];
  if (!dataStore.premiumKeys.includes(key)) {
    dataStore.premiumKeys.push(key);
    saveDatabaseSync();
  }
}

export function deletePremiumKeySync(key: string) {
  loadDatabaseSync();
  if (!dataStore.premiumKeys) dataStore.premiumKeys = [];
  dataStore.premiumKeys = dataStore.premiumKeys.filter(k => k !== key);
  saveDatabaseSync();
}

export function isPremiumKeySync(key: string): boolean {
  loadDatabaseSync();
  return (dataStore.premiumKeys || []).includes(key);
}
