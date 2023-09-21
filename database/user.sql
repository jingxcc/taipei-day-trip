USE taipei_trip;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL
);


-- insert fake data
INSERT INTO user (user_name, email, password)
VALUES ('彭彭彭', 'ply@ply.com','1234');



