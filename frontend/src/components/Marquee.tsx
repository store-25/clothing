

export default function Marquee() {
  return (
    <>
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 overflow-hidden w-screen">
        <div className="flex items-center justify-center">
          <div className="flex whitespace-nowrap animate-marquee">
            <span className="text-sm sm:text-base font-medium px-4">
              After placing your order, you'll be redirected to WhatsApp for confirmation.
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
