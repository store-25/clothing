import { useState } from 'react'
import { Send, MapPin, Phone, Mail, Clock,} from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission here
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-[#701920] text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">GET IN TOUCH</h1>
          <p className="text-gray-200 text-lg">We'd love to hear from you. Drop us a line anytime.</p>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="bg-white py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {/* Visit Us */}
          <div className="flex flex-col items-center">
            <MapPin size={40} className="text-gray-800 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Visit Us</h3>
            <p className="text-gray-600">location</p>
            <p className="text-gray-600">will be updated soon.</p>
          </div>

          {/* Call Us */}
          <div className="flex flex-col items-center">
            <Phone size={40} className="text-gray-800 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Call Us</h3>
            <p className="text-gray-600">Send us a message.</p>
            <p className="text-gray-600">Contact number will be updated soon.</p>
          </div>

          {/* Email Us */}
          <div className="flex flex-col items-center">
            <Mail size={40} className="text-gray-800 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Us</h3>
            <p className="text-gray-600">For bulk orders email/contact us at</p>
            <p className="text-gray-600">fashiontool369@gmail.com</p>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <Clock size={40} className="text-gray-800 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Hours</h3>
            <p className="text-gray-600">Mon - Fri: 9 AM - 8 PM</p>
            <p className="text-gray-600">Sat - Sun: 10 AM - 6 PM</p>
          </div>
        </div>
      </div>

      {/* Contact Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-white p-8 md:p-12 shadow-lg rounded-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2 mx-auto"
              >
                <Send size={20} />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
