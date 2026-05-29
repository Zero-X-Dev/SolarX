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
}

interface Challenge {
  id: number;
  slug: string;
  challenge: string;
  created_at: string;
  used: number; // 0 or 1
}

interface Schema {
  admins: Admin[];
  scripts: Script[];
  challenges: Challenge[];
}

// Initial state
let dataStore: Schema = {
  admins: [],
  scripts: [],
  challenges: []
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
    const [name, description, content, slug] = params;
    const script: Script = {
      id: Date.now() + Math.random(),
      name,
      description,
      content,
      slug,
      created_at: new Date().toISOString(),
      executions: 0
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
  if (sqlNormalized.startsWith("SELECT id FROM scripts WHERE slug = ?")) {
    const [slug] = params;
    const script = dataStore.scripts.find(s => s.slug === slug);
    return script ? { id: script.id } as T : undefined;
  }

  // 3. SELECT content FROM scripts WHERE slug = ?
  if (sqlNormalized.startsWith("SELECT content FROM scripts WHERE slug = ?")) {
    const [slug] = params;
    const script = dataStore.scripts.find(s => s.slug === slug);
    return script ? { content: script.content } as T : undefined;
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
  if (sqlNormalized.startsWith("SELECT id, name, description, slug, created_at")) {
    const list = [...dataStore.scripts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        slug: s.slug,
        created_at: s.created_at,
        executions: s.executions || 0
      }));
    return list as T[];
  }

  console.warn("Unmatched JSON dbAll SQL query:", sql);
  return [];
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
  return { totalScripts, activeChallenges, totalExecutions };
}
