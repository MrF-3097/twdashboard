// Quick test script to check quest data
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

console.log('Checking quest data for Sorin Băcilă...\n');

db.all("SELECT * FROM quest_progress WHERE agent_name LIKE '%Sorin%' OR agent_id = 7633", (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`Found ${rows.length} quest records:\n`);
  rows.forEach(row => {
    console.log({
      id: row.id,
      agentId: row.agent_id,
      agentName: row.agent_name,
      questId: row.quest_id,
      questType: row.quest_type,
      completed: row.completed,
      currentProgress: row.current_progress,
      targetProgress: row.target_progress,
    });
  });
  
  db.close();
});
