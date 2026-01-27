---
applyTo: "**/*.sql, **/*.psql, **/*.pgsql, **/*.dbml, **/*.ts"
---

These guidelines help GitHub Copilot generate efficient, secure, and maintainable database code following industry best practices.

# Database Best Practices for GitHub Copilot

## Database Design

### Schema Design

**Instructions for Copilot:**

- Use appropriate data types for columns
- Define primary keys for all tables
- Use foreign keys to maintain referential integrity
- Normalize data to reduce redundancy (3NF typically)
- Denormalize strategically for performance when needed
- Use meaningful table and column names
- Use singular names for tables
- Document schema decisions

**Example:**

```sql
-- Good table design with proper constraints
CREATE TABLE user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT check_role CHECK (role IN ('admin', 'user', 'guest'))
);

-- Related table with foreign key
CREATE TABLE order (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES user(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Check constraints
    CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0),
    CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Junction table for many-to-many relationships
CREATE TABLE user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT,

    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES user(id) ON DELETE SET NULL
);
```

### Indexes

**Instructions for Copilot:**

- Create indexes on columns frequently used in WHERE, JOIN, ORDER BY
- Index foreign keys
- Create composite indexes for multi-column queries
- Don't over-index - each index has maintenance cost
- Use partial indexes for filtered queries
- Use unique indexes for unique constraints
- Monitor and analyze index usage

**Example:**

```sql
-- Index on frequently queried column
CREATE INDEX idx_user_email ON user(email);

-- Composite index for common query patterns
CREATE INDEX idx_order_user_status ON order(user_id, status);

-- Partial index for specific queries
CREATE INDEX idx_active_users ON user(email) WHERE is_active = true;

-- Full-text search index
CREATE INDEX idx_product_search ON product USING gin(to_tsvector('english', name || ' ' || description));

-- Index with specific ordering for ORDER BY queries
CREATE INDEX idx_order_created_desc ON order(created_at DESC);
```

## Query Optimization

### Efficient Queries

**Instructions for Copilot:**

- Use prepared statements/parameterized queries (prevents SQL injection)
- Select only needed columns, not SELECT \*
- Use LIMIT for result set size control
- Use indexes effectively
- Avoid N+1 queries - use joins or batch loading
- Use EXISTS instead of COUNT for existence checks
- Use appropriate JOIN types
- Avoid subqueries in SELECT when possible

**Example:**

