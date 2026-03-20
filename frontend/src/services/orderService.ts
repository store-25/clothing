// Order Service - Backend API Integration (No Supabase)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clothing-guxz.onrender.com/api'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  size: string
  color: string
  image: string
}

export interface Order {
  order_id: string
  user_name: string
  user_email: string
  phone: string
  address: string
  products: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    color?: string
  }>
  total_amount: number
  discount_amount: number
  final_amount: number
  coupon_code?: string
  order_status: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface WhatsAppOrder {
  customer_name: string
  customer_phone: string
  customer_address: string
  products: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    color?: string
  }>
  total_amount: number
  message_text: string
  whatsapp_message_id: string
}

export class OrderService {
  // Create new order (from frontend or WhatsApp)
  static async createOrder(orderData: Omit<Order, '_id' | 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  // Create order from WhatsApp message
  static async createWhatsAppOrder(whatsappData: WhatsAppOrder): Promise<Order> {
    try {
      const orderData = {
        order_id: `WA_${Date.now()}_${whatsappData.whatsapp_message_id}`,
        user_name: whatsappData.customer_name,
        user_email: `${whatsappData.customer_phone}@whatsapp.local`, // Generate email from phone
        phone: whatsappData.customer_phone,
        address: whatsappData.customer_address,
        products: whatsappData.products.map((product, index) => ({
          id: `wa_product_${index}`,
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          size: product.size || 'N/A',
          color: product.color || 'N/A',
          image: `${API_BASE_URL.replace('/api', '')}/api/placeholder-product.jpg` // Default image
        })),
        total_amount: whatsappData.total_amount,
        discount_amount: 0,
        final_amount: whatsappData.total_amount,
        order_status: 'pending',
        notes: `Order from WhatsApp: ${whatsappData.message_text.substring(0, 100)}...`
      }

      return await this.createOrder(orderData)
    } catch (error) {
      console.error('Error creating WhatsApp order:', error)
      throw error
    }
  }

  // Get all orders (for admin panel)
  static async getOrders(): Promise<Order[]> {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch orders')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  }

  // Update order status and notes
  static async updateOrderStatus(orderId: string, orderStatus: string, notes?: string): Promise<Order> {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_status: orderStatus,
          notes: notes
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order status')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  // Get order by ID
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch order')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching order:', error)
      return null
    }
  }

  // Get order statistics
  static async getOrderStats(): Promise<{
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    successfulOrders: number
    failedOrders: number
  }> {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/orders/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch order statistics')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error fetching order statistics:', error)
      throw error
    }
  }

  // Delete order
  static async deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to delete order'
        }
      }

      const result = await response.json()
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete order'
      }
    }
  }

  // Parse WhatsApp message to extract order details
  static parseWhatsAppMessage(message: string): WhatsAppOrder | null {
    try {
      // Example WhatsApp message format:
      // "Hi, I want to order:
      // 1. Product A - Size M, Color Blue - 2 pieces - ₹299 each
      // 2. Product B - Size L, Color Red - 1 piece - ₹199 each
      // Total: ₹797
      // Name: John Doe
      // Phone: 9876543210
      // Address: 123 Main St, City"

      const lines = message.split('\n').map(line => line.trim()).filter(line => line)
      
      let customer_name = ''
      let customer_phone = ''
      let customer_address = ''
      const products: any[] = []
      let total_amount = 0

      // Extract customer details
      lines.forEach(line => {
        if (line.toLowerCase().includes('name:')) {
          customer_name = line.split(':')[1]?.trim() || ''
        } else if (line.toLowerCase().includes('phone:')) {
          customer_phone = line.split(':')[1]?.trim() || ''
        } else if (line.toLowerCase().includes('address:')) {
          customer_address = line.split(':')[1]?.trim() || ''
        } else if (line.toLowerCase().includes('total:')) {
          const totalMatch = line.match(/₹(\d+)/)
          total_amount = totalMatch ? parseInt(totalMatch[1]) : 0
        }
      })

      // Extract products (basic parsing)
      lines.forEach(line => {
        const productMatch = line.match(/(\d+)\.\s*(.+?)\s*-\s*₹(\d+)/)
        if (productMatch) {
          products.push({
            name: productMatch[2].trim(),
            quantity: 1, // Default to 1, can be enhanced
            price: parseInt(productMatch[3])
          })
        }
      })

      if (!customer_name || !customer_phone || products.length === 0) {
        return null
      }

      return {
        customer_name,
        customer_phone,
        customer_address,
        products,
        total_amount,
        message_text: message,
        whatsapp_message_id: `msg_${Date.now()}`
      }
    } catch (error) {
      console.error('Error parsing WhatsApp message:', error)
      return null
    }
  }
}

export default OrderService
