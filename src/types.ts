export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'buyer';
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isEmailVerified?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  name: string;
  weightSize?: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId?: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  buyerUid: string;
  buyerEmail?: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Completed';
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  categoryBreakdown: {
    categoryName: string;
    productCount: number;
  }[];
  popularItems: {
    productName: string;
    totalSold: number;
    totalRevenue: number;
  }[];
}
