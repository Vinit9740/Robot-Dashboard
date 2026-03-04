-- Create robotuser role if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'robotuser') THEN
      CREATE ROLE robotuser WITH LOGIN PASSWORD 'robotpass';
   END IF;
END
$do$;

-- Grant permissions to robotuser
ALTER ROLE robotuser CREATEDB;
ALTER ROLE robotuser SUPERUSER;

-- Create robotdb if it doesn't exist
SELECT 'CREATE DATABASE robotdb' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'robotdb')\gexec

-- Grant privileges on robotdb to robotuser
GRANT ALL PRIVILEGES ON DATABASE robotdb TO robotuser;
