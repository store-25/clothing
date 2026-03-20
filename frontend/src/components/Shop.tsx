import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import heroBg from '../assets/hero-bg.jpg'
import ProductService from '../services/productService'
import ProductCard from './ProductCard'

interface ShopProps {
  onProductSelect?: (productId: string) => void
}

export default function Shop({ onProductSelect }: ShopProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [selectedGender, setSelectedGender] = useState('All')
  const [sortBy, setSortBy] = useState('Featured')
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [urlParamsApplied, setUrlParamsApplied] = useState(false)
  const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest', 'Best Selling']

  useEffect(() => {
    loadCategories()
    loadProducts(true) // Initial load with URL parameter check
  }, []) // Empty dependency array - only run once on mount

  // Single effect to handle all filter changes - more efficient
  useEffect(() => {
    if (urlParamsApplied) {
      loadProducts(false)
    }
  }, [selectedCategory, selectedGender, sortBy])

  const loadCategories = async () => {
    try {
      const dynamicCategories = await ProductService.getCategories()
      setCategories(['All Products', ...dynamicCategories])
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories(['All Products']) // Fallback to just All Products
    }
  }

  const loadProducts = async (isInitialLoad = false) => {
    try {
      setLoading(true)
      let productsData: any[] = []

      // Only check URL parameters on initial load and if they haven't been applied yet
      if (isInitialLoad && !urlParamsApplied) {
        const urlParams = new URLSearchParams(window.location.search)
        const urlCategory = urlParams.get('category')
        const urlGender = urlParams.get('gender')
        const urlSort = urlParams.get('sort')

        if (urlCategory) {
          productsData = await ProductService.getProductsByCategory(urlCategory)
          setSelectedCategory(urlCategory)
        } else if (urlGender) {
          productsData = await ProductService.getActiveProducts()
          
          const genderMap = { 'men': 'Men', 'women': 'Women', 'unisex': 'Unisex' }
          const displayGender = genderMap[urlGender as keyof typeof genderMap] || 'Men'
          setSelectedGender(displayGender)
          
          const genderValueMap = { 'Men': 'male', 'Women': 'female', 'Unisex': 'unisex' }
          const genderValue = genderValueMap[displayGender as keyof typeof genderValueMap]
          productsData = productsData.filter(product => product.gender === genderValue)
        } else if (urlSort === 'new') {
          productsData = await ProductService.getActiveProducts()
          const sortedByDate = productsData.sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          ).reverse()
          setProducts(sortedByDate.map(product => 
            ProductService.transformProductForDisplay(product)
          ))
          setSortBy('Newest')
          setUrlParamsApplied(true)
          setLoading(false)
          return
        } else {
          productsData = await ProductService.getActiveProducts()
          setSelectedCategory('All Products')
          setSelectedGender('All')
        }
        
        setUrlParamsApplied(true)
      } else {
        // Normal flow - use selected state
        if (selectedCategory === 'All Products') {
          productsData = await ProductService.getActiveProducts()
        } else {
          productsData = await ProductService.getProductsByCategory(selectedCategory)
        }

        // Apply gender filter
        if (selectedGender !== 'All') {
          const genderMap = { 'Men': 'male', 'Women': 'female', 'Unisex': 'unisex' }
          const genderValue = genderMap[selectedGender as keyof typeof genderMap]
          productsData = productsData.filter(product => product.gender === genderValue)
        }

        // Apply sorting
        productsData = sortProducts(productsData, sortBy)

        const transformedProducts = productsData.map(product =>
          ProductService.transformProductForDisplay(product)
        )
        setProducts(transformedProducts)
        setLoading(false)
        return
      }

      // Apply sorting for category and gender cases
      productsData = sortProducts(productsData, sortBy)

      const transformedProducts = productsData.map(product =>
        ProductService.transformProductForDisplay(product)
      )
      setProducts(transformedProducts)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortProducts = (products: any[], sortBy: string) => {
    const sorted = [...products]
    switch (sortBy) {
      case 'Price: Low to High':
        return sorted.sort((a, b) => a.price - b.price)
      case 'Price: High to Low':
        return sorted.sort((a, b) => b.price - a.price)
      case 'Newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      case 'Best Selling':
        return sorted.slice(0, 3) // Mock best selling
      default:
        return sorted
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner with Radial Gradient */}
      <div className="relative h-96 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, transparent 1%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,1)), url(${heroBg})`,
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
            backgroundBlendMode: 'normal',
          }}
        />
        <div className="relative h-full flex flex-col items-center justify-center text-white">
          <h1 className="text-5xl md:text-6xl font-black mb-4">SHOP ALL</h1>
          <p className="text-lg tracking-wider">{products.length} products</p>
        </div>
      </div>

      {/* Shop Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 uppercase tracking-wider">CATEGORY</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`block w-full text-left px-4 py-2 transition-colors ${selectedCategory === category
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-100'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 uppercase tracking-wider">GENDER</h3>
              <div className="space-y-2">
                {['All', 'Men', 'Women', 'Unisex'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={`block w-full text-left px-4 py-2 transition-colors ${selectedGender === gender ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="flex justify-between items-center mb-8">
              <p className="text-gray-600">Showing {products.length} products</p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:border-black"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-gray-200 rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    image={product.image}
                    images={product.images}
                    name={product.name}
                    price={product.price}
                    mrp={product.mrp}
                    colors={product.colors}
                    sizes={product.sizes}
                    onProductClick={() => {
                      if (onProductSelect) {
                        onProductSelect(product.id)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
