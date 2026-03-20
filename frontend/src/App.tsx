import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import HeroCarousel from './components/HeroCarousel'
import Marquee from './components/Marquee'
import Shop from './components/Shop'
import Cart from './components/Cart'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import ProductManagement from './admin/ProductManagement'
import AdminOrders from './admin/AdminOrders'
import AdminCoupons from './admin/AdminCoupons'
import Checkout from './components/Checkout'
import CategoryShowcase from './components/CategoryShowcase'
import Footer from './components/Footer'
import ProductDetail from './components/ProductDetail'
import CartService from './services/cartService'

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Page to URL mapping
  const pageToUrl = {
    'home': '/',
    'shop': '/shop',
    'cart': '/cart',
    'checkout': '/checkout',
    'product-detail': '/product',
    'admin-login': '/admin/login',
    'admin-dashboard': '/admin/dashboard',
    'admin-product-management': '/admin/products',
    'admin-orders': '/admin/orders',
    'admin-coupons': '/admin/coupons'
  }

  // URL to page mapping
  const urlToPage = {
    '/': 'home',
    '/shop': 'shop',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/product': 'product-detail',
    '/admin/login': 'admin-login',
    '/admin/dashboard': 'admin-dashboard',
    '/admin/products': 'admin-product-management',
    '/admin/orders': 'admin-orders',
    '/admin/coupons': 'admin-coupons'
  }

  // Update URL when page changes
  useEffect(() => {
    const url = pageToUrl[currentPage as keyof typeof pageToUrl]
    console.log('🔄 Page change:', {
      currentPage,
      url,
      currentPath: window.location.pathname
    })
    
    if (url && window.location.pathname !== url) {
      console.log('📝 Updating URL:', window.location.pathname, '→', url)
      window.history.replaceState({ page: currentPage }, '', url)
    }
  }, [currentPage])

  // Initialize cart on app load
  useEffect(() => {
    CartService.initializeCart()
  }, [])

  // Handle browser back/forward and initial page load
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname
      const page = urlToPage[path as keyof typeof urlToPage]
      const isAuthenticated = localStorage.getItem('adminAuthenticated')
      
      console.log('🔄 PopState event:', {
        path,
        page,
        state: event.state,
        isAuthenticated
      })
      
      // Prevent navigation away from admin dashboard when authenticated
      if (isAuthenticated && !page?.startsWith('admin-')) {
        console.log('🚫 Admin dashboard lock: Blocking back navigation to non-admin page:', page)
        // Push back to admin dashboard
        window.history.pushState({ page: 'admin-dashboard' }, '', '/admin/dashboard')
        setCurrentPage('admin-dashboard')
        return
      }
      
      if (event.state?.page) {
        setCurrentPage(event.state.page)
        
        // Handle product detail navigation with ID
        if (event.state.page === 'product-detail' && event.state.productId) {
          setSelectedProductId(event.state.productId)
        }
      } else {
        // Handle direct URL access or browser navigation
        if (!page) {
          // Default to home page
          setCurrentPage('home')
          window.history.replaceState({ page: 'home' }, '/')
          return
        }
        
        // Only allow navigation to admin pages when authenticated
        const isAuthenticated = localStorage.getItem('adminAuthenticated')
        if (isAuthenticated && !page?.startsWith('admin-')) {
          console.log('🚫 Blocking navigation to non-admin page')
          window.history.pushState({ page: 'admin-dashboard' }, '', '/admin/dashboard')
          setCurrentPage('admin-dashboard')
        } else {
          setCurrentPage(page)
          window.history.replaceState({ page }, path)
        }
      }
    }

    // Handle initial page load and refresh
    const path = window.location.pathname
    let page = urlToPage[path as keyof typeof urlToPage]
    
    // Handle product detail URLs with ID
    if (path.startsWith('/product/')) {
      const productId = path.split('/')[2]
      if (productId) {
        setSelectedProductId(productId)
        page = 'product-detail'
      }
    }
    
    const isAuthenticated = localStorage.getItem('adminAuthenticated')
    
    console.log('🚀 Initial page load:', {
      path,
      page,
      currentPage,
      isAuthenticated
    })
    
    // Check if admin is authenticated and redirect to dashboard if needed
    if (isAuthenticated && !page?.startsWith('admin-')) {
      console.log('🔐 Admin authenticated, redirecting to dashboard')
      window.history.replaceState({ page: 'admin-dashboard' }, '', '/admin/dashboard')
      setCurrentPage('admin-dashboard')
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
    
    // Check authentication for admin pages
    const isAdminPage = page?.startsWith('admin-')
    
    console.log('🔐 Auth check:', {
      isAdminPage,
      isAuthenticated,
      page
    })
    
    // For admin login page, allow access if not authenticated, otherwise redirect to dashboard
    if (page === 'admin-login') {
      if (isAuthenticated) {
        console.log('🔓 Admin already authenticated, redirecting to dashboard')
        window.history.replaceState({ page: 'admin-dashboard' }, '', '/admin/dashboard')
        setCurrentPage('admin-dashboard')
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
      }
    }
    
    // For other admin pages, redirect to login if not authenticated
    if (isAdminPage && page !== 'admin-login' && !isAuthenticated) {
      console.log('🔓 Redirecting admin page to login (not authenticated)')
      window.history.replaceState({ page: 'admin-login' }, '', '/admin/login')
      setCurrentPage('admin-login')
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
    
    // For other pages, set the page from URL
    if (page) {
      console.log('📄 Setting page from URL:', page)
      setCurrentPage(page)
      window.history.replaceState({ page }, path)
    } else {
      // If no matching page, default to shop instead of home when coming from product detail
      const referrer = document.referrer
      const isFromProductDetail = referrer.includes('/product/') || currentPage === 'product-detail'
      
      if (isFromProductDetail) {
        console.log('🛒 Coming from product detail, defaulting to shop instead of home')
        setCurrentPage('shop')
        window.history.replaceState({ page: 'shop' }, '/shop')
      } else {
        // Otherwise default to home
        console.log('🏠 Defaulting to home (no matching page)')
        setCurrentPage('home')
        window.history.replaceState({ page: 'home' }, '/')
      }
    }

    // Support deep-linking to checkout via #checkout
    if (window.location.hash === '#checkout') {
      console.log('🛒 Checkout hash detected')
      setCurrentPage('checkout')
      window.history.replaceState({ page: 'checkout' }, '/checkout')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // Run only once on mount

  const navigateToPage = (page: string) => {
    // Check if admin is authenticated and trying to navigate away from admin pages
    const isAuthenticated = localStorage.getItem('adminAuthenticated')
    
    if (isAuthenticated && !page.startsWith('admin-')) {
      console.log('🚫 Admin dashboard lock: Blocking navigation to non-admin page:', page)
      // Don't allow navigation away from admin dashboard when authenticated
      return
    }
    
    setCurrentPage(page)
    
    // Update browser URL for proper navigation
    if (page === 'shop') {
      window.history.pushState({ page }, '/shop')
    } else if (page === 'product-detail') {
      window.history.pushState({ page }, `/product/${selectedProductId}`)
    } else if (page === 'cart') {
      window.history.pushState({ page }, '/cart')
    } else if (page === 'checkout') {
      window.history.pushState({ page }, '/checkout')
    } else if (page === 'admin-login') {
      window.history.pushState({ page }, '/admin')
    } else if (page.startsWith('admin-')) {
      window.history.pushState({ page }, `/admin/${page.replace('admin-', '')}`)
    } else {
      window.history.pushState({ page }, '/')
    }
  }

  const navigateToProductDetail = (productId: string) => {
    setSelectedProductId(productId)
    setCurrentPage('product-detail')
    // Update URL to reflect the product detail page
    window.history.pushState({ page: 'product-detail', productId }, `/product/${productId}`)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (currentPage === 'shop') {
    return (
      <main className="bg-white">
        <Navbar currentPage={currentPage} setCurrentPage={navigateToPage} onProductSelect={navigateToProductDetail} />
        <Shop onProductSelect={navigateToProductDetail} />
        <Footer />
      </main>
    )
  }

  if (currentPage === 'cart') {
    return (
      <main className="bg-gray-50">
        <Cart setCurrentPage={navigateToPage} />
      </main>
    )
  }

  if (currentPage === 'admin-login') {
    return (
      <main className="bg-black text-white min-h-screen flex items-center justify-center">
        <AdminLogin setCurrentPage={navigateToPage} />
      </main>
    )
  }

  if (currentPage === 'admin-dashboard') {
    return (
      <main className="bg-gray-50">
        <AdminDashboard setCurrentPage={navigateToPage} />
      </main>
    )
  }

  if (currentPage === 'product-detail') {
    return (
      <main className="bg-gray-50">
        <ProductDetail 
          productId={selectedProductId || '1'} 
          onBack={() => navigateToPage('shop')}
          setCurrentPage={navigateToPage}
          onProductSelect={navigateToProductDetail}
        />
      </main>
    )
  }

  if (currentPage === 'admin-product-management') {
    return (
      <main className="bg-gray-50">
        <ProductManagement setCurrentPage={navigateToPage} />
      </main>
    )
  }

  if (currentPage === 'admin-orders') {
    return (
      <main className="bg-gray-50">
        <AdminOrders setCurrentPage={navigateToPage} />
      </main>
    )
  }

  if (currentPage === 'admin-coupons') {
    return (
      <main className="bg-gray-50">
        <AdminCoupons setCurrentPage={navigateToPage} />
      </main>
    )
  }

  if (currentPage === 'checkout') {
    return (
      <main className="bg-gray-50">
        <Checkout setCurrentPage={navigateToPage} />
      </main>
    )
  }


  return (
    <main className="bg-white">
      <Navbar currentPage={currentPage} setCurrentPage={navigateToPage} onProductSelect={navigateToProductDetail} />
      <div className="pt-12 md:pt-16">
        <Marquee />
        <HeroCarousel scrollToSection={scrollToSection} />
        <CategoryShowcase setCurrentPage={navigateToPage} />
        <Footer />
      </div>
    </main>
  )
}
