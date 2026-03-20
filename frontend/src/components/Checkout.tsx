import { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, Truck, Shield, Headphones } from 'lucide-react'
import CartService from '../services/cartService'
import OrderService from '../services/orderService'

interface CheckoutProps {
  setCurrentPage?: (page: string) => void
}

export default function Checkout({ setCurrentPage }: CheckoutProps = {}) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', address: '' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cartItems')
      if (raw) setCartItems(JSON.parse(raw))
      
      // Load applied coupon from localStorage
      const savedCoupon = localStorage.getItem('appliedCoupon')
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon))
      }
    } catch (e) { }
  }, [])

  const subtotal = cartItems.reduce((s, it) => s + (it.price * it.quantity), 0)
  const shipping = 50
  
  // Calculate discount based on applied coupon
  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discount = subtotal * (appliedCoupon.discount_value / 100)
    } else if (appliedCoupon.discount_type === 'flat') {
      discount = appliedCoupon.discount_value
    }
  }
  
  const final_total = subtotal + shipping - discount

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateIndianPhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validateForm = () => {
    const newErrors = { name: '', email: '', phone: '', address: '' }
    let isValid = true

    if (!customer.name.trim()) {
      newErrors.name = 'Please enter your name'
      isValid = false
    }

    if (!customer.email.trim()) {
      newErrors.email = 'Please enter your email'
      isValid = false
    } else if (!validateEmail(customer.email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    if (!customer.phone.trim()) {
      newErrors.phone = 'Please enter your phone number'
      isValid = false
    } else if (!validateIndianPhone(customer.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number'
      isValid = false
    }

    if (!customer.address.trim()) {
      newErrors.address = 'Please enter your address'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleProceedToConfirm = async () => {
    if (!validateForm()) return
    if (cartItems.length === 0) return alert('Your cart is empty')

    try {
      // Show loading state
      const button = document.querySelector('button');
      if (button) {
        button.textContent = 'Creating Order...';
        button.disabled = true;
      }

      // Prepare order data for MongoDB
      const orderData = {
        order_id: 'ORDER_' + Date.now(),
        user_name: customer.name,
        user_email: customer.email,
        user_phone: customer.phone,
        shipping_address: {
          street: customer.address,
          city: 'City', // You may want to add city field to customer form
          state: 'State', // You may want to add state field to customer form
          pincode: '000000', // You may want to add pincode field to customer form
          phone: customer.phone
        },
        items: cartItems.map(item => ({
          product_id: item.id || 'product_' + Date.now(),
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size || 'N/A',
          color: item.color || 'N/A'
        })),
        subtotal: subtotal,
        discount_amount: discount,
        final_amount: final_total,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        payment_id: 'PAY_' + Date.now(), // Add payment ID
        order_status: 'pending'
      };

      console.log('📦 Storing order in MongoDB...', orderData);

      // Store order in MongoDB
      const createdOrder = await OrderService.createOrder(orderData);
      
      console.log('✅ Order stored in MongoDB:', createdOrder.order_id);

      // Generate WhatsApp message
      const productDetails = cartItems.map((item, index) => {
        return `${index + 1}. ${item.name}\n   Size: ${item.size || 'N/A'}\n   Color: ${item.color || 'N/A'}\n   Quantity: ${item.quantity}\n   Price: ₹${item.price}`;
      }).join('\n\n');

      const message = `Hello Store25

I want to place the following order:

Order ID: ${createdOrder.order_id}

Customer Details:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}

Product Details:
${productDetails}

Order Summary:
Subtotal: ₹${subtotal.toFixed(2)}
Shipping: ₹${shipping.toFixed(2)}
${appliedCoupon ? `Discount (${appliedCoupon.code}): -₹${discount.toFixed(2)}\n` : ''}Total Amount: ₹${final_total.toFixed(2)}

Shipping Address:
${customer.address}

Please confirm availability and order details.`;

      // Create WhatsApp URL
      const adminNumber = '+7032770849'; // Updated WhatsApp number
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(adminNumber)}&text=${encodeURIComponent(message)}`;
      
      // Clear cart and redirect to WhatsApp
      CartService.clearCart();
      
      alert(`Order ${createdOrder.order_id} created successfully! Redirecting to WhatsApp...`);
      window.location.href = whatsappUrl;

    } catch (error) {
      console.error('❌ Failed to create order:', error);
      alert('Failed to create order. Please try again.');
      
      // Reset button
      const button = document.querySelector('button');
      if (button) {
        button.textContent = 'Proceed to Confirm Order';
        button.disabled = false;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('cart')
                } else {
                  window.location.href = '/#cart'
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Back to Cart"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Shipping Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input 
                  className={`border p-2 w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Receiver's Name" 
                  value={customer.name} 
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <input 
                  className={`border p-2 w-full ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  type="email"
                  placeholder="Email" 
                  value={customer.email} 
                  onChange={e => setCustomer({...customer, email: e.target.value})}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <input 
                  className={`border p-2 w-full ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  type="tel"
                  placeholder="10 digit mobile number" 
                  value={customer.phone} 
                  onChange={e => setCustomer({...customer, phone: e.target.value})}
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  required
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <input 
                  className={`border p-2 w-full ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Address" 
                  value={customer.address} 
                  onChange={e => setCustomer({...customer, address: e.target.value})}
                  required
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-3">
              {cartItems.length === 0 ? <div>No items in cart</div> : cartItems.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <div>{it.name} x {it.quantity}</div>
                  <div>₹{(it.price * it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div>Subtotal:</div>
                <div>₹{subtotal.toFixed(2)}</div>
              </div>
              <div className="flex justify-between">
                <div>Shipping:</div>
                <div>₹{shipping.toFixed(2)}</div>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <div>Discount ({appliedCoupon.code}):</div>
                  <div>-₹{discount.toFixed(2)}</div>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <div>Total:</div>
                <div>₹{final_total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg">
            <button onClick={handleProceedToConfirm} className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
              Proceed to Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
