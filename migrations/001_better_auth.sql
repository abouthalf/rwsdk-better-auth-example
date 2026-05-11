-- Better Auth base schema for SQLite / Cloudflare D1
-- Generated from better-auth@1.6.10 source (get-tables.ts)
-- email+password auth, no plugins

CREATE TABLE `user` (
  `id`             text    PRIMARY KEY,
  `name`           text    NOT NULL,
  `email`          text    NOT NULL UNIQUE,
  `emailVerified`  integer NOT NULL DEFAULT 0,
  `image`          text,
  `createdAt`      integer NOT NULL,
  `updatedAt`      integer NOT NULL
);

CREATE TABLE `session` (
  `id`          text    PRIMARY KEY,
  `expiresAt`   integer NOT NULL,
  `token`       text    NOT NULL UNIQUE,
  `createdAt`   integer NOT NULL,
  `updatedAt`   integer NOT NULL,
  `ipAddress`   text,
  `userAgent`   text,
  `userId`      text    NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE INDEX `session_userId_idx` ON `session` (`userId`);

CREATE TABLE `account` (
  `id`                     text    PRIMARY KEY,
  `accountId`              text    NOT NULL,
  `providerId`             text    NOT NULL,
  `userId`                 text    NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `accessToken`            text,
  `refreshToken`           text,
  `idToken`                text,
  `accessTokenExpiresAt`   integer,
  `refreshTokenExpiresAt`  integer,
  `scope`                  text,
  `password`               text,
  `createdAt`              integer NOT NULL,
  `updatedAt`              integer NOT NULL
);

CREATE INDEX `account_userId_idx` ON `account` (`userId`);

CREATE TABLE `verification` (
  `id`          text    PRIMARY KEY,
  `identifier`  text    NOT NULL,
  `value`       text    NOT NULL,
  `expiresAt`   integer NOT NULL,
  `createdAt`   integer NOT NULL,
  `updatedAt`   integer NOT NULL
);

CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
