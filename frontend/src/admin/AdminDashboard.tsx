import { useState, useEffect } from 'react'
import { Package, ShoppingCart, DollarSign, Settings, LogOut, Lock, Tag } from 'lucide-react'
import { api } from '../services/api'

interface AdminDashboardProps {
  setCurrentPage?: (page: string) => void
}


export default function AdminDashboard({ setCurrentPage }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  })

  const [salesData, setSalesData] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0
  })

  const [couponUsage, setCouponUsage] = useState<{[key: string]: number}>({})


  // Function to calculate coupon usage from orders
  const calculateCouponUsage = (orders: any[]) => {
    console.log('🎫 Dashboard: Calculating coupon usage from', orders.length, 'orders');
    
    const usage: {[key: string]: number} = {};
    
    orders.forEach(order => {
      // Only count confirmed and delivered orders
      if (order.order_status === 'confirmed' || order.order_status === 'delivered' || order.order_status === 'success') {
        const couponCode = order.coupon_code;
        if (couponCode && couponCode.trim() !== '') {
          usage[couponCode] = (usage[couponCode] || 0) + 1;
          console.log(`🎫 Dashboard: Coupon ${couponCode} used in order ${order.order_id}`);
        }
      }
    });

    console.log('🎫 Dashboard: Final coupon usage:', usage);
    setCouponUsage(usage);
  }


  // Function to calculate sales based on confirmed orders
  const calculateSalesData = (orders: any[]) => {
    console.log('🔍 Dashboard: Calculating sales from', orders.length, 'orders');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;
    let totalRevenue = 0;
    let totalOrders = 0;

    orders.forEach((order, index) => {
      console.log(`🔍 Dashboard: Order ${index + 1}:`, {
        order_id: order.order_id,
        order_status: order.order_status,
        final_amount: order.final_amount,
        created_at: order.created_at
      });
      
      // Only count confirmed and successful orders
      if (order.order_status === 'confirmed' || order.order_status === 'delivered' || order.order_status === 'success') {
        const orderDate = new Date(order.created_at || order.date);
        const orderAmount = order.final_amount || order.total_amount || 0;
        
        console.log(`✅ Dashboard: Counting order ${order.order_id} - Amount: ₹${orderAmount}`);
        
        totalRevenue += orderAmount;
        totalOrders++;

        if (orderDate >= today) {
          todaySales += orderAmount;
        }
        if (orderDate >= weekAgo) {
          weekSales += orderAmount;
        }
        if (orderDate >= monthAgo) {
          monthSales += orderAmount;
        }
      } else {
        console.log(`❌ Dashboard: Skipping order ${order.order_id} - Status: ${order.order_status}`);
      }
    });

    const result = {
      todaySales,
      weekSales,
      monthSales,
      totalRevenue,
      totalOrders
    };
    
    console.log('🔍 Dashboard: Final calculations:', result);
    return result;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch products and orders data
        const [productsData, ordersData] = await Promise.all([
          api.getProducts(),
          api.getOrders()
        ]);

        // Calculate sales data from confirmed orders
        const salesCalculations = calculateSalesData(ordersData);

        // Calculate coupon usage from orders
        calculateCouponUsage(ordersData);

        // Update states
        setStats({
          totalProducts: productsData.length,
          totalOrders: salesCalculations.totalOrders,
          totalRevenue: salesCalculations.totalRevenue
        });

        setSalesData({
          todaySales: salesCalculations.todaySales,
          weekSales: salesCalculations.weekSales,
          monthSales: salesCalculations.monthSales
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set default values on error
        setStats({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0
        });
        setSalesData({
          todaySales: 0,
          weekSales: 0,
          monthSales: 0
        });
      } finally {
        // Loading state removed
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome, Abhinay</h1>
            <div className="flex flex-wrap items-center gap-1">
              <button 
                onClick={() => setCurrentPage?.('admin-product-management')}
                className="bg-blue-500 text-white px-2 py-2 sm:px-3 sm:py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Product Management</span>
                <span className="sm:hidden">Products</span>
              </button>
              <button 
                onClick={() => setCurrentPage?.('admin-coupons')}
                className="bg-purple-500 text-white px-2 py-2 sm:px-3 sm:py-2 rounded-lg hover:bg-purple-600 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <DollarSign size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Manage Coupons</span>
                <span className="sm:hidden">Coupons</span>
              </button>
              <button 
                onClick={() => setCurrentPage?.('admin-orders')}
                className="bg-green-500 text-white px-2 py-2 sm:px-3 sm:py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">View Orders</span>
                <span className="sm:hidden">Orders</span>
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('adminAuthenticated')
                  localStorage.removeItem('adminUser')
                  setCurrentPage?.('home')
                  window.location.href = '/'
                }}
                className="bg-red-500 text-white px-2 py-2 sm:px-3 sm:py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 text-sm sm:text-base"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards - Mobile First Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <Package size={20} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <ShoppingCart size={20} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">🤑</span>
              </div>
              <div className="ml-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900"><span className="font-normal">₹</span>{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Overview - Below Stats on Mobile */}
        <div className="max-w-full sm:max-w-2xl mx-auto">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Sales Overview</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Total Sales</span>
                <span className="font-bold text-base sm:text-lg text-green-600">₹{stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">Today's Sales</span>
                <span className="font-semibold text-sm sm:text-base">₹{salesData.todaySales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">This Week</span>
                <span className="font-semibold text-sm sm:text-base">₹{salesData.weekSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-600">This Month</span>
                <span className="font-semibold text-sm sm:text-base">₹{salesData.monthSales.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coupon Usage Analytics */}
        <div className="max-w-full sm:max-w-2xl mx-auto mt-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-4">
              <Tag size={20} className="text-orange-600 mr-2" />
              <h3 className="text-base sm:text-lg font-semibold">Coupon Usage Analytics</h3>
            </div>
            {Object.keys(couponUsage).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(couponUsage)
                  .sort(([,a], [,b]) => b - a) // Sort by usage count (highest first)
                  .map(([couponCode, usageCount]) => (
                    <div key={couponCode} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="font-mono text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded mr-3">
                          {couponCode}
                        </span>
                        <span className="text-sm text-gray-600">
                          Used {usageCount} time{usageCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-orange-600">
                          {usageCount}
                        </span>
                      </div>
                    </div>
                  ))}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">
                      Total Coupons Used
                    </span>
                    <span className="text-lg font-bold text-orange-600">
                      {Object.values(couponUsage).reduce((sum, count) => sum + count, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No coupons have been used yet</p>
                <p className="text-gray-400 text-xs mt-1">Coupon usage will appear here when customers start using them</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
