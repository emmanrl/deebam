import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';

// Define the 'users' table using the Firebase Auth UID as the primary key.
export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase Auth UID or Custom Admin UID
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('buyer'), // 'admin' or 'buyer'
  name: text('name'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country').default('United Kingdom'),
  isEmailVerified: boolean('is_email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'categories' table.
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
});

// Define the 'products' table.
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  weightSize: text('weight_size'), // e.g., "1kg", "500g"
  description: text('description'),
  price: doublePrecision('price').notNull(), // Price in GBP
  imageUrl: text('image_url'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'orders' table.
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  buyerUid: text('buyer_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('Pending'), // "Pending", "Processing", "Shipped", "Completed"
  totalAmount: doublePrecision('total_amount').notNull(),
  shippingName: text('shipping_name').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shippingCity: text('shipping_city').notNull(),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'order_items' table.
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id'), // Nullable if product is deleted
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
});

// Define relationships for the tables.
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerUid],
    references: [users.uid],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Define the 'newsletters' table.
export const newsletters = pgTable('newsletters', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'reviews' table.
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  buyerUid: text('buyer_uid')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  buyerName: text('buyer_name'),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for reviews.
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  buyer: one(users, {
    fields: [reviews.buyerUid],
    references: [users.uid],
  }),
}));

