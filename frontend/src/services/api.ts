// API service for MERN stack communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://store25-0ven.onrender.com/api';

export interface Product {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  category: string;
  gender: 'male' | 'female' | 'unisex';
  description: string;
  stock: number;
  status: 'active' | 'inactive';
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  image?: string; // Keep for backward compatibility
  sizes: string[];
  colors: string[];
  variants: {
    size: string;
    color: string;
    stock: number;
    sku: string;
    price: number;
  }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  // Validate coupon code
  async validateCoupon(couponCode: string) {
    return this.request('/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code: couponCode.trim() })
    });
  }

  // Get admin token from localStorage
  private getAdminToken(): string {
    return localStorage.getItem('adminToken') || '';
  }

  // Generic request method
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };

    console.log('🌐 API Request Details:');
    console.log('   URL:', url);
    console.log('   Method:', options.method || 'GET');
    console.log('   Headers:', config.headers);
    console.log('   Body:', options.body);
    console.log('   Full config:', config);

    try {
      console.log('📤 Sending request to:', url);
      const response = await fetch(url, config);
      console.log('📥 Response received:');
      console.log('   Status:', response.status);
      console.log('   Status Text:', response.statusText);
      console.log('   Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error message from server
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.log('❌ Server error response:', errorData);
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
          console.log('❌ Could not parse error response, using status text:', errorMessage);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Successful response:', result);
      return result;
    } catch (error) {
      console.error('❌ API request failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        url,
        method: options.method || 'GET'
      });
      
      // Re-throw with more context
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after 30 seconds: ${url}`);
      }
      throw error;
    }
  }

  // Product operations
  async getProducts(params?: {
    category?: string;
    status?: string;
    search?: string;
    gender?: string;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.gender) searchParams.append('gender', params.gender);

    const endpoint = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const result = await this.request(endpoint);
    
    // Debug: Log API response to check MRP values
    console.log('🔍 API Response - Products count:', result.length);
    result.forEach((product: any, index: number) => {
      console.log(`🔍 Product ${index + 1}:`, {
        _id: product._id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        hasMrp: !!product.mrp,
        mrpType: typeof product.mrp
      });
    });
    
    return result;
  }

  async getProductById(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      console.log('Creating product with data:', productData);
      const result = await this.request('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      console.log('Product creation result:', result);
      return result;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin authentication
  async adminLogin(email: string, password: string): Promise<any> {
    const result = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token if login successful
    if (result.token) {
      localStorage.setItem('adminToken', result.token);
    }
    
    return result;
  }

  adminLogout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUser');
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.request(`/products/category/${category}`);
  }

  async getBestSellingProducts(): Promise<Product[]> {
    return this.request('/products/bestsellers');
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.request(`/products?search=${encodeURIComponent(query)}`);
  }

  // Orders
  async createOrder(orderPayload: any): Promise<any> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  }

  // Affiliate Coupons
  async getAffiliateCoupons(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const endpoint = `/admin/coupons${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint, {
      headers: { Authorization: `Bearer ${this.getAdminToken()}` }
    });
  }

  async createAffiliateCoupon(couponData: {
    code: string;
    discount: number;
    expiryDate: string;
    affiliateEmail: string;
  }): Promise<any> {
    return this.request('/admin/create-coupon', {
      method: 'POST',
      body: JSON.stringify(couponData),
      headers: { Authorization: `Bearer ${this.getAdminToken()}` }
    });
  }

  async updateAffiliateCoupon(id: string, data: any): Promise<any> {
    return this.request(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${this.getAdminToken()}` }
    });
  }

  async deleteAffiliateCoupon(id: string): Promise<any> {
    return this.request(`/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.getAdminToken()}` }
    });
  }

  async getCouponStats(): Promise<any> {
    return this.request('/admin/coupons/stats', {
      headers: { Authorization: `Bearer ${this.getAdminToken()}` }
    });
  }

  // Public coupon endpoints
  async applyCoupon(code: string): Promise<any> {
    return this.request('/coupon/apply', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async validateAffiliateCoupon(code: string): Promise<any> {
    return this.request('/coupon/validate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async getActiveCoupons(params?: { limit?: number; skip?: number }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());

    const endpoint = `/coupon/active${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Test method to verify API connectivity
  async testConnection(): Promise<any> {
    try {
      console.log('🧪 Testing API connection...');
      const result = await this.request('/admin/test');
      console.log('✅ API connection test successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ API connection test failed:', error);
      throw error;
    }
  }

  // Legacy Coupons (kept for backward compatibility)
  async getCoupons(): Promise<any[]> {
    try {
      console.log('🔍 API: Fetching coupons from /admin/coupons');
      console.log('🔑 API: Admin token available:', !!this.getAdminToken());
      
      // Use direct URL for admin routes (without /api prefix)
      const response = await fetch(`https://store25-0ven.onrender.com/admin/coupons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAdminToken()}`
        }
      });

      console.log('📥 Response received:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ API: Coupons fetched successfully:', result);
      console.log('📊 API: Coupons count:', result?.length || 0);
      
      return result;
    } catch (error: any) {
      console.error('❌ API: Failed to fetch coupons:', error);
      console.error('❌ API: Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      throw error;
    }
  }

  async createCoupon(couponData: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/create-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAdminToken()}`
        },
        body: JSON.stringify(couponData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Forward the specific error message from the server
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('Create coupon error:', error);
      throw error;
    }
  }

  async updateCoupon(id: string, data: any): Promise<any> {
    const response = await fetch(`https://store25-0ven.onrender.com/admin/coupons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAdminToken()}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteCoupon(id: string): Promise<any> {
    const response = await fetch(`https://store25-0ven.onrender.com/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAdminToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteOrder(orderId: string): Promise<void> {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.getAdminToken()}` }
    });
  }

  // Download order report
  async downloadOrderReport(startDate: string, endDate: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/orders/report?startDate=${startDate}&endDate=${endDate}`, {
      headers: { 
        Authorization: `Bearer ${this.getAdminToken()}`,
        'Content-Type': 'text/csv'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to download report');
    }

    // Get filename from response headers or create default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `orders-report-${startDate}-to-${endDate}.csv`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async getOrders(): Promise<any[]> {
    console.log('🔍 Dashboard: Fetching orders from admin API...');
    const token = this.getAdminToken();
    console.log('🔍 Dashboard: Admin token exists:', !!token);
    
    const result = await this.request('/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    console.log('🔍 Dashboard: Orders received:', result?.data?.length || 0);
    console.log('🔍 Dashboard: Order sample:', result?.data?.[0] ? {
      order_id: result.data[0].order_id,
      order_status: result.data[0].order_status,
      final_amount: result.data[0].final_amount,
      created_at: result.data[0].created_at
    } : 'No orders');
    
    return result.data || [];
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Upload image
  async uploadImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Image upload failed');
    }
    
    return response.json();
  }

  // Upload multiple images
  async uploadImages(files: File[]): Promise<{ imageUrls: string[] }> {
    console.log('🚀 Starting image upload...');
    console.log('   📁 Files to upload:', files.length);
    console.log('   📋 File details:', files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })));
    
    if (files.length === 0) {
      throw new Error('No files selected for upload');
    }
    
    // Check file sizes (5MB limit per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      console.error('❌ Files too large:', oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`));
      throw new Error(`Files too large. Maximum size is 5MB per file. Oversized files: ${oversizedFiles.map(f => f.name).join(', ')}`);
    }
    
    // Check file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      console.error('❌ Invalid file types:', invalidFiles.map(f => `${f.name} (${f.type})`));
      throw new Error(`Invalid file types. Only images are allowed. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
    }
    
    const formData = new FormData();
    
    // Append all files with the same field name 'images'
    files.forEach((file, index) => {
      console.log(`   📎 Appending file ${index + 1}:`, file.name);
      formData.append('images', file);
    });
    
    console.log('   📤 Sending request to:', `${API_BASE_URL}/upload`);
    console.log('   📊 FormData entries count:', formData.getAll('images').length);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
        signal: AbortSignal.timeout(60000) // Increased to 60 second timeout
      });
      
      const endTime = Date.now();
      console.log('   ⏱️ Request completed in:', endTime - startTime, 'ms');
      console.log('   📋 Response status:', response.status);
      console.log('   📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('   ❌ Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Images upload failed: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('   ✅ Upload successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Upload error:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
