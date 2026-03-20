import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react'
import { api } from '../services/api'
import CartService, { type CartItem } from '../services/cartService'

interface CartProps {
  setCurrentPage?: (page: string) => void
}

export default function Cart({ setCurrentPage }: CartProps = {}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')

  // Load cart from localStorage and listen for updates
  useEffect(() => {
    const loadCart = () => {
      setCartItems(CartService.getCartItems())
    }

    // Load applied coupon from localStorage
    const loadAppliedCoupon = () => {
      try {
        const savedCoupon = localStorage.getItem('appliedCoupon')
        if (savedCoupon) {
          setAppliedCoupon(JSON.parse(savedCoupon))
        }
      } catch (error) {
        console.error('Failed to load applied coupon:', error)
      }
    }

    // Initial load
    loadCart()
    loadAppliedCoupon()

    // Listen for cart updates from other components
    const handleCartUpdate = (event: any) => {
      setCartItems(event.detail)
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  // Real coupon validation using API with enhanced logic
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    // Test coupon for debugging - remove this in production
    if (couponCode.trim().toUpperCase() === 'TEST20') {
      const testResult = {
        valid: true,
        discount_type: 'percentage',
        discount_value: 20,
        code: 'TEST20',
        coupon_type: 'overall'
      }
      setAppliedCoupon(testResult)
      setCouponError('')
      // Store applied coupon in localStorage
      localStorage.setItem('appliedCoupon', JSON.stringify(testResult))
      return
    }
    
    try {
      const result = await api.validateCoupon(couponCode.trim().toUpperCase())
      
      if (result.valid) {
        // Check coupon type applicability
        if (result.coupon_type === 'single') {
          const hasApplicableProducts = cartItems.some(item => 
            result.product_ids && result.product_ids.includes(item.id.toString())
          )
          if (!hasApplicableProducts) {
            setCouponError('This coupon is not applicable to any items in your cart')
            setAppliedCoupon(null)
            localStorage.removeItem('appliedCoupon')
            return
          }
        } else if (result.coupon_type === 'combo') {
          const hasComboProducts = cartItems.some(item => 
            result.combo_product_ids && result.combo_product_ids.includes(item.id.toString())
          )
          if (!hasComboProducts) {
            setCouponError('This coupon requires specific products to be in your cart')
            setAppliedCoupon(null)
            localStorage.removeItem('appliedCoupon')
            return
          }
        }
        
        setAppliedCoupon(result)
        setCouponError('')
        // Store applied coupon in localStorage
        localStorage.setItem('appliedCoupon', JSON.stringify(result))
      } else {
        setCouponError(result.error || 'Invalid coupon code')
        setAppliedCoupon(null)
        localStorage.removeItem('appliedCoupon')
      }
    } catch (error: any) {
      setCouponError(error.message || 'Failed to validate coupon. Please try again.')
      setAppliedCoupon(null)
      localStorage.removeItem('appliedCoupon')
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
    // Remove applied coupon from localStorage
    localStorage.removeItem('appliedCoupon')
  }

  const updateQuantity = (id: number, change: number) => {
    CartService.updateQuantity(id, change)
  }

  const removeItem = (id: number) => {
    CartService.removeItem(id)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const mrpTotal = cartItems.reduce((sum, item) => {
    const itemMrp = item.mrp || item.price;
    return sum + (itemMrp * item.quantity);
  }, 0)
  
  const shipping = 50 // Fixed shipping price as requested
  let discount = 0

  // Apply coupon discounts using the same logic as checkout
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discount = subtotal * (appliedCoupon.discount_value / 100)
    } else if (appliedCoupon.discount_type === 'flat') {
      discount = appliedCoupon.discount_value
    }
  }

  const total = subtotal + shipping - discount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage?.('shop')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            <span className="bg-black text-white px-3 py-1 rounded-full text-sm">
              {cartItems.length}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                <button 
                  onClick={() => setCurrentPage?.('shop')}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-gray-600 text-sm">
                              Size: {item.size} | Color: {item.color}
                            </p>
                          </div>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-gray-100 rounded transition"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-gray-100 rounded transition"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg text-black">₹{(item.price * item.quantity).toFixed(2)}</p>
                            <div className="flex items-center justify-end gap-2 text-gray-600 text-sm">
                              <span>₹{item.price}</span>
                              {item.mrp && item.mrp > item.price && (
                                <span className="line-through">₹{item.mrp.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              
              {/* Coupon Section - Move to top */}
              <div className="mb-6">
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <button
                        onClick={applyCoupon}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-500 text-sm">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {couponError ? (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-red-600 text-sm">{couponError}</p>
                        <button
                          onClick={() => {
                            setAppliedCoupon(null)
                            setCouponCode('')
                            setCouponError('')
                          }}
                          className="text-red-500 hover:text-red-700 text-sm mt-2"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-green-800 font-medium text-sm">{appliedCoupon.code}</p>
                            <p className="text-green-600 text-xs">
                              Coupon applied successfully! 
                              {appliedCoupon.discount_type === 'percentage' ? ` (${appliedCoupon.discount_value}% off)` : ` (₹${appliedCoupon.discount_value} off)`}
                            </p>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                {/* MRP Total */}
                <div className="flex justify-between">
                  <span className="text-gray-600">MRP Total</span>
                  <span className="text-black line-through">₹{mrpTotal.toFixed(2)}</span>
                </div>
                
                {/* Selling Price Total */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Selling Price</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                
                {/* Coupon Discount */}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Shipping */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>₹{shipping.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button onClick={() => { window.location.href = '/#checkout' }} className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition mb-3">
                Proceed to Checkout
              </button>
              
              <button 
                onClick={() => setCurrentPage?.('shop')}
                className="w-full border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
