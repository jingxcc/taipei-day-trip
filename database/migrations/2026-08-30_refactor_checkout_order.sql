ALTER TABLE `order`
    MODIFY COLUMN order_no VARCHAR(24),
    ADD COLUMN booking_id BIGINT NULL UNIQUE AFTER order_no,
    ADD COLUMN bank_transaction_id VARCHAR(40) NULL UNIQUE
        COMMENT 'Payment transaction ID; currently generated as TXN + 16 uppercase hex characters (19 characters). Reserved up to 40 characters for future formats.'
        AFTER order_status,
    ADD COLUMN rec_trade_id VARCHAR(20) NULL UNIQUE AFTER bank_transaction_id,
    ADD COLUMN paid_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    MODIFY COLUMN order_status VARCHAR(16) NOT NULL;

SET SQL_SAFE_UPDATES = 0;

UPDATE `order`
SET order_status = CASE order_status
    WHEN '1' THEN 'PAID'
    WHEN '0' THEN 'FAILED'
    ELSE order_status
END;

SET SQL_SAFE_UPDATES = 1;

ALTER TABLE `order`
    MODIFY COLUMN order_status VARCHAR(16) NOT NULL 
        DEFAULT 'PENDING'
        COMMENT 'PENDING: payment unconfirmed; PAID: payment succeeded; FAILED: payment failed',
    ADD CONSTRAINT chk_order_status
        CHECK (order_status IN ('PENDING', 'PAID', 'FAILED'));