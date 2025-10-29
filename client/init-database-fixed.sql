-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('T-shirts', 'Comfortable cotton t-shirts'),
('Shoes', 'Stylish footwear for all occasions'),
('Accessories', 'Fashion accessories and jewelry'),
('Bags', 'Handbags, backpacks, and purses'),
('Dresses', 'Elegant dresses for every occasion'),
('Jackets', 'Warm and stylish outerwear'),
('Gloves', 'Protective and fashionable gloves');

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Classic White T-Shirt', 'Comfortable cotton t-shirt in white', 29.99, '/products/1w.png', 'T-shirts', 50),
('Blue Denim Jacket', 'Stylish denim jacket for casual wear', 89.99, '/products/2b.png', 'Jackets', 25),
('Black Leather Shoes', 'Elegant black leather shoes', 129.99, '/products/3b.png', 'Shoes', 30),
('Red Summer Dress', 'Beautiful red summer dress', 79.99, '/products/4r.png', 'Dresses', 20),
('Brown Leather Bag', 'Premium brown leather handbag', 149.99, '/products/5br.png', 'Bags', 15),
('Green Cotton T-Shirt', 'Soft green cotton t-shirt', 34.99, '/products/6g.png', 'T-shirts', 40),
('White Sneakers', 'Comfortable white sneakers', 99.99, '/products/7w.png', 'Shoes', 35),
('Black Winter Gloves', 'Warm black winter gloves', 24.99, '/products/8b.png', 'Gloves', 60);
