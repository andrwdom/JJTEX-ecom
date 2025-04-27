import React from 'react'
import Carousel from '../components/Carousel'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'

const Home = () => {
  return (
    <div>
      <div className="mt-8">
        <Carousel />
      </div>
      <section id="latest-collection-section">
        <LatestCollection />
      </section>
      <section id="best-seller-section">
        <BestSeller />
      </section>
      <OurPolicy />
    </div>
  )
}

export default Home
