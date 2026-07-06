import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { categories, products, orders, orderItems, users, newsletters, reviews } from './src/db/schema.ts';
import { requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { eq, like, ilike, and, or, desc, sql } from 'drizzle-orm';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Admin Pre-configured Secure Login
  app.post('/api/admin/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const targetEmail = (email || '').trim().toLowerCase();
      if (
        (targetEmail === 'admin@deebamafromartltd.co.uk' || targetEmail === 'admin@deebamafromart.co.uk') &&
        password === 'DeebamAdmin2026!'
      ) {
        return res.json({
          success: true,
          token: 'admin-secret-token',
          user: {
            email: targetEmail,
            role: 'admin',
            name: 'Deebam Admin',
          },
        });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  // 2. Categories Endpoints
  app.get('/api/categories', async (req, res) => {
    try {
      const allCategories = await db.select().from(categories).orderBy(categories.name);
      res.json(allCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  });

  app.post('/api/categories', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name, slug, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const generatedSlug = slug || name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const [newCategory] = await db.insert(categories)
        .values({ name, slug: generatedSlug, description })
        .returning();

      res.status(201).json(newCategory);
    } catch (error: any) {
      console.error('Failed to create category:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'A category with this name or slug already exists' });
      }
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, slug, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const generatedSlug = slug || name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');

      const [updatedCategory] = await db.update(categories)
        .set({ name, slug: generatedSlug, description })
        .where(eq(categories.id, id))
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json(updatedCategory);
    } catch (error) {
      console.error('Failed to update category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const [deleted] = await db.delete(categories)
        .where(eq(categories.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ message: 'Category deleted successfully', id });
    } catch (error) {
      console.error('Failed to delete category:', error);
      res.status(500).json({ error: 'Failed to delete category (ensure it is not referenced by products)' });
    }
  });

  // 3. Products Endpoints
  app.get('/api/products', async (req, res) => {
    try {
      const search = req.query.search as string;
      const categorySlug = req.query.category as string;

      let selectQuery = db.select({
        id: products.id,
        name: products.name,
        weightSize: products.weightSize,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id));

      const conditions = [];

      if (categorySlug && categorySlug !== 'all') {
        conditions.push(eq(categories.slug, categorySlug));
      }

      if (search) {
        conditions.push(or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        ));
      }

      if (conditions.length > 0) {
        selectQuery = selectQuery.where(and(...conditions)) as any;
      }

      const allProducts = await selectQuery.orderBy(products.name);
      res.json(allProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [product] = await db.select({
        id: products.id,
        name: products.name,
        weightSize: products.weightSize,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  });

  app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name, categoryId, weightSize, description, price, imageUrl, stockQuantity } = req.body;
      
      if (!name || !categoryId || price === undefined) {
        return res.status(400).json({ error: 'Name, Category ID, and Price are required' });
      }

      const [newProduct] = await db.insert(products)
        .values({
          name,
          categoryId: parseInt(categoryId),
          weightSize,
          description,
          price: parseFloat(price),
          imageUrl,
          stockQuantity: parseInt(stockQuantity || '0'),
        })
        .returning();

      // Fetch newly created product with category join for client response consistency
      const [productWithCategory] = await db.select({
        id: products.id,
        name: products.name,
        weightSize: products.weightSize,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, newProduct.id));

      res.status(201).json(productWithCategory);
    } catch (error) {
      console.error('Failed to create product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, categoryId, weightSize, description, price, imageUrl, stockQuantity } = req.body;

      if (!name || !categoryId || price === undefined) {
        return res.status(400).json({ error: 'Name, Category ID, and Price are required' });
      }

      const [updated] = await db.update(products)
        .set({
          name,
          categoryId: parseInt(categoryId),
          weightSize,
          description,
          price: parseFloat(price),
          imageUrl,
          stockQuantity: parseInt(stockQuantity || '0'),
        })
        .where(eq(products.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Fetch with category details
      const [productWithCategory] = await db.select({
        id: products.id,
        name: products.name,
        weightSize: products.weightSize,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, updated.id));

      res.json(productWithCategory);
    } catch (error) {
      console.error('Failed to update product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(products)
        .where(eq(products.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully', id });
    } catch (error) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // 4. User Shipping Profiles Endpoints
  app.get('/api/users/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const [userProfile] = await db.select().from(users).where(eq(users.uid, req.user!.uid));
      if (!userProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(userProfile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  });

  app.put('/api/users/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, address, city, postalCode, country } = req.body;
      
      const [updatedProfile] = await db.update(users)
        .set({
          name: name || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          country: country || 'United Kingdom',
        })
        .where(eq(users.uid, req.user!.uid))
        .returning();

      res.json(updatedProfile);
    } catch (error) {
      console.error('Failed to update profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // 5. Orders Endpoints
  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { items, totalAmount, shippingName, shippingAddress, shippingCity, shippingPostalCode, shippingCountry } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Shopping cart items are required' });
      }

      if (!shippingName || !shippingAddress || !shippingCity || !shippingPostalCode) {
        return res.status(400).json({ error: 'Complete shipping information is required' });
      }

      // Execute order creation and stock adjustment inside a transaction
      const orderResult = await db.transaction(async (tx) => {
        // Double-check stock for all products
        for (const item of items) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (!product) {
            throw new Error(`Product ${item.productName} is no longer available.`);
          }
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Only ${product.stockQuantity} remaining.`);
          }
        }

        // Create the order
        const [newOrder] = await tx.insert(orders)
          .values({
            buyerUid: req.user!.uid,
            status: 'Pending',
            totalAmount: parseFloat(totalAmount),
            shippingName,
            shippingAddress,
            shippingCity,
            shippingPostalCode,
            shippingCountry: shippingCountry || 'United Kingdom',
          })
          .returning();

        // Process line items and update stock
        const lineItems = [];
        for (const item of items) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          
          await tx.update(products)
            .set({ stockQuantity: product.stockQuantity - item.quantity })
            .where(eq(products.id, item.productId));

          const [insertedItem] = await tx.insert(orderItems)
            .values({
              orderId: newOrder.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: parseFloat(item.price),
            })
            .returning();
          
          lineItems.push(insertedItem);
        }

        return { order: newOrder, items: lineItems };
      });

      res.status(201).json(orderResult);
    } catch (error: any) {
      console.error('Failed to checkout order:', error);
      res.status(400).json({ error: error.message || 'Checkout failed' });
    }
  });

  // Get current user's orders
  app.get('/api/orders/my', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userOrders = await db.select().from(orders).where(eq(orders.buyerUid, req.user!.uid)).orderBy(desc(orders.createdAt));
      
      const ordersWithItems = [];
      for (const order of userOrders) {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        ordersWithItems.push({
          ...order,
          items,
        });
      }

      res.json(ordersWithItems);
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      res.status(500).json({ error: 'Failed to retrieve your orders' });
    }
  });

  // Get all orders (Admin Only)
  app.get('/api/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
      const allOrders = await db.select({
        id: orders.id,
        buyerUid: orders.buyerUid,
        status: orders.status,
        totalAmount: orders.totalAmount,
        shippingName: orders.shippingName,
        shippingAddress: orders.shippingAddress,
        shippingCity: orders.shippingCity,
        shippingPostalCode: orders.shippingPostalCode,
        shippingCountry: orders.shippingCountry,
        createdAt: orders.createdAt,
        buyerEmail: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerUid, users.uid))
      .orderBy(desc(orders.createdAt));

      const ordersWithItems = [];
      for (const order of allOrders) {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        ordersWithItems.push({
          ...order,
          items,
        });
      }

      res.json(ordersWithItems);
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
      res.status(500).json({ error: 'Failed to retrieve orders' });
    }
  });

  // Update order status (Admin Only)
  app.put('/api/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!['Pending', 'Processing', 'Shipped', 'Completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const [updated] = await db.update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Failed to update order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // 6. Admin Sales Summary Endpoints
  app.get('/api/admin/summary', requireAuth, requireAdmin, async (req, res) => {
    try {
      // 1. Total sales revenue
      const [revenueResult] = await db.select({
        total: sql<number>`SUM(${orders.totalAmount})`
      }).from(orders);
      
      const totalRevenue = revenueResult?.total || 0;

      // 2. Total orders count
      const [ordersCountResult] = await db.select({
        count: sql<number>`COUNT(*)`
      }).from(orders);
      
      const totalOrders = ordersCountResult?.count || 0;

      // 3. Total products count
      const [productsCountResult] = await db.select({
        count: sql<number>`COUNT(*)`
      }).from(products);
      
      const totalProducts = productsCountResult?.count || 0;

      // 4. Low stock count (items with stock <= 5)
      const [lowStockResult] = await db.select({
        count: sql<number>`COUNT(*)`
      }).from(products).where(sql`${products.stockQuantity} <= 5`);
      
      const lowStockCount = lowStockResult?.count || 0;

      // 5. Category breakdown (products per category)
      const categoryBreakdown = await db.select({
        categoryName: categories.name,
        productCount: sql<number>`COUNT(${products.id})`
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`COUNT(${products.id})`));

      // 6. Popular items (sum of quantity sold)
      const popularItems = await db.select({
        productName: orderItems.productName,
        totalSold: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.price})`
      })
      .from(orderItems)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);

      res.json({
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockCount,
        categoryBreakdown,
        popularItems,
      });
    } catch (error) {
      console.error('Failed to generate sales summary:', error);
      res.status(500).json({ error: 'Failed to retrieve sales summary' });
    }
  });

  // ==========================================
  // NEWSLETTER & SUBSCRIBERS
  // ==========================================
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const subscriberEmail = email.trim().toLowerCase();

      // Check if already subscribed
      const [existing] = await db.select().from(newsletters).where(eq(newsletters.email, subscriberEmail));
      if (existing) {
        return res.json({ success: true, message: 'You are already subscribed to our weekly newsletter!' });
      }

      await db.insert(newsletters).values({ email: subscriberEmail });
      res.json({ success: true, message: 'Thank you! You have successfully subscribed to Deebam weekly specials and arrivals.' });
    } catch (error) {
      console.error('Failed to subscribe to newsletter:', error);
      res.status(500).json({ error: 'Failed to register subscription. Please try again later.' });
    }
  });

  // ==========================================
  // EMAIL DISPATCH SYSTEM (RESEND)
  // ==========================================
  app.post('/api/auth/send-welcome-email', async (req, res) => {
    try {
      const { email, displayName } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn('RESEND_API_KEY not configured. Welcome email simulated successfully.');
        return res.json({ success: true, message: 'Welcome email simulated (RESEND_API_KEY is not defined in environment).' });
      }

      const resend = new Resend(apiKey);
      const name = displayName || email.split('@')[0] || 'Customer';

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
          <div style="background-color: #1e3a1e; padding: 32px 24px; text-align: center; border-radius: 20px 20px 0 0;">
            <span style="color: #fbbf24; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 6px;">Deebam Afromart Ltd</span>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to the Family! 🌾</h1>
          </div>
          <div style="padding: 32px 24px; color: #334155; line-height: 1.6; font-size: 14px;">
            <h2 style="font-size: 18px; color: #1e3a1e; margin-top: 0; font-weight: 700;">Hello ${name},</h2>
            <p style="margin-top: 8px;">Thank you for registering an account with <strong>Deebam Afromart</strong> — your premium destination for authentic African & Caribbean groceries, fresh farm produce, and traditional spices in the United Kingdom!</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #1e3a1e; padding: 18px; margin: 24px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #1e3a1e; font-weight: 700;">Complete Your Registration</h3>
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                Please ensure you have clicked the verification link sent to your email address. Once verified, you will be able to make secure, express checkouts with our UK Integrated Payment Gateways.
              </p>
            </div>

            <p style="margin-bottom: 30px;">Explore our product catalog for premium Yam, Plantain, Garri, Palm Oil, and other fresh household favorites. We deliver straight to your doorstep across the UK with Same-Day dispatch on orders placed before 12 PM.</p>

            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'https://deebamafromart.co.uk'}" style="display: inline-block; background-color: #1e3a1e; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 800; border-radius: 14px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(30, 58, 30, 0.2);">Shop Fresh Groceries Now</a>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-weight: 600;">© 2026 Deebam Afromart Ltd. All rights reserved.</p>
            <p style="margin: 6px 0 0 0;">United Kingdom | Customer Support: <a href="mailto:support@deebamafromartltd.co.uk" style="color: #1e3a1e; text-decoration: underline; font-weight: 600;">support@deebamafromartltd.co.uk</a></p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Deebam Afromart <noreply@deebamafromartltd.co.uk>',
        to: email,
        subject: 'Welcome to Deebam Afromart - Verify Your Registration! 🌾',
        html: emailHtml
      });

      res.json({ success: true, message: 'Welcome email dispatched successfully via Resend.' });
    } catch (error: any) {
      console.error('Failed to send welcome email via Resend:', error);
      res.json({ success: false, error: error.message || 'Failed to dispatch email' });
    }
  });

  app.get('/api/admin/newsletter-subscribers', requireAuth, requireAdmin, async (req, res) => {
    try {
      const subscribers = await db.select().from(newsletters).orderBy(desc(newsletters.createdAt));
      res.json(subscribers);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
      res.status(500).json({ error: 'Failed to retrieve newsletter subscribers' });
    }
  });

  // ==========================================
  // REVIEWS & RATINGS SYSTEM
  // ==========================================
  app.get('/api/reviews/summary', async (req, res) => {
    try {
      const summary = await db.select({
        productId: reviews.productId,
        avgRating: sql<number>`avg(${reviews.rating})`,
        count: sql<number>`count(*)`
      })
      .from(reviews)
      .groupBy(reviews.productId);
      res.json(summary);
    } catch (error) {
      console.error('Failed to fetch reviews summary:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/products/:productId/reviews', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const productReviews = await db.select()
        .from(reviews)
        .where(eq(reviews.productId, productId))
        .orderBy(desc(reviews.createdAt));
      res.json(productReviews);
    } catch (error) {
      console.error('Failed to fetch product reviews:', error);
      res.status(500).json({ error: 'Failed to load reviews for this product.' });
    }
  });

  app.post('/api/products/:productId/reviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Please provide a star rating between 1 and 5.' });
      }

      // Check if buyer has previously purchased this product
      const purchased = await db.select()
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(and(
          eq(orders.buyerUid, req.user!.uid),
          eq(orderItems.productId, productId)
        ));

      if (purchased.length === 0) {
        return res.status(403).json({ 
          error: 'Review forbidden: You can only leave a rating or comment on products you have previously purchased.' 
        });
      }

      // Insert new review
      const [newReview] = await db.insert(reviews)
        .values({
          productId,
          buyerUid: req.user!.uid,
          buyerName: req.user!.name || req.user!.email.split('@')[0] || 'Authenticated Customer',
          rating: parseInt(rating),
          comment: comment || '',
        })
        .returning();

      res.status(201).json(newReview);
    } catch (error) {
      console.error('Failed to submit review:', error);
      res.status(500).json({ error: 'Failed to post review. Please try again.' });
    }
  });


  // ==========================================
  // VITE DEVELOPMENT OR PRODUCTION ASSETS SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
// At the bottom of your server.ts file
export default app;
