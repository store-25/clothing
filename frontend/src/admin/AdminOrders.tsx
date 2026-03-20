import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { type Order } from '../services/orderService'
import { OrderService } from '../services/orderService'
import jsPDF from 'jspdf'

interface AdminOrdersProps {
  setCurrentPage?: (page: string) => void
}

export default function AdminOrders({ setCurrentPage }: AdminOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      // Check if admin token exists
      const token = localStorage.getItem('adminToken');
      console.log('🔍 Admin token check:', token ? 'Exists' : 'Not found');
      console.log('🔍 Token length:', token?.length || 0);
      
      if (!token) {
        console.log('❌ No admin token found, redirecting to login');
        alert('Please login as admin first');
        window.location.href = '/admin-login';
        return;
      }
      
      console.log('📡 Fetching orders from admin API...');
      
      // Fetch orders from admin API
      const response = await fetch('https://clothing-guxz.onrender.com/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ Authentication failed, token invalid');
          localStorage.removeItem('adminToken');
          alert('Session expired. Please login again.');
          window.location.href = '/admin-login';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📋 API Response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders')
      }
      
      console.log('✅ Orders loaded:', result.data?.length || 0);
      setOrders(result.data || [])
      
      // Log order details for debugging
      if (result.data && result.data.length > 0) {
        console.log('📊 Order details:');
        result.data.forEach((order: Order, index: number) => {
          console.log(`   ${index + 1}. ${order.order_id} - ${order.user_name}`);
        });
      }
      
    } catch (err) {
      console.error('❌ Failed to load orders:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Failed to load orders: ${errorMessage}. Please check your internet connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Update order status via API
      const response = await fetch(`https://clothing-guxz.onrender.com/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ order_status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update order status')
      }
      
      // Update local state
      setOrders(orders.map(order => 
        order.order_id === orderId ? { ...order, order_status: newStatus } : order
      ))
      
      alert('Order status updated successfully')
    } catch (err) {
      console.error('Failed to update order status:', err)
      alert('Failed to update order status')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await OrderService.deleteOrder(orderId);
        setOrders(orders.filter(order => order.order_id !== orderId));
        alert('Order deleted successfully!');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order. Please try again.');
      }
    }
  }

  const downloadOrder = (order: Order) => {
    // Create a professional PDF invoice
    const doc = new jsPDF();
    
    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;
    
    // Helper function to add text
    const addText = (text: string, x: number, y: number, fontSize = 12, fontWeight = 'normal') => {
      doc.setFontSize(fontSize);
      if (fontWeight === 'bold') {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(text, x, y);
      return y + (fontSize * 0.5) + 2;
    };
    
    // Add header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 15;
    
    // Add line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
    
    // Bill To Section
    yPosition = addText('BILL TO:', margin, yPosition, 14, 'bold');
    yPosition = addText(order.user_name || 'Customer Name', margin, yPosition);
    yPosition = addText(order.address || 'Customer Address', margin, yPosition);
    yPosition = addText(`${order.user_email || 'Email'} | ${order.phone || 'Phone'}`, margin, yPosition);
    yPosition += 10;
    
    // Order Details
    yPosition = addText('ORDER DETAILS:', margin, yPosition, 14, 'bold');
    yPosition = addText(`Order ID: ${order.order_id}`, margin, yPosition);
    yPosition = addText(`Date: ${new Date(order.created_at || '').toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    
    // Products Table
    yPosition = addText('PRODUCTS:', margin, yPosition, 14, 'bold');
    
    // Table headers
    const tableStartY = yPosition + 5;
    const tableHeaders = ['Product', 'Size', 'Color', 'Qty', 'Price', 'Total'];
    const columnWidths = [60, 20, 20, 15, 25, 25];
    let currentX = margin;
    
    // Draw table header background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, tableStartY - 5, pageWidth - (margin * 2), 10, 'F');
    
    // Add table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    tableHeaders.forEach((header, index) => {
      doc.text(header, currentX + 2, tableStartY);
      currentX += columnWidths[index];
    });
    
    yPosition = tableStartY + 8;
    
    // Add products
    let subtotal = 0;
    order.products?.forEach((item: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }
      
      currentX = margin;
      const itemTotal = (item.price || 0) * item.quantity;
      subtotal += itemTotal;
      
      // Product name (might wrap)
      const productName = item.name || item.product_name || 'Product';
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(productName, columnWidths[0] - 4);
      lines.forEach((line: string, lineIndex: number) => {
        doc.text(line, currentX + 2, yPosition + (lineIndex * 4));
      });
      
      // Other columns
      currentX += columnWidths[0];
      doc.text(item.size || 'N/A', currentX + 2, yPosition);
      currentX += columnWidths[1];
      doc.text(item.color || 'N/A', currentX + 2, yPosition);
      currentX += columnWidths[2];
      doc.text(item.quantity.toString(), currentX + 2, yPosition);
      currentX += columnWidths[3];
      const itemPrice = parseFloat(item.price || 0);
      doc.text(`Rs. ${itemPrice.toFixed(2)}`, currentX + 2, yPosition);
      currentX += columnWidths[4];
      doc.text(`Rs. ${itemTotal.toFixed(2)}`, currentX + 2, yPosition);
      
      yPosition += Math.max(8, lines.length * 4) + 3;
    });
    
    // Draw table bottom line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Total
    const totalAmount = order.final_amount || 0;
    yPosition = addText(`TOTAL: Rs. ${totalAmount.toFixed(2)}`, margin, yPosition, 16, 'bold');
    
    // Footer
    if (yPosition > 240) {
      doc.addPage();
      yPosition = margin;
    }
    
    yPosition += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', margin, yPosition);
    
    // Save the PDF
    doc.save(`Invoice_${order.order_id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      const result = await OrderService.deleteOrder(orderId)
      
      if (result.success) {
        // Remove order from local state
        setOrders(orders.filter(order => order.order_id !== orderId))
        alert('Order deleted successfully')
      } else {
        alert('Failed to delete order: ' + result.error)
      }
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Failed to delete order')
    }
  }

  const downloadOrderReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      alert('Please select both start and end dates');
      return
    }

    if (new Date(reportStartDate) > new Date(reportEndDate)) {
      alert('Start date cannot be after end date');
      return
    }

    try {
      console.log('📊 Downloading order report from', reportStartDate, 'to', reportEndDate);
      
      // Get admin token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Please login as admin first');
        return;
      }

      // Call the API endpoint directly
      const response = await fetch(`https://clothing-guxz.onrender.com/api/orders/report?startDate=${reportStartDate}&endDate=${reportEndDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/csv'
        }
      });

      console.log('📡 Report response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download report');
      }

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `orders-report-${reportStartDate}-to-${reportEndDate}.csv`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ Report downloaded successfully');
      
    } catch (error: any) {
      console.error('❌ Error downloading report:', error);
      alert('Failed to download report: ' + (error.message || 'Unknown error'));
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  if (setCurrentPage) {
                    setCurrentPage('admin-dashboard')
                    return
                  }
                  // Fallback navigation
                  window.location.href = '/admin/dashboard'
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Go back to admin dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Report Download Section */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Download Orders Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <button
                onClick={downloadOrderReport}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Orders Report
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 bg-white rounded-lg">Loading orders...</div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-6 bg-white rounded-lg text-center text-gray-500">
                No orders found.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.order_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.order_id}</h3>
                        <p className="text-gray-600">
                          {order.user_name} • {order.user_email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at || '')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status?.toUpperCase()}
                        </span>
                        <p className="text-lg font-bold mt-2">₹{order.final_amount?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div>
                        <h4 className="font-semibold mb-3">Customer Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Name:</strong> {order.user_name}</p>
                          <p><strong>Email:</strong> {order.user_email}</p>
                          <p><strong>Phone:</strong> {order.phone}</p>
                          <p><strong>Address:</strong> {order.address}</p>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div>
                        <h4 className="font-semibold mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Subtotal:</strong> ₹{order.total_amount?.toFixed(2)}</p>
                          <p><strong>Shipping:</strong> ₹0.00</p>
                          <p><strong>Tax:</strong> ₹0.00</p>
                          {order.discount_amount && order.discount_amount > 0 && (
                            <p><strong>Discount:</strong> -₹{order.discount_amount.toFixed(2)}</p>
                          )}
                          {order.coupon_code && (
                            <p><strong>Coupon:</strong> {order.coupon_code}</p>
                          )}
                          <p className="font-bold"><strong>Total:</strong> ₹{order.final_amount?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.products?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs">IMG</span>
                              </div>
                              <div>
                                <p className="font-medium">{item.name || item.product_name}</p>
                                <p className="text-sm text-gray-500">
                                  Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{item.price?.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Update Status</h4>
                      <div className="flex gap-2 mb-4">
                        {['pending', 'success', 'failed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.order_id!, status)}
                            disabled={order.order_status === status}
                            className={`px-3 py-1 rounded text-sm font-medium transition ${
                              order.order_status === status
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadOrder(order)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Order
                        </button>
                        <button
                          onClick={() => deleteOrder(order.order_id!)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
