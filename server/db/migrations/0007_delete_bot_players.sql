-- Delete bot entries that were accidentally saved to the players table.
-- Bot names follow the pattern "Bot <difficulty>" with optional "#N" suffix.
DELETE FROM players WHERE name LIKE 'Bot %';
