import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { api } from '../services/api'

interface AdminCouponsProps {
  setCurrentPage?: (page: string) => void
}

export default function AdminCoupons({ setCurrentPage }: AdminCouponsProps) {
  // Helper function to format date as dd/mm/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [coupons, setCoupons] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [emailNotificationStatus, setEmailNotificationStatus] = useState('')
  const [form, setForm] = useState({ 
    code: '', 
    discount_type: 'percentage', 
    discount_value: '', 
    start_date: '', 
    expiry_date: '',
    coupon_type: 'overall',
    product_ids: [] as string[],
    combo_product_ids: [] as string[],
    affiliateEmail: '' // Add affiliate email field
  })

  // Cache for products to avoid redundant API calls
  const [productsCache, setProductsCache] = useState<any[] | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const loadCoupons = async () => {
    try {
      console.log('📋 Loading coupons...');
      const data = await api.getCoupons()
      console.log('📊 Loaded', data?.length || 0, 'coupons');
      setCoupons(data || [])
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Failed to load coupons:', err)
      setCoupons([])
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    // Implement simple caching with 5-minute TTL
    const now = Date.now()
    const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
    
    // Return cached data if still valid
    if (productsCache && (now - lastFetchTime < CACHE_TTL)) {
      console.log('📦 Using cached products data')
      setProducts(productsCache)
      return
    }
    
    try {
      setLoading(true)
      const data = await api.getProducts()
      const productsData = data || []
      setProducts(productsData)
      setProductsCache(productsData)
      setLastFetchTime(now)
      console.log('🔄 Products data loaded and cached:', productsData.length, 'products')
    } catch (err: any) {
      console.error('Failed to load products:', err)
      setProducts([])
      setProductsCache(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    // Load products once on mount and cache them
    const initializeData = async () => {
      setLoading(true)
      await Promise.all([
        loadProducts(),
        loadCoupons()
      ])
    }
    initializeData()
  }, [])

  
  const handleCreate = async () => {
    // Clear previous messages
    setErrorMessage('')
    setSuccessMessage('')
    
    // Validate all fields
    if (!form.code.trim() || !form.discount_value || !form.start_date || !form.expiry_date || !form.affiliateEmail) {
      setErrorMessage('All fields are mandatory, including affiliate email')
      return
    }
    
    // Validate based on coupon type
    if (form.coupon_type === 'single' && (!form.product_ids || form.product_ids.length === 0)) {
      setErrorMessage('Please select at least one product for single product coupon')
      return
    }
    
    if (form.coupon_type === 'combo' && (!form.combo_product_ids || form.combo_product_ids.length === 0)) {
      setErrorMessage('Please select products for combo offer')
      return
    }
    
    if (form.coupon_type === 'combo' && form.combo_product_ids.length > 2) {
      setErrorMessage('Maximum 2 products allowed for combo offer')
      return
    }
    
    // Validate dates
    const startDate = new Date(form.start_date)
    const expiryDate = new Date(form.expiry_date)
    
    if (expiryDate <= startDate) {
      setErrorMessage('Expiry date must be after start date')
      return
    }
    
    // Validate affiliate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.affiliateEmail)) {
      setErrorMessage('Please enter a valid affiliate email address')
      return
    }
    
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discount_value: Number(form.discount_value),
        start_date: startDate,
        expiry_date: expiryDate,
        product_ids: form.coupon_type === 'single' ? form.product_ids : [],
        combo_product_ids: form.coupon_type === 'combo' ? form.combo_product_ids : [],
        affiliateEmail: form.affiliateEmail.toLowerCase().trim()
      }
      await api.createCoupon(payload)
      
      // Reload coupons list to show the new coupon
      await loadCoupons()
      
      setForm({ 
        code: '', 
        discount_type: 'percentage', 
        discount_value: '', 
        start_date: '', 
        expiry_date: '',
        coupon_type: 'overall',
        product_ids: [],
        combo_product_ids: [],
        affiliateEmail: ''
      })
      setSuccessMessage('Coupon created successfully! Email notification sent to affiliate.')
      setEmailNotificationStatus('Email sent to ' + form.affiliateEmail)
      setTimeout(() => {
        setSuccessMessage('')
        setEmailNotificationStatus('')
      }, 5000)
    } catch (err: any) {
      console.error('Failed to create coupon:', err)
      
      // Show specific error message from API if available
      if (err.error) {
        setErrorMessage(err.error)
      } else if (err.message) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Failed to create coupon. Please try again.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete coupon?')) return
    try {
      await api.deleteCoupon(id)
      loadCoupons()
    } catch (err: any) {
      console.error('Failed to delete coupon:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage?.('admin-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            <div className="font-medium">{successMessage}</div>
            {emailNotificationStatus && (
              <div className="text-sm text-green-600 mt-1">{emailNotificationStatus}</div>
            )}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Create Coupon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            <input 
              className="border p-2 rounded" 
              placeholder="CODE" 
              value={form.code} 
              onChange={e => setForm({...form, code: e.target.value})} 
            />
            
            {/* Coupon Type Selection */}
            <select 
              className="border p-2 rounded" 
              value={form.coupon_type} 
              onChange={e => setForm({...form, coupon_type: e.target.value})}
            >
              <option value="overall">Overall Purchase</option>
              <option value="single">Single Product</option>
              <option value="combo">Combo Offer</option>
            </select>
            
            <select 
              className="border p-2 rounded" 
              value={form.discount_type} 
              onChange={e => setForm({...form, discount_type: e.target.value})}
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
            </select>
            <input 
              className="border p-2 rounded" 
              type="number" 
              placeholder="Discount"
              value={form.discount_value} 
              onChange={e => setForm({...form, discount_value: e.target.value})}
              min="0"
            />
            <input 
              className="border p-2 rounded" 
              type="date" 
              placeholder="Start Date"
              value={form.start_date} 
              onChange={e => setForm({...form, start_date: e.target.value})}
            />
            <input 
              className="border p-2 rounded" 
              type="date" 
              placeholder="Expiry Date"
              value={form.expiry_date} 
              onChange={e => setForm({...form, expiry_date: e.target.value})}
            />
            <input 
              className="border p-2 rounded" 
              type="email" 
              placeholder="Affiliate Email"
              value={form.affiliateEmail} 
              onChange={e => setForm({...form, affiliateEmail: e.target.value})}
            />
          </div>
          {/* Conditional Fields Based on Coupon Type */}
          {form.coupon_type === 'single' && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Select Products</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {products.map((product: any) => (
                  <label key={product._id} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.product_ids.includes(product._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({...form, product_ids: [...form.product_ids, product._id]})
                        } else {
                          setForm({...form, product_ids: form.product_ids.filter((id: string) => id !== product._id)})
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{product.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.coupon_type === 'combo' && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Select Products (Max 2)</h4>
              <div className="space-y-2">
                {form.combo_product_ids.map((productId: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      className="border p-2 rounded flex-1"
                      value={productId}
                      onChange={(e) => {
                        const newComboIds = [...form.combo_product_ids]
                        newComboIds[index] = e.target.value
                        setForm({...form, combo_product_ids: newComboIds})
                      }}
                    >
                      <option value="">Select Product {index + 1}</option>
                      {products.map((product: any) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                      {index < form.combo_product_ids.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newComboIds = form.combo_product_ids.filter((_: any, i: number) => i !== index)
                            setForm({...form, combo_product_ids: newComboIds})
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {form.combo_product_ids.length < 2 && (
                    <button
                      type="button"
                      onClick={() => setForm({...form, combo_product_ids: [...form.combo_product_ids, '']})}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Add Product
                    </button>
                  )}
                </div>
            </div>
          )}
          <div className="mt-3">
            <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Create Coupon</button>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="mt-2 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4 text-lg sm:text-xl">Existing Coupons</h3>
          {loading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No coupons found in database. Create your first coupon above!</div>
              ) : (
                coupons.map((c: any) => (
                  <div key={c._id} className="border rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow">
                    {/* Mobile-first layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        {/* Coupon Code and Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="font-bold text-lg sm:text-xl text-gray-900">{c.code}</span>
                          {c.is_active ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                          )}
                          {c.usageCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Used {c.usageCount} times</span>
                          )}
                        </div>
                        
                        {/* Discount and Type */}
                        <div className="text-sm sm:text-base text-gray-600 mb-2">
                          <span className="font-semibold text-gray-900">
                            {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            {c.coupon_type === 'overall' && 'Overall Purchase'}
                            {c.coupon_type === 'single' && 'Single Product'}
                            {c.coupon_type === 'combo' && 'Combo Offer'}
                          </span>
                        </div>
                        
                        {/* Combined Date Line */}
                        <div className="text-xs sm:text-sm text-gray-500 mb-2">
                          <div className="font-medium">Starting from: {c.start_date ? formatDate(c.start_date) : 'Immediate'}</div>
                          <div className="font-medium">Expires on: {c.expiry_date ? formatDate(c.expiry_date) : 'Never'}</div>
                        </div>
                        
                        {/* Affiliate Email */}
                        {c.affiliateEmail && (
                          <div className="text-xs sm:text-sm text-blue-600 font-medium">
                            Affiliate: {c.affiliateEmail}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons - Mobile optimized */}
                      <div className="flex sm:flex-col gap-2 sm:gap-3">
                        <button 
                          onClick={() => handleDelete(c._id)} 
                          className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm sm:text-base font-medium shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
