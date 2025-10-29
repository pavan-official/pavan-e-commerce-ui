-- Insert categories
INSERT INTO categories (id, name, slug, description, image, parentId, isActive, createdAt, updatedAt) VALUES
('cat_1', 'Clothing', 'clothing', 'All clothing items', NULL, NULL, true, NOW(), NOW()),
('cat_2', 'Accessories', 'accessories', 'Fashion accessories', NULL, NULL, true, NOW(), NOW());

-- Insert products
INSERT INTO products (id, name, description, price, sku, slug, images, categoryId, isActive, createdAt, updatedAt) VALUES
('prod_1', 'Classic T-Shirt', 'Comfortable cotton t-shirt', 29.99, 'TSHIRT-001', 'classic-t-shirt', ARRAY['/products/1g.png'], 'cat_1', true, NOW(), NOW()),
('prod_2', 'Denim Jacket', 'Stylish denim jacket', 89.99, 'JACKET-001', 'denim-jacket', ARRAY['/products/2g.png'], 'cat_1', true, NOW(), NOW()),
('prod_3', 'Running Shoes', 'Comfortable running shoes', 129.99, 'SHOES-001', 'running-shoes', ARRAY['/products/3b.png'], 'cat_2', true, NOW(), NOW()),
('prod_4', 'Summer Dress', 'Elegant summer dress', 79.99, 'DRESS-001', 'summer-dress', ARRAY['/products/1p.png'], 'cat_1', true, NOW(), NOW()),
('prod_5', 'Leather Bag', 'Premium leather bag', 199.99, 'BAG-001', 'leather-bag', ARRAY['/products/2gr.png'], 'cat_2', true, NOW(), NOW());
