-- Create users if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gatewayApp') THEN
    CREATE ROLE gatewayApp LOGIN PASSWORD 'gatewayApp';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'courseApp') THEN
    CREATE ROLE courseApp LOGIN PASSWORD 'courseApp';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'studentApp') THEN
    CREATE ROLE studentApp LOGIN PASSWORD 'studentApp';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gradeApp') THEN
    CREATE ROLE gradeApp LOGIN PASSWORD 'gradeApp';
  END IF;
END $$;

-- Create databases outside of DO block (PostgreSQL restriction)
-- These commands will fail silently if the DB already exists
CREATE DATABASE gatewayApp OWNER gatewayApp;
CREATE DATABASE courseApp OWNER courseApp;
CREATE DATABASE studentApp OWNER studentApp;
CREATE DATABASE gradeApp OWNER gradeApp;
