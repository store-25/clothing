import { useState } from 'react'
import menImage from '../assets/men-poster.jpg'
import womenImage from '../assets/female-poster.jpg'
import newInImage from '../assets/3.png'

interface CategoryShowcaseProps {
  setCurrentPage?: (page: string) => void
}

export default function CategoryShowcase({ setCurrentPage }: CategoryShowcaseProps = {}) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const categories = [
    {
      id: 'men',
      title: 'MEN',
      bgImage: menImage,
      bgColor: 'bg-black',
      hoverEffect: 'hover:opacity-90'
    },
    {
      id: 'women',
      title: 'WOMEN',
      bgImage: womenImage,
      bgColor: 'bg-black',
      hoverEffect: 'hover:opacity-90'
    },
    {
      id: 'new',
      title: 'NEW IN',
      bgImage: newInImage,
      bgColor: 'bg-gray-900',
      hoverEffect: 'hover:opacity-90'
    }
  ]

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to shop page with gender filter using the app's navigation system
    if (categoryId === 'men') {
      // Set shop page and let Shop component handle the gender parameter
      setCurrentPage?.('shop')
      // Update URL to include gender parameter
      window.history.pushState({ page: 'shop' }, '', '/shop?gender=men')
    } else if (categoryId === 'women') {
      // Set shop page and let Shop component handle the gender parameter
      setCurrentPage?.('shop')
      // Update URL to include gender parameter
      window.history.pushState({ page: 'shop' }, '', '/shop?gender=women')
    } else if (categoryId === 'new') {
      // For NEW IN, show all products with gender filter set to All
      setCurrentPage?.('shop')
      // Update URL to show all products
      window.history.pushState({ page: 'shop' }, '', '/shop')
    } else {
      // For other categories, use the normal navigation
      setCurrentPage?.('shop')
      // Update URL to include category parameter
      window.history.pushState({ page: 'shop' }, '', `/shop?category=${categoryId}`)
    }
  }

  return (
    <section className="w-full bg-white py-8 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Layout: Men & Women side by side, New In below */}
        <div className="lg:hidden">
          {/* Men & Women side by side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {categories.filter(cat => cat.id === 'men' || cat.id === 'women').map((category) => (
              <button
                key={category.id}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${category.hoverEffect} rounded-lg shadow-lg aspect-square focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                onClick={() => handleCategoryClick(category.id)}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Background with gradient overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${category.bgImage})` }}
                />
                {/* Darker overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                {/* Content positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                      {category.title}
                    </h2>
                    {hoveredCategory === category.id && (
                      <div className="transition-all duration-300 ease-out">
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* New In below */}
          <button
            className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:opacity-90 rounded-lg shadow-lg h-48 w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            onClick={() => handleCategoryClick('new')}
            onMouseEnter={() => setHoveredCategory('new')}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${categories.find(cat => cat.id === 'new')?.bgImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                  NEW IN
                </h2>
              </div>
            </div>
          </button>
        </div>

        {/* Desktop Layout: All three side by side */}
        <div className="hidden lg:flex lg:flex-row gap-8 h-[500px]">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`flex-1 relative overflow-hidden cursor-pointer transition-all duration-300 ${category.hoverEffect} rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Background with gradient overlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${category.bgImage})` }}
              />
              {/* Darker overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Content positioned at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
                    {category.title}
                  </h2>
                  {hoveredCategory === category.id && (
                    <div className="transition-all duration-300 ease-out">
                      {/* Removed Shop Now button */}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
