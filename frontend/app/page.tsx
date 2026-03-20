import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import BestSellers from '@/components/BestSellers'
import Testimonials from '@/components/Testimonials'
import FollowTheVibe from '@/components/FollowTheVibe'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'

export default function Page() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <BestSellers />
      <Testimonials />
      <FollowTheVibe />
      <Newsletter />
      <Features />
      <Footer />
    </main>
  )
}
