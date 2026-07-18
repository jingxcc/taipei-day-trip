ALTER TABLE attraction
MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
COMMENT 'Controls attraction visibility. 1 = Visible, 0 = Hidden';

