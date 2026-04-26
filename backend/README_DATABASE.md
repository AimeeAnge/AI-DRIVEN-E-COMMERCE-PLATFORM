# AIDEP Database Setup

AIDEP uses PostgreSQL as the only supported database for backend development and runtime.

The Flask app does not create tables, run migrations, or insert sample data. The database structure is created only by manually importing `backend/schema.sql`.

## 1. Create a PostgreSQL Database

Example:

```bash
createdb aidep_db
```

Create a database user and grant access using your preferred PostgreSQL administration workflow.

## 2. Configure Environment Variables

Copy the example file:

```bash
cp backend/.env.example backend/.env
```

Set `DATABASE_URL`:

```env
DATABASE_URL=postgresql://aidep_user:strong_password@localhost:5432/aidep_db
JWT_SECRET_KEY=replace-with-a-secure-jwt-secret
JWT_EXPIRES_MINUTES=60
```

For the React development server, keep:

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 3. Import the Schema Manually

From the project root:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

Or provide the connection directly:

```bash
psql postgresql://aidep_user:strong_password@localhost:5432/aidep_db -f backend/schema.sql
```

The schema includes no sample users, products, categories, or other records.

## 4. Run Health Checks

Start Flask:

```bash
cd backend
python run.py
```

Check the app:

```bash
curl http://127.0.0.1:5001/api/v1/health
```

Check database readiness:

```bash
curl http://127.0.0.1:5001/api/v1/health/db
```

If the database is reachable but tables are missing, the response will tell you to import `backend/schema.sql`.

## Authentication Endpoints

Phase 2 adds authentication on the existing `users` table only.

Public registration allows:

- `customer`
- `merchant`

Public registration does not allow `admin`. Existing admin users can sign in if they were created through a controlled database process.

Available endpoints:

```bash
POST http://127.0.0.1:5001/api/v1/auth/register
POST http://127.0.0.1:5001/api/v1/auth/login
GET  http://127.0.0.1:5001/api/v1/auth/me
```

Authenticated requests use:

```http
Authorization: Bearer <access_token>
```

## Product Images

Product images are now stored in PostgreSQL using the `product_images.image_data` `BYTEA` column.

For backward compatibility during the transition, these metadata columns remain nullable:

- `image_url`
- `image_key`
- `bucket_name`

New product uploads should use binary image storage. Product JSON returns image metadata plus an image endpoint URL, and the frontend loads image bytes through:

```bash
GET http://127.0.0.1:5001/api/v1/products/images/<image_id>
```

Allowed upload MIME types:

- `image/jpeg`
- `image/png`
- `image/webp`

Default max product image size:

```env
MAX_PRODUCT_IMAGE_BYTES=5242880
MAX_CONTENT_LENGTH=6291456
```

## Manual ALTER TABLE Commands

For an existing AIDEP database that was created before BYTEA image storage, run these commands manually in PostgreSQL. Flask does not run schema changes automatically.

```sql
ALTER TABLE product_images
ADD COLUMN IF NOT EXISTS image_data BYTEA;

ALTER TABLE product_images
ALTER COLUMN image_url DROP NOT NULL;

ALTER TABLE product_images
DROP CONSTRAINT IF EXISTS product_images_source_check;

ALTER TABLE product_images
ADD CONSTRAINT product_images_source_check
CHECK (image_data IS NOT NULL OR image_url IS NOT NULL);

ALTER TABLE product_images
DROP CONSTRAINT IF EXISTS product_images_mime_type_check;

ALTER TABLE product_images
ADD CONSTRAINT product_images_mime_type_check
CHECK (mime_type IS NULL OR mime_type IN ('image/jpeg', 'image/png', 'image/webp'));
```

Do not drop `image_url`, `image_key`, or `bucket_name` yet. They remain for compatibility with older rows.
