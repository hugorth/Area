DROP DATABASE IF EXISTS AREA;

CREATE DATABASE AREA;

USE AREA;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    provider VARCHAR(255),
    requires_oauth BOOLEAN DEFAULT false
);

CREATE TABLE user_services (
    user_id INT,
    service_id INT,
    access_token TEXT,
    PRIMARY KEY (user_id, service_id)
);

INSERT INTO services (name, description) VALUES ('Google', 'Service Google');
INSERT INTO services (name, description) VALUES ('Outlook', 'Service Microsoft Outlook');
INSERT INTO services (id, name, description) VALUES ('gmail', 'Gmail', 'Google email service');
INSERT INTO services (id, name, description) VALUES ('teams', 'Teams', 'Teams collaboration service');
INSERT INTO services (name, description) VALUES ('Dropbox', 'Dropbox file storage service');
INSERT INTO services (name, description) VALUES ('Github', 'Github file storage service');
INSERT INTO services (name, description) VALUES ('Spotify', 'Spotify file storage service');