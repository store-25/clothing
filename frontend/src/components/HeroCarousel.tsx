import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import image1 from '../assets/1.png'
import image2 from '../assets/2.png'
import image3 from '../assets/3.png'
import image4 from '../assets/4.png'

interface HeroCarouselProps {
  scrollToSection?: (sectionId: string) => void
}

export default function HeroCarousel({ scrollToSection }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 1,
      image: image1,
      title: 'NEW ARRIVALS',
      subtitle: 'Check out our latest collection'
    },
    {
      id: 2,
      image: image2,
      title: 'TRENDING NOW',
      subtitle: 'Discover the hottest styles'
    },
    {
      id: 3,
      image: image3,
      title: 'EXCLUSIVE COLLECTION',
      subtitle: 'Limited edition pieces'
    },
    {
      id: 4,
      image: image4,
      title: 'STREETWEAR ESSENTIALS',
      subtitle: 'Upgrade your wardrobe'
    }
  ]

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [slides.length])

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleShopNowClick = () => {
    scrollToSection?.('best-sellers')
  }

  return (
    <section className="relative bg-grey-600 text-white overflow-hidden h-[60vh] md:h-screen">
      {/* Image Carousel */}
      <div className="relative h-full">
        {/* Slides */}
        <div className="relative h-full overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-30" />
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-full hover:bg-opacity-30 transition-all duration-300 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-full hover:bg-opacity-30 transition-all duration-300 z-10"
          aria-label="Next slide"
        >
          <ChevronRight size={24} className="text-white" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center z-10">
          <div className="text-center px-4">
            {/* Dynamic content based on current slide */}
            <div className="transition-all duration-500 ease-in-out">
              <h1 className="text-4xl md:text-7xl font-bold mb-6">
                {slides[currentSlide].title}
              </h1>
              <p className="text-lg md:text-2xl mb-8 max-w-2xl mx-auto">
                {slides[currentSlide].subtitle}
              </p>
              <button 
                onClick={handleShopNowClick}
                className="bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-gray-100 transition-colors"
              >
                SHOP NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
