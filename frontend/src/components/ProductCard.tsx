import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import CartService from '../services/cartService'

interface ProductCardProps {
  id: string
  image: string
  images?: Array<{url: string, alt: string, isPrimary: boolean}>
  name: string
  price: number
  mrp?: number
  colors: string[]
  sizes?: string[]
  onProductClick?: () => void
}

export default function ProductCard({
  id,
  image,
  images,
  name,
  price,
  mrp,
  colors,
  sizes = [],
  onProductClick,
}: ProductCardProps) {
  const [cartQuantity, setCartQuantity] = useState(0)
  const [isAdded, setIsAdded] = useState(false)
  const [showGreenFeedback, setShowGreenFeedback] = useState(false)

  // Helper function to get correct image URL
  const getImageDisplayUrl = () => {
    if (images && images.length > 0) {
      const primaryImage = images.find(img => img.isPrimary) || images[0]
      return primaryImage.url.startsWith('data:') || primaryImage.url.startsWith('http') 
        ? primaryImage.url 
        : `http://localhost:5001${primaryImage.url}`
    }
    // Fallback to single image property
    return image.startsWith('data:') || image.startsWith('http') 
      ? image 
      : `http://localhost:5001${image}`
  }

  // Check if product is in cart and get quantity
  useEffect(() => {
    const checkCartStatus = () => {
      const cartItems = CartService.getCartItems()
      const existingItem = cartItems.find(item => 
        item.name === name && 
        item.size === (sizes[0] || 'M') &&
        item.color === (colors[0] || 'Black')
      )
      
      if (existingItem) {
        setCartQuantity(existingItem.quantity)
        setIsAdded(true)
      } else {
        setCartQuantity(0)
        setIsAdded(false)
      }
    }

    // Initial check
    checkCartStatus()

    // Listen for cart updates
    const handleCartUpdate = () => {
      checkCartStatus()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [name, sizes, colors])

  const handleAddToCart = () => {
    const product = {
      id: id || Date.now().toString(),
      name,
      price,
      mrp: mrp || price,
      quantity: 1,
      size: sizes[0] || 'M',
      color: colors[0] || 'Black',
      image
    }
    
    CartService.addToCart(product)
    
    // Show green feedback
    setShowGreenFeedback(true)
    setTimeout(() => setShowGreenFeedback(false), 1000)
    
    // Don't update local state here - let the cartUpdated event handle it
  }

  const handleIncreaseQuantity = () => {
    // Find the cart item and update its quantity
    const cartItems = CartService.getCartItems()
    const existingItem = cartItems.find(item => 
      item.name === name && 
      item.size === (sizes[0] || 'M') &&
      item.color === (colors[0] || 'Black')
    )
    
    if (existingItem) {
      CartService.updateQuantity(existingItem.id, 1)
    }
  }

  const handleDecreaseQuantity = () => {
    // Find the cart item and update its quantity
    const cartItems = CartService.getCartItems()
    const existingItem = cartItems.find(item => 
      item.name === name && 
      item.size === (sizes[0] || 'M') &&
      item.color === (colors[0] || 'Black')
    )
    
    if (existingItem) {
      if (existingItem.quantity > 1) {
        CartService.updateQuantity(existingItem.id, -1)
      } else {
        // Remove item completely when quantity reaches 0
        CartService.removeItem(existingItem.id)
      }
    }
  }

  return (
    <div className="group bg-white rounded-lg overflow-hidden">
      {/* Image Container - Clickable */}
      <div 
        onClick={onProductClick}
        className="relative bg-gray-200 aspect-square overflow-hidden cursor-pointer group"
      >
        <div
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          style={{
            backgroundImage: `url(${getImageDisplayUrl()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

      </div>

      {/* Product Info Container */}
      <div className="p-3 md:p-4">
        {/* Product Name */}
        <h3 className="text-xs md:text-sm font-semibold mb-2 leading-tight line-clamp-2">{name}</h3>

        {/* Size Options */}
        {sizes && sizes.length > 0 && (
          <div className="flex gap-1.5 mb-2">
            {sizes.map((size, idx) => (
              <div
                key={idx}
                className="px-2 py-1 text-xs border border-gray-300 hover:border-black transition cursor-pointer"
              >
                {size}
              </div>
            ))}
          </div>
        )}

        {/* Color Options */}
        <div className="flex gap-1.5 mb-3">
          {colors.map((color, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full border-2 border-gray-300 hover:border-black cursor-pointer transition"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Pricing */}
        <div className="flex gap-2 mb-3">
          <span className="font-semibold text-black text-sm">₹{price.toFixed(2)}</span>
          {mrp && mrp > price && (
            <span className="text-gray-400 line-through text-sm">₹{mrp.toFixed(2)}</span>
          )}
        </div>

        {/* Quantity Controls or Add to Cart Button */}
        {isAdded && cartQuantity > 0 ? (
          /* Quantity Controls */
          <div className="flex items-center justify-center gap-3 bg-gray-100 rounded-lg p-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDecreaseQuantity()
              }}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <Minus size={14} />
            </button>
            <span className="font-medium text-sm min-w-[40px] text-center">
              {cartQuantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleIncreaseQuantity()
              }}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          /* Add to Cart Button */
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAddToCart()
            }}
            className={`w-full py-2 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              showGreenFeedback
                ? 'bg-green-600 text-white'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <ShoppingCart size={14} />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
