-- Migrate font_size from INTEGER to FLOAT
BEGIN TRANSACTION;

-- Create new table with correct schema
CREATE TABLE annotations_new (
    id INTEGER PRIMARY KEY,
    note_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    font_size FLOAT DEFAULT 1.5,
    color VARCHAR(20) DEFAULT '#ff4d4f',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id)
);

-- Copy data, converting font_size from px to vw equivalent
INSERT INTO annotations_new (id, note_id, content, x, y, font_size, color, created_at)
SELECT id, note_id, content, x, y, 
    CASE 
        WHEN font_size IS NULL THEN 1.5
        WHEN font_size <= 10 THEN 0.8
        WHEN font_size <= 12 THEN 1.0
        WHEN font_size <= 14 THEN 1.2
        WHEN font_size <= 16 THEN 1.5
        WHEN font_size <= 18 THEN 1.8
        WHEN font_size <= 20 THEN 2.0
        WHEN font_size <= 24 THEN 2.5
        ELSE 3.0
    END as font_size,
    color, created_at
FROM annotations;

-- Drop old table
DROP TABLE annotations;

-- Rename new table
ALTER TABLE annotations_new RENAME TO annotations;

COMMIT;
