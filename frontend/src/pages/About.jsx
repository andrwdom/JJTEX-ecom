import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
// import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div>

      <div className='text-2xl text-center pt-8 border-t'>  
          <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-16'>
          <img className='w-full md:max-w-[450px] rounded-xl' src={assets.about_img} alt="" />
          <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
              <p>At JJ TEX, we believe great style shouldn't come at a high price. What started as a small idea has grown into a space where fashion meets comfort, and every woman can find something that fits her vibe — whether it's for a casual day out or something a little extra.</p>
              <p>We're constantly curating collections that blend simplicity with statement — from wardrobe staples to trending picks. Every piece is selected with care to make sure it feels as good as it looks.</p>
              <b className='text-gray-800'>Our Mission</b>
              <p>Our mission is simple: to make shopping effortless, enjoyable, and inspiring. At JJ TEX, we're committed to helping you express yourself through fashion — with quality, variety, and service you can trust. </p>
          </div>
      </div>

      <div className=' text-xl py-4'>
          <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm mb-20'>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Quality You Can Trust:</b>
            <p className='text-gray-800'>Every piece at JJ TEX is handpicked to make sure it not only looks good but lasts long. We don't settle for average — and neither should you.</p>
          </div>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>Effortless Shopping:</b>
            <p className='text-gray-800'>From scrolling to checkout, our website is built to make your experience smooth and stress-free. Fast, simple, and always user-friendly.</p>
          </div>
          <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
            <b>We've Got Your Back: </b>
            <p className='text-gray-800'>From scrolling to checkout, our website is built to make your experience smooth and stress-free. Fast, simple, and always user-friendly.</p>
          </div>
      </div>

    </div>
  )
}

export default About
