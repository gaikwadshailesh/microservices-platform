-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS users_username_idx ON users (username);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);

-- Comments for table structure
COMMENT ON TABLE users IS 'User accounts for authentication and profile management';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.name IS 'Full name of the user';
COMMENT ON COLUMN users.email IS 'Unique email address for the user';
COMMENT ON COLUMN users.username IS 'Unique username for authentication';
COMMENT ON COLUMN users.password IS 'Hashed password for user authentication';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';

COMMENT ON TABLE products IS 'Products available in the system';
COMMENT ON COLUMN products.id IS 'Unique identifier for the product';
COMMENT ON COLUMN products.name IS 'Name of the product';
COMMENT ON COLUMN products.price IS 'Price of the product';
COMMENT ON COLUMN products.created_at IS 'Timestamp when the product was created';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO CURRENT_USER;
GRANT SELECT, INSERT, UPDATE ON products TO CURRENT_USER;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO CURRENT_USER;
GRANT USAGE, SELECT ON SEQUENCE products_id_seq TO CURRENT_USER;
