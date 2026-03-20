import { useState, useEffect, useRef } from 'react'
import { Search, ShoppingBag, Menu, X } from 'lucide-react'
import SearchModal from './SearchModal'
import { useCart } from '../hooks/useCart'


interface NavbarProps {
  currentPage?: string
  setCurrentPage?: (page: string) => void
  onProductSelect?: (productId: string) => void
}

export default function Navbar({ currentPage = 'home', setCurrentPage, onProductSelect }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { cartCount } = useCart()
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      setScrolled(isScrolled)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Handle logo click for admin access
  const handleLogoClick = () => {
    const newClickCount = logoClicks + 1
    setLogoClicks(newClickCount)
    
    // Reset clicks after 2 seconds
    setTimeout(() => {
      setLogoClicks(0)
    }, 2000)
    
    // Open admin panel after 5 clicks
    if (newClickCount === 5) {
      setCurrentPage?.('admin-login')
      setLogoClicks(0)
    }
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-transparent backdrop-blur-md' 
          : 'bg-black'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 md:py-4">
          <div className="flex justify-between items-center">
            {/* Mobile header */}
            <div className="md:hidden flex items-center justify-between w-full">
              {/* STORE25 Brand */}
              <button
                onClick={handleLogoClick}
                className={`text-lg md:text-2xl font-bold tracking-[0.2em] hover:opacity-80 transition cursor-pointer ${
                  scrolled ? 'text-black' : 'text-white'
                }`}
              >
                <span className="text-lg">
                  STORE<span className="text-2xl font-bold">25</span>
                </span>
              </button>
              
              {/* Right side icons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className={`hover:opacity-80 transition ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  <Search size={18} />
                </button>
                <button 
                  onClick={() => setCurrentPage?.('cart')}
                  className={`hover:opacity-80 transition relative ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  <ShoppingBag size={18} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`hover:opacity-80 transition ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
            
            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between w-full">
              {/* STORE25 Brand Name - Desktop */}
              <div className="flex items-center">
                <button
                  onClick={handleLogoClick}
                  className={`text-lg md:text-2xl font-bold tracking-[0.2em] md:tracking-[0.3em] hover:opacity-80 transition cursor-pointer ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  <span className="text-lg md:text-2xl">
                    STORE<span className="text-2xl md:text-3xl font-bold">25</span>
                  </span>
                </button>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-16">
                <a 
                  href="#" 
                  onClick={() => setCurrentPage?.('home')}
                  className={`text-sm font-light tracking-[0.15em] hover:opacity-80 transition ${
                    currentPage === 'home' ? 'opacity-100' : 'opacity-70'
                  } ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  HOME
                </a>
                <a 
                  href="#" 
                  onClick={() => setCurrentPage?.('shop')}
                  className={`text-sm font-light tracking-[0.15em] hover:opacity-80 transition ${
                    currentPage === 'shop' ? 'opacity-100' : 'opacity-70'
                  } ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  SHOP
                </a>
              </div>

              {/* Desktop Actions - Icons */}
              <div className="hidden md:flex items-center space-x-8">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className={`hover:opacity-80 transition ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  <Search size={18} />
                </button>
                <button 
                  onClick={() => setCurrentPage?.('cart')}
                  className={`hover:opacity-80 transition relative ${
                    scrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  <ShoppingBag size={18} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div ref={menuRef} className="md:hidden bg-black bg-opacity-90 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a 
                href="#" 
                onClick={() => setCurrentPage?.('home')}
                className="text-white hover:text-gray-300 block px-3 py-2 text-sm font-light tracking-[0.15em]"
              >
                HOME
              </a>
              <a 
                href="#" 
                onClick={() => setCurrentPage?.('shop')}
                className="text-white hover:text-gray-300 block px-3 py-2 text-sm font-light tracking-[0.15em]"
              >
                SHOP
              </a>
            </div>
          </div>
        )}

        {/* Search Modal */}
        <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onProductSelect={onProductSelect}
        />
      </nav>
    </>
  )
}
