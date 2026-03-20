import { useState, useEffect } from 'react'
import { ArrowLeft, ShoppingCart, Heart } from 'lucide-react'
import CartService from '../services/cartService'
import ProductService from '../services/productService'
import { type Product } from '../services/api'
import { useCart } from '../hooks/useCart'
import ProductCard from './ProductCard'

interface ProductDetailProps {
  productId: string
  onBack: () => void
  setCurrentPage?: (page: string) => void
  onProductSelect?: (productId: string) => void
}

export default function ProductDetail({ productId, onBack, setCurrentPage, onProductSelect }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('M')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const { cartCount } = useCart()

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        
        // Try to get product from API first
        let foundProduct = await ProductService.getProductById(productId)
        
        // Apply transformation to handle base64 images correctly
        if (foundProduct) {
          foundProduct = ProductService.transformProductImages(foundProduct)
        }
        
        setProduct(foundProduct || null)
        
        // Set default selections
        if (foundProduct) {
          setSelectedSize(foundProduct.sizes[0] || 'M')
          setSelectedColor(foundProduct.colors[0] || '')
          
          // Load suggested products
          await loadSuggestedProducts(foundProduct)
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading product:', err)
        setLoading(false)
      }
    }

    const loadSuggestedProducts = async (currentProduct: Product) => {
      try {
        // Get products from API
        let allProducts = await ProductService.getActiveProducts()
        
        // If no products found, return empty suggestions
        if (!allProducts || allProducts.length === 0) {
          setSuggestedProducts([])
          return
        }
        
        // Filter out current product and get suggestions
        const suggestions = allProducts
          .filter((p: Product) => p._id !== currentProduct._id && p.status === 'active')
          .filter((p: Product) => {
            // Priority 1: Same category
            if (p.category === currentProduct.category) return true
            // Priority 2: Same gender
            if (p.gender === currentProduct.gender) return true
            // Priority 3: Unisex items
            if (p.gender === 'unisex' || currentProduct.gender === 'unisex') return true
            return false
          })
          .slice(0, 4) // Limit to 4 suggestions
        
        console.log('🔍 Suggested products for', currentProduct.name, ':', suggestions.map(s => ({ name: s.name, category: s.category, gender: s.gender })))
        setSuggestedProducts(suggestions)
      } catch (err) {
        console.error('Error loading suggested products:', err)
      }
    }

    loadProduct()
  }, [productId])

  const addToCart = () => {
    if (!product) return
    
    try {
      // Debug: Log the actual product data including MRP
      console.log('Product being added to cart:', {
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        fullProduct: product
      });
      
      const productToAdd = {
        id: parseInt(product._id),
        name: product.name,
        price: product.price,
        mrp: product.mrp || product.price,
        quantity,
        size: selectedSize,
        color: selectedColor,
        image: product.image
      }
      
      console.log('Product to add to cart:', productToAdd);
      CartService.addToCart(productToAdd)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (err) {
      console.error('Failed to add to cart', err)
    }
  }

  // Helper function to get the correct image URL
  const getImageUrl = (product: Product) => {
    let imageUrl = 'https://store25-0ven.onrender.com/api/placeholder-product.jpg'
    
    // Check if product has images array with primary image
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
      imageUrl = primaryImage.url.startsWith('data:') || primaryImage.url.startsWith('http') 
        ? primaryImage.url 
        : `https://store25-0ven.onrender.com${primaryImage.url}`
    }
    // Fallback to single image property
    else if (product.image) {
      imageUrl = product.image.startsWith('data:') || product.image.startsWith('http') 
        ? product.image 
        : `https://store25-0ven.onrender.com${product.image}`
    }
    
    console.log('🖼️ Image URL for', product.name, ':', imageUrl)
    return imageUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={onBack}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Heart size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage?.('cart')}
                className="p-2 hover:bg-gray-100 rounded-lg transition relative"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={product.images && product.images.length > 0 
                  ? getImageUrl(product) 
                  : getImageUrl(product)
                }
                alt={product.name}
                className="w-full h-[600px] object-cover"
              />
            </div>
            
            {/* Additional Images Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`bg-gray-200 rounded aspect-square overflow-hidden cursor-pointer border-2 ${
                      selectedImageIndex === index ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image.url.startsWith('data:') || image.url.startsWith('http') ? image.url : `https://store25-0ven.onrender.com${image.url}`}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Title & Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                {product.mrp && product.mrp > product.price && (
                  <span className="text-xl text-gray-500 line-through">₹{product.mrp.toFixed(2)}</span>
                )}
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                  </span>
                )}
              </div>
              
              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4">
                {product.stock && product.stock > 0 ? (
                  <>
                    <div className={`px-3 py-1 text-sm rounded-full ${
                      product.stock > 20 ? 'bg-green-100 text-green-800' :
                      product.stock > 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock > 20 ? 'In Stock' : 
                       product.stock > 10 ? 'Low Stock' : 'Very Low Stock'}
                    </div>
                    <span className="text-sm text-gray-600">{product.stock} units available</span>
                  </>
                ) : (
                  <div className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800">
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded-lg transition ${
                      selectedSize === size
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      selectedColor === color
                        ? 'border-black ring-2 ring-offset-2'
                        : 'border-gray-300 hover:border-black'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-black flex items-center justify-center transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-black flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={addToCart}
              disabled={!product.stock || product.stock <= 0}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-3 ${
                !product.stock || product.stock <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : addedToCart
                  ? 'bg-green-600 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              <ShoppingCart size={20} />
              {addedToCart ? 'Added to Cart!' : 
               !product.stock || product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Suggested Items Section */}
        {suggestedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedProducts.slice(0, 4).map((suggestedProduct) => (
                <ProductCard
                  key={suggestedProduct._id}
                  id={suggestedProduct._id}
                  name={suggestedProduct.name}
                  price={suggestedProduct.price}
                  mrp={suggestedProduct.mrp}
                  image={getImageUrl(suggestedProduct)}
                  images={suggestedProduct.images}
                  colors={suggestedProduct.colors}
                  sizes={suggestedProduct.sizes}
                  onProductClick={() => {
                    // Navigate to the suggested product using the correct navigation pattern
                    if (onProductSelect) {
                      onProductSelect(suggestedProduct._id)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
