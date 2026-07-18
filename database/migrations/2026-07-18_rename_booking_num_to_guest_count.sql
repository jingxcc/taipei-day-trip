-- Rename booking_num to guest_count in booking table
ALTER TABLE booking
RENAME COLUMN booking_num TO guest_count;

-- Add guest_count to order table
ALTER TABLE `order`
ADD COLUMN guest_count INT
AFTER visit_time;

SET SQL_SAFE_UPDATES = 0;

UPDATE `order`
SET guest_count = 1
WHERE guest_count IS NULL;

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE `order`
MODIFY COLUMN guest_count INT NOT NULL;