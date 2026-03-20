import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import ProductService from '../services/productService'
import { type Product } from '../services/api'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect?: (productId: string) => void
}

export default function SearchModal({ isOpen, onClose, onProductSelect }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([])
        return
      }

      setIsLoading(true)
      try {
        const allProducts = await ProductService.getActiveProducts()
        // Apply image transformation to all products
        const transformedProducts = allProducts.map(product => 
          ProductService.transformProductImages(product)
        )
        const filtered = transformedProducts.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setSearchResults(filtered)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(handleSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleProductClick = (productId: string) => {
    onClose()
    onProductSelect?.(productId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl">
        {/* Search Header */}
        <div className="flex items-center border-b border-gray-200 px-4 py-3">
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 text-lg outline-none"
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : searchResults.length === 0 && searchQuery.trim().length > 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products found for "{searchQuery}"
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {searchResults.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="w-full px-4 py-3 flex items-center space-x-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {product.category}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{product.price}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
