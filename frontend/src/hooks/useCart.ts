import { useState, useEffect } from 'react'
import CartService from '../services/cartService'
import { type CartItem } from '../services/cartService'

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Initialize cart on first load
    CartService.initializeCart()
    
    // Load initial cart
    const items = CartService.getCartItems()
    const count = CartService.getProductsCount()
    setCartItems(items)
    setCartCount(count) // Use products count instead of quantity

    // Listen for cart updates
    const handleCartUpdate = (event: any) => {
      const updatedItems = event.detail
      const updatedCount = CartService.getProductsCount()
      setCartItems(updatedItems)
      setCartCount(updatedCount) // Use products count instead of quantity
    }

    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  return {
    cartItems,
    cartCount,
    addToCart: CartService.addToCart,
    updateQuantity: CartService.updateQuantity,
    removeItem: CartService.removeItem,
    applyCoupon: CartService.applyCoupon, // Add async applyCoupon method
    clearCart: CartService.clearCart,
    getCartTotal: CartService.getCartTotal
  }
}
