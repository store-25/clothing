export default function Footer() {
  return (
    <footer className="bg-black text-white py-8">
      <div className="max-w-7xl mx-auto text-center space-y-4">
        {/* Quote */}
        <blockquote className="text-lg md:text-xl text-gray-300 italic leading-relaxed mb-6">
          "Store 25 is for those who don't follow trends — they create them."
        </blockquote>
        
        {/* Copyright */}
        <p className="text-sm text-gray-400">
          &copy; 2024 STORE25. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