```sql
-- ❌ Bad: SELECT * and no LIMIT
SELECT * FROM user;

-- ✅ Good: Select specific columns with LIMIT
SELECT id, name, email FROM user LIMIT 100;

-- ❌ Bad: N+1 query pattern
-- First query: Get all orders
SELECT id FROM order WHERE user_id = ?;
-- Then for each order: Get items (N queries)
SELECT * FROM order_item WHERE order_id = ?;

-- ✅ Good: Single query with JOIN
SELECT
    o.id AS order_id,
    o.total_amount,
    oi.id AS item_id,
    oi.product_name,
    oi.quantity
FROM order o
LEFT JOIN order_item oi ON o.id = oi.order_id
WHERE o.user_id = ?;

-- ❌ Bad: Using COUNT for existence check
SELECT COUNT(*) FROM user WHERE email = ?;

-- ✅ Good: Using EXISTS
SELECT EXISTS(SELECT 1 FROM user WHERE email = ? LIMIT 1);

-- ❌ Bad: Subquery in SELECT
SELECT
    u.id,
    u.name,
    (SELECT COUNT(*) FROM order WHERE user_id = u.id) AS order_count
FROM user u;

-- ✅ Good: Use JOIN with GROUP BY
SELECT
    u.id,
    u.name,
    COUNT(o.id) AS order_count
FROM user u
LEFT JOIN order o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

### Prepared Statements

**Instructions for Copilot:**

- Always use parameterized queries to prevent SQL injection
- Never concatenate user input into SQL strings
- Use ORM query builders when available
- Cache prepared statements for repeated queries

**Examples by Language:**

**JavaScript with pg:**

````javascript
import { Pool } from "pg";

const pool = new Pool();

// ✅ Good: Parameterized query
async function getUserByEmail(email) {
  const result = await pool.query(
    "SELECT id, name, email FROM user WHERE email = $1",
    [email],
  );
  return result.rows[0];
}

// ❌ Bad: String concatenation
async function getUserByEmailBad(email) {
  const result = await pool.query(
    `SELECT * FROM user WHERE email = '${email}'`,
  );
  return result.rows[0];
}

## ORM Best Practices

### Using ORMs Effectively

**Instructions for Copilot:**

- Use ORMs for standard CRUD operations
- Use raw SQL for complex queries when needed
- Understand generated SQL - use query logging in development
- Use eager loading to prevent N+1 queries
- Use transactions for multi-step operations
- Implement proper connection pooling
- Handle database errors appropriately

**Example (TypeORM):**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

@Entity()
class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  status: string;
}

// Repository usage
class UserRepository {
  // ❌ Bad: N+1 query problem
  async getUsersWithOrdersBad() {
    const users = await userRepository.find();
    // This will trigger a query for each user's orders
    for (const user of users) {
      await user.orders; // N+1 queries!
    }
    return users;
  }

  // ✅ Good: Eager loading with relations
  async getUsersWithOrders() {
    return await userRepository.find({
      relations: ["orders"],
    });
  }

  // ✅ Good: Using query builder for complex queries
  async getActiveUsersWithRecentOrders() {
    return await userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.orders", "order")
      .where("user.isActive = :active", { active: true })
      .andWhere("order.createdAt > :date", {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })
      .getMany();
  }

  // ✅ Good: Using raw SQL for complex queries
  async getComplexStats() {
    return await userRepository.query(
      `
            SELECT
                u.name,
                COUNT(o.id) as order_count,
                SUM(o.total_amount) as total_spent
            FROM user u
            LEFT JOIN "order" o ON u.id = o.user_id
            WHERE u.is_active = $1
            GROUP BY u.id, u.name
            HAVING COUNT(o.id) > $2
        `,
      [true, 5],
    );
  }
}
````

## Transactions

**Instructions for Copilot:**

- Use transactions for operations that must succeed or fail together
- Keep transactions as short as possible
- Handle transaction rollback on errors
- Use appropriate isolation levels
- Don't hold transactions during external API calls
- Use savepoints for nested transactions

**Example (TypeScript with TypeORM):**

```typescript
import { getManager } from "typeorm";

async function createUserWithProfile(userData: any, profileData: any) {
  /**
   * Create user and profile in a transaction.
   * If either operation fails, both are rolled back.
   */
  return await getManager().transaction(async (transactionalEntityManager) => {
    // Create user
    const user = transactionalEntityManager.create(User, userData);
    await transactionalEntityManager.save(user);

    // Create profile
    const profile = transactionalEntityManager.create(Profile, {
      ...profileData,
      userId: user.id,
    });
    await transactionalEntityManager.save(profile);

    return { user, profile };
  });
}
```

## Migrations

**Instructions for Copilot:**

- Use migration tools for schema changes
- Never modify database schema manually in production
- Make migrations reversible (up/down)
- Test migrations on staging before production
- Keep migrations small and focused
- Include data migrations when needed
- Version migrations sequentially

**Example (Node.js with node-pg-migrate):**

````javascript
// migrations/1234567890_create_users_table.js

exports.up = (pgm) => {
  pgm.createTable("user", {
    id: "id",
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    password_hash: {
      type: "varchar(255)",
      notNull: true,
    },
    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create indexes
  pgm.createIndex("user", "email");
  pgm.createIndex("user", "created_at");
};

exports.down = (pgm) => {
  pgm.dropTable("user");
};

## Connection Pooling

**Instructions for Copilot:**

- Use connection pooling for better performance
- Configure appropriate pool size
- Set connection timeout and idle timeout
- Monitor pool usage
- Handle pool exhaustion gracefully
- Close connections properly

**Example:**

```typescript
import { Pool } from "pg";

