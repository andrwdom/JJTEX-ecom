import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
// import NewsletterBox from '../components/NewsletterBox'

const Contact = () => {
  return (
    <div>
      
      <div className='text-center text-2xl pt-10 border-t'>
          <Title text1={'CONTACT'} text2={'US'} />
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28'>
        <img className='w-full md:max-w-[480px] rounded-xl' src={assets.contact_img} alt="" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600'>JJ Textiles</p>
          <p className='text-gray-700'>No:166A , Anjaneyar Kovil street, Vengaivasal, Chennai-600126, Tamilnadu </p>
          <p className='text-gray-700'>Tel: 9940181523 <br /> Email: jjtex@gmail.com</p>
          <p className='text-gray-700'>Hours: Monday - Saturday, 10:00 AM - 8:00 PM</p>
        </div>
      </div>

      {/* <NewsletterBox/> */}
    </div>
  )
}

export default Contact
