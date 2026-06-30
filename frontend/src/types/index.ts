export type UserRole = 'admin' | 'user';

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Product {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name?: string;
  sku: string;
  description: string;
  price: number;
  current_quantity: number;
  minimum_stock_level: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  transaction_id: number;
  product_id: number;
  product_name: string;
  user_id: number;
  user_name: string;
  transaction_type: 'stock_in' | 'stock_out';
  quantity: number;
  remarks: string;
  created_at: string;
}

export interface AuditLog {
  log_id: number;
  user_id: number;
  user_name: string;
  product_id?: number;
  product_name?: string;
  action: string;
  details: string;
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_users: number;
  low_stock_products: number;
  recent_transactions: Transaction[];
}

export interface CategoryAnalytics {
  category_name: string;
  product_count: number;
  total_quantity: number;
}

export interface MonthlyChange {
  month: string;
  stock_in: number;
  stock_out: number;
}

export interface Analytics {
  inventory_by_category: CategoryAnalytics[];
  monthly_changes: MonthlyChange[];
  low_stock_products: Product[];
  recent_activity: AuditLog[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  name: string;
}

export interface ProductRequest {
  request_id: number;
  product_id?: number;
  product_name: string;
  category_id?: number;
  category_name?: string;
  quantity: number;
  user_id: number;
  user_name: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface StockRunwayPrediction {
  product_id: number;
  product_name: string;
  current_stock: number;
  predicted_30_day_demand: number;
  stock_runway_status: string;
}


