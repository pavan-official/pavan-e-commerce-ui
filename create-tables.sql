-- Create categories table
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    images TEXT[],
    "categoryId" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("categoryId") REFERENCES categories(id)
);

-- Insert categories
INSERT INTO categories (id, name, slug, description, "isActive", "createdAt", "updatedAt") VALUES
('cat_1', 'Clothing', 'clothing', 'All clothing items', true, NOW(), NOW()),
('cat_2', 'Accessories', 'accessories', 'Fashion accessories', true, NOW(), NOW());

-- Insert products
INSERT INTO products (id, name, description, price, sku, slug, images, "categoryId", "isActive", "createdAt", "updatedAt") VALUES
('prod_1', 'Classic T-Shirt', 'Comfortable cotton t-shirt', 29.99, 'TSHIRT-001', 'classic-t-shirt', ARRAY['/products/1g.png'], 'cat_1', true, NOW(), NOW()),
('prod_2', 'Denim Jacket', 'Stylish denim jacket', 89.99, 'JACKET-001', 'denim-jacket', ARRAY['/products/2g.png'], 'cat_1', true, NOW(), NOW()),
('prod_3', 'Running Shoes', 'Comfortable running shoes', 129.99, 'SHOES-001', 'running-shoes', ARRAY['/products/3b.png'], 'cat_2', true, NOW(), NOW()),
('prod_4', 'Summer Dress', 'Elegant summer dress', 79.99, 'DRESS-001', 'summer-dress', ARRAY['/products/1p.png'], 'cat_1', true, NOW(), NOW()),
('prod_5', 'Leather Bag', 'Premium leather bag', 199.99, 'BAG-001', 'leather-bag', ARRAY['/products/2gr.png'], 'cat_2', true, NOW(), NOW());