// Configure connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool configuration
  max: 20, // Maximum number of clients in pool
  min: 5, // Minimum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection can't be established
});

// Proper connection handling
async function queryDatabase(query: string, params: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    client.release(); // Always release connection back to pool
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await pool.end();
  console.log("Database pool closed");
});
````

## Performance Optimization

**Instructions for Copilot:**

- Use EXPLAIN ANALYZE to understand query performance
- Monitor slow query logs
- Use appropriate indexes
- Cache frequently accessed data
- Use database-level caching (query cache, result cache)
- Implement application-level caching (Redis, Memcached)
- Use database views for complex queries
- Consider read replicas for read-heavy workloads
- Implement pagination for large result sets

**Example:**

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) as order_count
FROM user u
LEFT JOIN "order" o ON u.id = o.user_id
WHERE u.is_active = true
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5;

-- Create materialized view for expensive queries
CREATE MATERIALIZED VIEW user_order_stats AS
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(o.id) AS total_orders,
    SUM(o.total_amount) AS total_spent,
    MAX(o.created_at) AS last_order_date
FROM user u
LEFT JOIN "order" o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email;

-- Create index on materialized view
CREATE INDEX idx_user_order_stats_total_spent
ON user_order_stats(total_spent DESC);

-- Refresh materialized view (run periodically)
REFRESH MATERIALIZED VIEW user_order_stats;
```

## Security Best Practices

**Instructions for Copilot:**

- Always use parameterized queries
- Never store passwords in plain text
- Encrypt sensitive data at rest
- Use SSL/TLS for database connections
- Implement principle of least privilege for database users
- Audit database access
- Regularly backup databases
- Test backup restoration procedures
- **If a function is SECURITY DEFINER, always pin the search_path** - This is critical because the definer's privileges apply, and an unpinned search_path could allow privilege escalation attacks
- **Wrap auth/session function calls in scalar subqueries for RLS policies** - Direct calls like `auth.uid()` or `current_setting('...')` inside USING or WITH CHECK are volatile and re-evaluated per row, causing CPU overhead for bulk operations. Use `(SELECT auth.uid())` instead of `auth.uid()` for more efficient execution plans

**Example:**

```sql
-- Create database user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Revoke dangerous permissions
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM app_user;
REVOKE CREATE ON SCHEMA public FROM app_user;

-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted data
INSERT INTO user (email, password_hash, ssn_encrypted)
VALUES (
    'user@example.com',
    crypt('password', gen_salt('bf')),
    pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- ✅ Good: SECURITY DEFINER function with pinned search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, role)
    VALUES (new.id, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ❌ Bad: SECURITY DEFINER without pinned search_path (vulnerable to privilege escalation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, role)
    VALUES (new.id, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Good: RLS policy with scalar subquery for auth function
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- ❌ Bad: RLS policy with direct auth function call (re-evaluated per row)
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);
```

## Best Practices Summary

**Instructions for Copilot:**

### DO:

- ✅ Use parameterized queries always
- ✅ Create appropriate indexes
- ✅ Use transactions for multi-step operations
- ✅ Implement connection pooling
- ✅ Use migrations for schema changes
- ✅ Monitor query performance
- ✅ Implement proper error handling
- ✅ Use foreign keys for referential integrity
- ✅ Normalize data appropriately
- ✅ Back up databases regularly

### DON'T:

- ❌ Concatenate user input into SQL
- ❌ Use SELECT \* in production code
- ❌ Ignore N+1 query problems
- ❌ Modify production schema manually
- ❌ Store sensitive data unencrypted
- ❌ Use root/admin credentials for application
- ❌ Ignore slow query logs
- ❌ Over-index tables
- ❌ Hold transactions during external calls
- ❌ Forget to close connections
