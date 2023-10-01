USE taipei_trip;
DROP TABLE IF EXISTS image_url;
DROP TABLE IF EXISTS attraction_mrt;
DROP TABLE IF EXISTS mrt;
DROP TABLE IF EXISTS attraction;
DROP TABLE IF EXISTS category;


CREATE TABLE category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE attraction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attraction_name VARCHAR(255) NOT NULL UNIQUE,
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
    mrt_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE attraction_mrt (
    attraction_id BIGINT,
    mrt_id BIGINT,
    FOREIGN KEY (attraction_id) REFERENCES attraction(id),
    FOREIGN KEY (mrt_id) REFERENCES mrt(id),
    CONSTRAINT uni_idx UNIQUE (attraction_id, mrt_id)
);


