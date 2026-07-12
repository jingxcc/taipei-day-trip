ALTER TABLE attraction
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
COMMENT "Show attraction in attraction list pages";