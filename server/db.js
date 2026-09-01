const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.ilaozbmvkktwvdzkvvoj:b%2A%23ThKXfqG8VtrD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false } // Required by Supabase
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT,
        position TEXT,
        pic TEXT,
        status TEXT,
        "teamId" TEXT,
        "soldPrice" INTEGER,
        "studentId" TEXT
      );
      
      -- Add column if it doesn't exist (for existing databases)
      ALTER TABLE players ADD COLUMN IF NOT EXISTS "studentId" TEXT;
      
      CREATE TABLE IF NOT EXISTS managers (
        id TEXT PRIMARY KEY,
        name TEXT,
        budget INTEGER,
        username TEXT,
        password TEXT,
        "teamName" TEXT
      );
      
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS "teamName" TEXT;

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        data JSONB
      );
    `);
    console.log("Supabase Postgres DB initialized");
  } finally {
    client.release();
  }
}

async function loadState(defaultSettings) {
  const client = await pool.connect();
  try {
    const playersRes = await client.query('SELECT * FROM players');
    const managersRes = await client.query('SELECT * FROM managers');
    const settingsRes = await client.query('SELECT data FROM settings WHERE id = 1');
    
    return {
      players: playersRes.rows,
      managers: managersRes.rows,
      settings: settingsRes.rows.length > 0 ? settingsRes.rows[0].data : defaultSettings
    };
  } finally {
    client.release();
  }
}

async function savePlayer(player) {
  await pool.query(`
    INSERT INTO players (id, name, position, pic, status, "teamId", "soldPrice", "studentId")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      position = EXCLUDED.position,
      pic = EXCLUDED.pic,
      status = EXCLUDED.status,
      "teamId" = EXCLUDED."teamId",
      "soldPrice" = EXCLUDED."soldPrice",
      "studentId" = EXCLUDED."studentId"
  `, [player.id, player.name, player.position, player.pic, player.status, player.teamId, player.soldPrice, player.studentId]);
}

async function deletePlayerDB(id) {
  await pool.query('DELETE FROM players WHERE id = $1', [id]);
}

async function saveManager(manager) {
  await pool.query(`
    INSERT INTO managers (id, name, budget, username, password, "teamName")
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      budget = EXCLUDED.budget,
      username = EXCLUDED.username,
      password = EXCLUDED.password,
      "teamName" = EXCLUDED."teamName"
  `, [manager.id, manager.name, manager.budget, manager.username, manager.password, manager.teamName]);
}

async function saveSettings(settings) {
  await pool.query(`
    INSERT INTO settings (id, data) VALUES (1, $1)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `, [settings]);
}

async function clearSystem() {
   await pool.query('DELETE FROM players');
   await pool.query('DELETE FROM managers');
}

module.exports = {
  initDB, loadState, savePlayer, deletePlayerDB, saveManager, saveSettings, clearSystem
};
