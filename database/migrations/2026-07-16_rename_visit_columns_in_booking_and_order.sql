-- Rename visit-related columns in booking.
ALTER TABLE booking
RENAME COLUMN booking_date TO visit_date;


-- Rename visit-related columns and update comment in order.
ALTER TABLE `order`
RENAME COLUMN order_date TO visit_date,
RENAME COLUMN order_time TO visit_time;

ALTER TABLE `order`
MODIFY COLUMN order_status INT NOT NULL DEFAULT 0
COMMENT '0 = Unpaid, 1 = Paid';