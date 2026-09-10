const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.ilaozbmvkktwvdzkvvoj:b%2A%23ThKXfqG8VtrD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
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
        "teamName" TEXT,
        "teamLogo" TEXT
      );
      
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS username TEXT;
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS "teamName" TEXT;
      ALTER TABLE managers ADD COLUMN IF NOT EXISTS "teamLogo" TEXT;

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        data JSONB
      );

      CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        "playerId" TEXT,
        "managerId" TEXT,
        amount INTEGER,
        "timestamp" TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        message TEXT,
        type TEXT,
        "timestamp" TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS fixtures (
        id TEXT PRIMARY KEY,
        "teamAId" TEXT,
        "teamBId" TEXT,
        date TEXT,
        venue TEXT,
        status TEXT,
        "teamAGoals" INTEGER,
        "teamBGoals" INTEGER,
        events JSONB DEFAULT '[]'::jsonb
      );
      
      ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb;
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
    const bidsRes = await client.query('SELECT * FROM bids ORDER BY timestamp DESC');
    const logsRes = await client.query('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100');
    const fixturesRes = await client.query('SELECT * FROM fixtures ORDER BY date ASC');
    
    return {
      players: playersRes.rows,
      managers: managersRes.rows,
      settings: settingsRes.rows.length > 0 ? settingsRes.rows[0].data : defaultSettings,
      bids: bidsRes.rows,
      logs: logsRes.rows,
      fixtures: fixturesRes.rows
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
    INSERT INTO managers (id, name, budget, username, password, "teamName", "teamLogo")
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      budget = EXCLUDED.budget,
      username = EXCLUDED.username,
      password = EXCLUDED.password,
      "teamName" = EXCLUDED."teamName",
      "teamLogo" = EXCLUDED."teamLogo"
  `, [manager.id, manager.name, manager.budget, manager.username, manager.password, manager.teamName, manager.teamLogo]);
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
   await pool.query('DELETE FROM bids');
   await pool.query('DELETE FROM system_logs');
   await pool.query('DELETE FROM fixtures');
}

async function clearLogsDB() {
   await pool.query('DELETE FROM system_logs');
}

async function deleteAllPlayersDB() {
   await pool.query('DELETE FROM players');
}

async function saveBid(bid) {
  await pool.query(`
    INSERT INTO bids ("playerId", "managerId", amount, timestamp)
    VALUES ($1, $2, $3, $4)
  `, [bid.playerId, bid.managerId, bid.amount, bid.timestamp]);
}

async function deleteManagerDB(id) {
  await pool.query('DELETE FROM managers WHERE id = $1', [id]);
}

async function saveLog(message, type) {
  try {
    await pool.query(`
      INSERT INTO system_logs (message, type)
      VALUES ($1, $2)
    `, [message, type]);
  } catch (err) {
    console.error("Failed to save log:", err);
  }
}

async function saveFixture(fixture) {
  await pool.query(`
    INSERT INTO fixtures (id, "teamAId", "teamBId", date, venue, status, "teamAGoals", "teamBGoals", events)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      "teamAId" = EXCLUDED."teamAId",
      "teamBId" = EXCLUDED."teamBId",
      date = EXCLUDED.date,
      venue = EXCLUDED.venue,
      status = EXCLUDED.status,
      "teamAGoals" = EXCLUDED."teamAGoals",
      "teamBGoals" = EXCLUDED."teamBGoals",
      events = EXCLUDED.events
  `, [fixture.id, fixture.teamAId, fixture.teamBId, fixture.date, fixture.venue, fixture.status, fixture.teamAGoals, fixture.teamBGoals, JSON.stringify(fixture.events || [])]);
}

async function deleteFixtureDB(id) {
  await pool.query('DELETE FROM fixtures WHERE id = $1', [id]);
}

module.exports = {
  initDB, loadState, savePlayer, deletePlayerDB, deleteAllPlayersDB, saveManager, deleteManagerDB, saveSettings, clearSystem, clearLogsDB, saveBid, saveLog, saveFixture, deleteFixtureDB
};
