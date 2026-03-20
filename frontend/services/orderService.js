const mongoose = require('mongoose');

// Order Schema for MongoDB
const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  products: [{ type: mongoose.Schema.Types.Mixed }],
  total_amount: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  coupon_code: { type: String, default: null },
  payment_id: { type: String, default: null }, // Made optional
  order_status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  collection: 'orders'
});

const Order = mongoose.model('Order', orderSchema);

// MongoDB Order Service
class OrderService {
  // Create order in MongoDB
  static async createOrder(orderData) {
    try {
      console.log('📝 Creating order in MongoDB:', orderData.order_id);

      const order = new Order({
        order_id: orderData.order_id,
        user_name: orderData.user_name,
        user_email: orderData.user_email,
        phone: orderData.phone,
        address: orderData.address,
        products: orderData.products,
        total_amount: orderData.total_amount,
        discount_amount: orderData.discount_amount || 0,
        final_amount: orderData.final_amount,
        coupon_code: orderData.coupon_code || null,
        payment_id: orderData.payment_id || `PAY_${Date.now()}`, // Generate if not provided
        order_status: orderData.order_status || 'pending',
        notes: orderData.notes || null
      });

      const savedOrder = await order.save();
      console.log('✅ Order created in MongoDB successfully:', savedOrder.order_id);
      
      return {
        success: true,
        data: savedOrder
      };

    } catch (error) {
      console.error('❌ MongoDB order service error:', error);
      
      if (error.code === 11000) {
        // Duplicate key error
        return {
          success: false,
          error: 'Order ID already exists'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Fetch all orders for admin
  static async fetchOrders() {
    try {
      console.log('📋 Fetching all orders from MongoDB...');

      const orders = await Order.find({})
        .sort({ created_at: -1 })
        .lean();

      console.log(`✅ Found ${orders.length} orders in MongoDB`);
      
      return {
        success: true,
        data: orders
      };

    } catch (error) {
      console.error('❌ MongoDB fetch orders error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get order by ID
  static async getOrderById(orderId) {
    try {
      console.log('🔍 Fetching order by ID:', orderId);

      const order = await Order.findOne({ order_id: orderId })
        .lean();

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      console.log('✅ Order found:', order.order_id);
      
      return {
        success: true,
        data: order
      };

    } catch (error) {
      console.error('❌ MongoDB get order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Update order status or other fields
  static async updateOrder(orderId, updateData) {
    try {
      console.log('🔄 Updating order:', orderId);

      const updateFields = {
        ...updateData,
        updated_at: new Date()
      };

      const result = await Order.updateOne(
        { order_id: orderId },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      console.log('✅ Order updated successfully');
      
      return {
        success: true,
        data: { modifiedCount: result.modifiedCount }
      };

    } catch (error) {
      console.error('❌ MongoDB update order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Delete order by ID
  static async deleteOrder(orderId) {
    try {
      console.log('🗑️ Deleting order:', orderId);

      const result = await Order.deleteOne({ order_id: orderId });

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      console.log('✅ Order deleted successfully');
      
      return {
        success: true,
        data: { deletedCount: result.deletedCount }
      };

    } catch (error) {
      console.error('❌ MongoDB delete order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get order statistics
  static async getOrderStats() {
    try {
      console.log('📊 Getting order statistics...');

      const stats = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$final_amount' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$order_status', 'pending'] }, 1, 0] }
            },
            successfulOrders: {
              $sum: { $cond: [{ $eq: ['$order_status', 'success'] }, 1, 0] }
            },
            failedOrders: {
              $sum: { $cond: [{ $eq: ['$order_status', 'failed'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        successfulOrders: 0,
        failedOrders: 0
      };

      console.log('✅ Order statistics retrieved');
      
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('❌ MongoDB order stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Delete order by ID
  static async deleteOrder(orderId) {
    try {
      console.log('🗑️ Deleting order:', orderId);

      const deletedOrder = await Order.findOneAndDelete({ order_id: orderId });

      if (!deletedOrder) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      console.log('✅ Order deleted successfully:', orderId);
      
      return {
        success: true,
        data: deletedOrder
      };

    } catch (error) {
      console.error('❌ MongoDB order deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get orders by date range for reports
  static async getOrdersByDateRange(startDate, endDate) {
    try {
      console.log('📅 Getting orders from', startDate, 'to', endDate);

      const orders = await Order.find({
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).sort({ created_at: -1 });

      console.log(`✅ Found ${orders.length} orders in date range`);
      
      return {
        success: true,
        data: orders
      };

    } catch (error) {
      console.error('❌ MongoDB date range query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

module.exports = OrderService;
