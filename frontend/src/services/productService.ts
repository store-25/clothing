import { api, type Product } from './api';

// Service to fetch products for the main website using MERN API
export class ProductService {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

  // Helper method for caching
  private static getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Clear cache - useful after adding/updating products
  static clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Product cache cleared')
  }

  // Clear specific cache key
  static clearCacheKey(key: string): void {
    this.cache.delete(key)
    console.log(`🗑️ Cache cleared for key: ${key}`)
  }
  // Get all active products for the website
  static async getActiveProducts(): Promise<Product[]> {
    const cacheKey = 'active_products'
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey)
    if (cachedData) {
      console.log('📦 Using cached active products')
      return cachedData
    }

    try {
      const products = await api.getProducts({ status: 'active' });
      this.setCachedData(cacheKey, products)
      console.log('🔄 Fetched and cached active products')
      return products;
    } catch (error) {
      console.error('Error fetching active products:', error);
      return [];
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<Product[]> {
    const cacheKey = `category_${category}`
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey)
    if (cachedData) {
      console.log(`📦 Using cached products for category: ${category}`)
      return cachedData
    }

    try {
      const products = await api.getProductsByCategory(category);
      this.setCachedData(cacheKey, products)
      console.log(`🔄 Fetched and cached products for category: ${category}`)
      return products;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  // Get products by gender
  static async getProductsByGender(gender: string): Promise<Product[]> {
    try {
      const allProducts = await api.getProducts({ status: 'active' });
      
      if (gender === 'male') {
        // Return male + unisex products
        return allProducts.filter(product => 
          product.gender === 'male' || product.gender === 'unisex'
        );
      } else if (gender === 'female') {
        // Return female + unisex products
        return allProducts.filter(product => 
          product.gender === 'female' || product.gender === 'unisex'
        );
      } else if (gender === 'unisex') {
        // Return only unisex products
        return allProducts.filter(product => product.gender === 'unisex');
      }
      
      return allProducts;
    } catch (error) {
      console.error(`Error fetching ${gender} products:`, error);
      return [];
    }
  }

  // Get best selling products
  static async getBestSellingProducts(): Promise<Product[]> {
    try {
      return await api.getBestSellingProducts();
    } catch (error) {
      console.error('Error fetching best selling products:', error);
      return [];
    }
  }

  // Get unique categories from database
  static async getCategories(): Promise<string[]> {
    try {
      const allProducts = await this.getActiveProducts();
      const uniqueCategories = [...new Set(allProducts.map(product => product.category))];
      return uniqueCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Search products
  static async searchProducts(query: string): Promise<Product[]> {
    try {
      return await api.searchProducts(query);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get product by ID
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const product = await api.getProductById(id);
      return product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  }

  // Transform product data for website display
  static transformProductForDisplay(product: Product) {
    // Handle multiple images - use primary image or first image
    let imageUrl = 'https://clothing-guxz.onrender.com/api/placeholder-product.jpg';
    let allImages: any[] = [];
    
    if (product.images && product.images.length > 0) {
      // Transform all images for display
      allImages = product.images.map((img: any) => {
        // Handle different image URL formats
        let img_url = img.url;
        
        if (img.url.startsWith('data:')) {
          // Base64 encoded image - use as-is
          img_url = img.url;
        } else if (img.url.startsWith('http')) {
          // Absolute URL - use as-is
          img_url = img.url;
        } else if (img.url.startsWith('/api/')) {
          // API-relative URL - construct full URL
          img_url = `https://clothing-guxz.onrender.com${img.url}`;
        } else {
          // Relative path or placeholder - use as-is
          img_url = img.url;
        }
        
        return {
          url: img_url,
          alt: img.alt || `Product image`,
          isPrimary: img.isPrimary
        };
      });
      
      // Use primary image or first image as main image
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      
      // Apply same logic to primary image
      if (primaryImage.url.startsWith('data:')) {
        imageUrl = primaryImage.url;
      } else if (primaryImage.url.startsWith('http')) {
        imageUrl = primaryImage.url;
      } else if (primaryImage.url.startsWith('/api/')) {
        imageUrl = `https://clothing-guxz.onrender.com${primaryImage.url}`;
      } else {
        imageUrl = primaryImage.url;
      }
    } else if (product.image) {
      // Fallback for single image (backward compatibility)
      if (product.image.startsWith('data:')) {
        imageUrl = product.image;
      } else if (product.image.startsWith('http')) {
        imageUrl = product.image;
      } else if (product.image.startsWith('/api/')) {
        imageUrl = `https://clothing-guxz.onrender.com${product.image}`;
      } else {
        imageUrl = product.image;
      }
      
      // Create single image object for backward compatibility
      allImages = [{
        url: imageUrl,
        alt: 'Product image',
        isPrimary: true
      }];
    }

    return {
      id: product._id,
      image: imageUrl,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      originalPrice: product.mrp || product.price * 1.2, // Use actual MRP or fallback
      colors: product.variants.map((v: any) => v.color),
      sizes: product.sizes || ['S', 'M', 'L', 'XL'], // Default sizes if not specified
      badges: product.stock < 20 ? [{ text: 'Low Stock', color: 'red' }] : [],
      images: allImages // Include all images for display
    };
  }

  // Transform only image URLs while keeping full product structure
  static transformProductImages(product: Product): Product {
    if (product.images && product.images.length > 0) {
      // Transform all images for display
      const transformedImages = product.images.map((img: any) => {
        // Handle different image URL formats
        let img_url = img.url;
        
        if (img.url.startsWith('data:')) {
          // Base64 encoded image - use as-is
          img_url = img.url;
        } else if (img.url.startsWith('http')) {
          // Absolute URL - use as-is
          img_url = img.url;
        } else if (img.url.startsWith('/api/')) {
          // API-relative URL - construct full URL
          img_url = `https://clothing-guxz.onrender.com${img.url}`;
        } else {
          // Relative path or placeholder - use as-is
          img_url = img.url;
        }
        
        return {
          ...img,
          url: img_url
        };
      });
      
      return {
        ...product,
        images: transformedImages
      };
    }
    
    return product;
  }
}

export default ProductService;
