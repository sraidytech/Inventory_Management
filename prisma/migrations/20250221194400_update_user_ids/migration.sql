-- Update existing products to use the new user ID
UPDATE "Product"
SET "userId" = 'user_2tBMzMZPzTt7W3sRTJ5UMWPfoZf'
WHERE "userId" = 'default-user';

-- Update existing categories to use the new user ID
UPDATE "Category"
SET "userId" = 'user_2tBMzMZPzTt7W3sRTJ5UMWPfoZf'
WHERE "userId" = 'default-user';

-- Update existing suppliers to use the new user ID
UPDATE "Supplier"
SET "userId" = 'user_2tBMzMZPzTt7W3sRTJ5UMWPfoZf'
WHERE "userId" = 'default-user';
