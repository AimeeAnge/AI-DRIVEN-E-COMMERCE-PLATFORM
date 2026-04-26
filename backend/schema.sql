BEGIN;
--"Add this line manually in postgresql 'CREATE EXTENSION IF NOT EXISTS pgcrypto;' in aidep_db"
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(40),
    phone_country_code VARCHAR(8),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    country_code CHAR(2),
    region VARCHAR(120),
    city VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_check CHECK (role IN ('customer', 'merchant', 'admin')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'pending', 'suspended', 'disabled'))
);

CREATE TABLE merchant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    business_registration_number VARCHAR(120),
    country_code CHAR(2),
    region VARCHAR(120),
    city VARCHAR(120),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT merchant_profiles_status_check CHECK (status IN ('pending', 'active', 'suspended', 'disabled'))
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    country_of_origin CHAR(2),
    available_country_codes TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_price_check CHECK (price >= 0),
    CONSTRAINT products_stock_check CHECK (stock_quantity >= 0),
    CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived'))
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_data BYTEA,
    image_url TEXT,
    image_key TEXT,
    bucket_name VARCHAR(255),
    file_name VARCHAR(255),
    mime_type VARCHAR(120),
    size_bytes BIGINT,
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_images_size_check CHECK (size_bytes IS NULL OR size_bytes >= 0),
    CONSTRAINT product_images_source_check CHECK (image_data IS NOT NULL OR image_url IS NOT NULL),
    CONSTRAINT product_images_mime_type_check CHECK (
        mime_type IS NULL OR mime_type IN ('image/jpeg', 'image/png', 'image/webp')
    )
);

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cart_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT cart_items_unique_product UNIQUE (cart_id, product_id)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_number VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    shipping_country_code CHAR(2),
    shipping_region VARCHAR(120),
    shipping_city VARCHAR(120),
    shipping_address_line1 TEXT,
    shipping_address_line2 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    CONSTRAINT orders_amount_check CHECK (
        subtotal_amount >= 0
        AND shipping_amount >= 0
        AND tax_amount >= 0
        AND total_amount >= 0
    )
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT order_items_price_check CHECK (unit_price >= 0 AND total_price >= 0),
    CONSTRAINT order_items_quantity_check CHECK (quantity > 0)
);

CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wishlist_unique_product UNIQUE (user_id, product_id)
);

CREATE TABLE chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    channel VARCHAR(60) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chatbot_conversations_status_check CHECK (status IN ('open', 'closed', 'escalated'))
);

CREATE TABLE chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(30) NOT NULL,
    message_text TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chatbot_messages_sender_role_check CHECK (sender_role IN ('customer', 'merchant', 'admin', 'assistant', 'system'))
);

CREATE TABLE recommendation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    source_context VARCHAR(80) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    model_version VARCHAR(120),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recommendation_events_type_check CHECK (event_type IN ('impression', 'click', 'add_to_cart', 'purchase', 'dismiss'))
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_merchant_id ON products(merchant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX idx_recommendation_events_user_id ON recommendation_events(user_id);
CREATE INDEX idx_recommendation_events_product_id ON recommendation_events(product_id);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_merchant_profiles_updated_at
BEFORE UPDATE ON merchant_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_product_images_updated_at
BEFORE UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_chatbot_conversations_updated_at
BEFORE UPDATE ON chatbot_conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
