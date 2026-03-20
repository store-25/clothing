const mongoose = require('mongoose');

// Order Schema
const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_email: { type: String, required: true },
  user_name: { type: String, required: true },
  user_phone: { type: String },
  items: [{
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    size: { type: String },
    color: { type: String }
  }],
  subtotal: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  shipping_address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String }
  },
  payment_method: { type: String, enum: ['cod', 'online'], default: 'cod' },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  order_status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  coupon_code: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

class OrderService {
  static async createOrder(orderData) {
    try {
      const order = new Order(orderData);
      const savedOrder = await order.save();
      return { success: true, data: savedOrder };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  static async getOrders() {
    try {
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ MongoDB not connected, returning empty orders');
        return { success: true, data: [] };
      }
      
      const orders = await Order.find().sort({ createdAt: -1 });
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error fetching orders:', error);
      // If collection doesn't exist, return empty array instead of error
      if (error.message.includes('Collection') || error.message.includes('does not exist')) {
        console.log('📝 Orders collection does not exist yet, returning empty array');
        return { success: true, data: [] };
      }
      return { success: false, error: error.message };
    }
  }

  // Alias for getOrders for consistency
  static async fetchOrders() {
    return await this.getOrders();
  }

  static async getOrderById(orderId) {
    try {
      const order = await Order.findOne({ order_id: orderId });
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, data: order };
    } catch (error) {
      console.error('Error fetching order:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateOrderStatus(orderId, status, notes = '') {
    try {
      const order = await Order.findOneAndUpdate(
        { order_id: orderId },
        { 
          order_status: status,
          notes: notes,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      
      return { success: true, data: order };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteOrder(orderId) {
    try {
      const order = await Order.findOneAndDelete({ order_id: orderId });
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, data: order };
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }
  }

  static async getOrderStats() {
    try {
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ MongoDB not connected, returning empty stats');
        return {
          success: true,
          data: {
            totalOrders: 0,
            totalRevenue: 0,
            statusBreakdown: []
          }
        };
      }
      
      const stats = await Order.aggregate([
        {
          $group: {
            _id: '$order_status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$final_amount' }
          }
        }
      ]);
      
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $group: { _id: null, total: { $sum: '$final_amount' } } }
      ]);
      
      return {
        success: true,
        data: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          statusBreakdown: stats
        }
      };
    } catch (error) {
      console.error('Error getting order stats:', error);
      // If collection doesn't exist, return empty stats instead of error
      if (error.message.includes('Collection') || error.message.includes('does not exist')) {
        console.log('📝 Orders collection does not exist yet, returning empty stats');
        return {
          success: true,
          data: {
            totalOrders: 0,
            totalRevenue: 0,
            statusBreakdown: []
          }
        };
      }
      return { success: false, error: error.message };
    }
  }

  static async getOrdersByDateRange(startDate, endDate) {
    try {
      const orders = await Order.find({
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).sort({ createdAt: -1 });
      
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error fetching orders by date range:', error);
      return { success: false, error: error.message };
    }
  }

  static async getOrdersByCustomer(customerEmail) {
    try {
      const orders = await Order.find({ user_email: customerEmail }).sort({ createdAt: -1 });
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = OrderService;
