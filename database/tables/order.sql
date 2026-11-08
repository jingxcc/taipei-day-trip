USE taipei_trip;
DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS order_contact;


CREATE TABLE `order` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(24) UNIQUE,
    booking_id BIGINT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    attraction_id BIGINT NOT NULL,
    order_status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING: payment unconfirmed; PAID: payment succeeded; FAILED: payment failed',
    bank_transaction_id VARCHAR(40) NULL UNIQUE
        COMMENT 'Payment transaction ID; currently generated as TXN + 16 uppercase hex characters (19 characters). Reserved up to 40 characters for future formats.',
    rec_trade_id VARCHAR(20) NULL UNIQUE,
    visit_date DATE NOT NULL,
    visit_time VARCHAR(50) NOT NULL,
    guest_count INT NOT NULL,
    order_price DECIMAL(10, 2) NOT NULL,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (attraction_id) REFERENCES attraction(id),
    CONSTRAINT chk_order_status
        CHECK (order_status IN ('PENDING', 'PAID', 'FAILED'))
);


CREATE TABLE order_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    contact_name VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES `order`(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);






