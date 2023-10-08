USE taipei_trip;
DROP TABLE IF EXISTS `order`;
DROP TABLE IF EXISTS order_contact;


CREATE TABLE `order` (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(20) UNIQUE,
    user_id BIGINT NOT NULL,
    attraction_id BIGINT NOT NULL,
    order_status INT NOT NULL DEFAULT 0 COMMENT 'Unpaid/Paid, 0 is Unpaid',
    order_date DATE NOT NULL,
    order_time VARCHAR(50) NOT NULL,
    order_price DECIMAL(10, 2) NOT NULL,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (attraction_id) REFERENCES attraction(id),
    UNIQUE (order_no)
);


CREATE TABLE order_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    contact_name VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);







