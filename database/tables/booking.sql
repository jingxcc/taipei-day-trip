USE taipei_trip;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS booking_price;

CREATE TABLE booking_price (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    time VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    CONSTRAINT uni_idx UNIQUE (time, price, start_date)
);

-- INSERT DEFAULT VALUE
INSERT INTO booking_price (time, price, start_date, end_date)
VALUES
    ('beforenoon', 2000, '2023-9-1', NULL),
    ('afternoon', 2500, '2023-9-1', NULL);


CREATE TABLE booking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    attraction_id BIGINT NOT NULL,
    booking_price_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    booking_num INT NOT NULL,
    create_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (attraction_id) REFERENCES attraction(id),
    FOREIGN KEY (booking_price_id) REFERENCES booking_price(id)
);



