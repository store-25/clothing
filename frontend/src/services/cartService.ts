// Centralized Cart Service for consistent cart management across all components

export interface CartItem {
  id: number
  name: string
  price: number
  mrp: number
  quantity: number
  size: string
  color: string
  image: string
}

const API_BASE_URL = 'https://clothing-guxz.onrender.com/api';

export interface CouponDiscount {
  success: boolean;
  discount: number;
  message: string;
  coupon: any;
}

class CartService {
  private static readonly STORAGE_KEY = 'cartItems'
  private static readonly COUNT_KEY = 'cartCount'
  private static readonly PRODUCTS_COUNT_KEY = 'cartProductsCount'

  // Get cart items from localStorage
  static getCartItems(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      console.error('Error reading cart from localStorage:', error)
      return []
    }
  }

  // Save cart items to localStorage
  static saveCartItems(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items))
      // Save cart count (total quantity) for existing functionality
      const count = items.reduce((total, item) => total + item.quantity, 0)
      localStorage.setItem(this.COUNT_KEY, count.toString())
      // Save products count (number of unique products)
      const productsCount = items.length
      localStorage.setItem(this.PRODUCTS_COUNT_KEY, productsCount.toString())
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }

  // Get cart count (total quantity) for existing functionality
  static getCartCount(): number {
    const count = localStorage.getItem(this.COUNT_KEY)
    if (count) {
      return parseInt(count, 10)
    }
    // Fallback to calculation if count not stored
    const items = this.getCartItems()
    const calculatedCount = items.reduce((total, item) => total + item.quantity, 0)
    localStorage.setItem(this.COUNT_KEY, calculatedCount.toString())
    return calculatedCount
  }

  // Get products count (number of unique products) for existing functionality
  static getProductsCount(): number {
    const productsCount = localStorage.getItem(this.PRODUCTS_COUNT_KEY)
    if (productsCount) {
      return parseInt(productsCount, 10)
    }
    // Fallback to calculation if count not stored
    const items = this.getCartItems()
    const calculatedProductsCount = items.length
    localStorage.setItem(this.PRODUCTS_COUNT_KEY, calculatedProductsCount.toString())
    return calculatedProductsCount
  }

  // Initialize cart on first load
  static initializeCart(): void {
    const items = this.getCartItems()
    const count = this.getCartCount()
    const productsCount = this.getProductsCount()
    
    // Fix inconsistency: if cart is empty but counts are not zero, reset them
    if (items.length === 0 && (count > 0 || productsCount > 0)) {
      localStorage.setItem(this.COUNT_KEY, '0')
      localStorage.setItem(this.PRODUCTS_COUNT_KEY, '0')
    }
    
    // Migrate existing items without MRP
    let needsUpdate = false
    const migratedItems = items.map(item => {
      if (!item.mrp) {
        needsUpdate = true
        return {
          ...item,
          mrp: item.price // Set MRP to current price if missing
        }
      }
      return item
    })
    
    if (needsUpdate) {
      this.saveCartItems(migratedItems)
    }
    
    // Ensure count is synchronized
    if (items.length > 0 && count === 0) {
      this.saveCartItems(items)
    }
  }

  // Add item to cart
  static addToCart(product: any): void {
    const cartItems = this.getCartItems()
    
    // Check if item already exists (by name and size/color)
    const existingItem = cartItems.find(item => 
      item.name === product.name && 
      item.size === product.size &&
      item.color === product.color
    )
    
    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += (product.quantity || 1)
    } else {
      // Add new item to cart with unique ID
      cartItems.push({
        id: Date.now() + Math.random(), // Ensure unique ID
        name: product.name,
        price: product.price,
        mrp: product.mrp || product.price,
        quantity: product.quantity || 1,
        size: product.size,
        color: product.color,
        image: product.image || ''
      })
    }
    
    this.saveCartItems(cartItems)
  }

  // Update item quantity
  static updateQuantity(itemId: number, change: number): void {
    const cartItems = this.getCartItems()
    const item = cartItems.find(item => item.id === itemId)
    
    if (item) {
      item.quantity = Math.max(1, item.quantity + change)
      this.saveCartItems(cartItems)
    }
  }

  // Clear all cart data - useful for removing test products
  static clearCart(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.COUNT_KEY)
    localStorage.removeItem(this.PRODUCTS_COUNT_KEY)
    localStorage.removeItem('appliedCoupon')
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }))
  }
  static removeItem(itemId: number): void {
    const cartItems = this.getCartItems()
    const updatedItems = cartItems.filter(item => item.id !== itemId)
    this.saveCartItems(updatedItems)
  }

  // Get cart total
  static getCartTotal(): number {
    return this.getCartItems().reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Apply coupon to cart
  static async applyCoupon(couponCode: string): Promise<CouponDiscount> {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.valid) {
        return {
          success: false,
          discount: 0,
          message: result.error || 'Invalid coupon',
          coupon: undefined
        };
      }

      // Get cart items for discount calculation
      const cartItems = this.getCartItems();
      let discountAmount = 0;

      if (result.coupon_type === 'overall') {
        // Apply to entire cart
        discountAmount = this.getCartTotal() * (result.discount_value / 100);
      } else if (result.coupon_type === 'single') {
        // Apply only to matching products
        const matchingItems = cartItems.filter(item => 
          result.product_ids && result.product_ids.includes(item.id.toString())
        );
        const matchingTotal = matchingItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        discountAmount = matchingTotal * (result.discount_value / 100);
      } else if (result.coupon_type === 'combo') {
        // Apply only to matching combo products
        const matchingItems = cartItems.filter(item => 
          result.combo_product_ids && result.combo_product_ids.includes(item.id.toString())
        );
        const matchingTotal = matchingItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        discountAmount = matchingTotal * (result.discount_value / 100);
      }

      return {
        success: true,
        discount: discountAmount,
        message: `Coupon applied: ${result.discount_type === 'percentage' ? result.discount_value + '%' : '₹' + result.discount_value} off`,
        coupon: result
      };

    } catch (error) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        discount: 0,
        message: 'Failed to apply coupon',
        coupon: undefined
      };
    }
  }

  // Calculate final total with coupon discount
  static getCartTotalWithCoupon(couponDiscount?: CouponDiscount): number {
    const cartTotal = this.getCartTotal();
    if (!couponDiscount || !couponDiscount.discount) {
      return cartTotal;
    }
    return Math.max(0, cartTotal - couponDiscount.discount);
  }
}

export default CartService
