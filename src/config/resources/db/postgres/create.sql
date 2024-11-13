-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- docker compose exec postgres bash
-- psql --dbname=haus --username=haus --file=/scripts/create-table-haus.sql

-- text statt varchar(n):
-- "There is no performance difference among these three types, apart from a few extra CPU cycles
-- to check the length when storing into a length-constrained column"
-- ggf. CHECK(char_length(nachname) <= 255)

-- Indexe mit pgAdmin auflisten: "Query Tool" verwenden mit
--  SELECT   tablename, indexname, indexdef, tablespace
--  FROM     pg_indexes
--  WHERE    schemaname = 'haus'
--  ORDER BY tablename, indexname;

-- https://www.postgresql.org/docs/devel/app-psql.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-CREATE
-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION haus;

ALTER ROLE haus SET search_path = 'haus';

-- https://www.postgresql.org/docs/current/sql-createtype.html
-- https://www.postgresql.org/docs/current/datatype-enum.html
CREATE TYPE hausart AS ENUM ('Einfamilienhaus', 'Mehrfamilienhaus', 'Wohnung');

-- https://www.postgresql.org/docs/current/sql-createtable.html
-- https://www.postgresql.org/docs/current/datatype.html

CREATE TABLE IF NOT EXISTS haus (
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE hausspace,
    version       integer NOT NULL DEFAULT 0,
    art           hausart NOT NULL,
    stockwerk     integer NOT NULL CHECK (stockwerk >= 0),
    zimmer        integer NOT NULL CHECK (zimmer >= 0),
    preis         decimal(10,2) NOT NULL CHECK (preis >= 0),
    groesse       decimal(10,2) NOT NULL CHECK (groesse >= 0),
    standort      text NOT NULL,
    schlagwoerter text
) TABLESPACE hausspace;

CREATE TABLE IF NOT EXISTS ausstattung (
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE hausspace,
    keller        boolean NOT NULL,
    garten        boolean NOT NULL,
    garage        boolean NOT NULL,
    haus_id       integer NOT NULL REFERENCES haus
) TABLESPACE hausspace;

CREATE TABLE IF NOT EXISTS bewohner (
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE hausspace,
    vorname       text NOT NULL,
    nachname      text NOT NULL,
    alter         integer NOT NULL CHECK (alter >= 0),
    beruf         text,
    haus_id       integer NOT NULL REFERENCES haus
) TABLESPACE hausspace;
