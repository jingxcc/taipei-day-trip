CREATE TABLE category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE attraction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(3000),
    category_id BIGINT,
    address VARCHAR(150),
    transport VARCHAR(1000),
    latitude DOUBLE(9, 6),
    longitude DOUBLE(9, 6),
    FOREIGN KEY (category_id) REFERENCES category(id)
);


CREATE TABLE image_url (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attraction_id BIGINT,
    url VARCHAR(500) NOT NULL,
    FOREIGN KEY (attraction_id) REFERENCES attraction(id)
);

CREATE TABLE mrt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE attraction_mrt (
    attraction_id BIGINT,
    mrt_id BIGINT,
    FOREIGN KEY (attraction_id) REFERENCES attraction(id),
    FOREIGN KEY (mrt_id) REFERENCES mrt(id)
);




-- DROP TABLE image_url;
-- DROP TABLE mrt;
-- DROP TABLE attraction_mrt;
-- DROP TABLE attraction;
-- DROP TABLE category;

-- SHOW WARNINGS;
