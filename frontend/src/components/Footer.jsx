import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-20 text-sm'>

        <div className='pl-10'>
            <img src={assets.logo1} className='mb-2 w-32' alt="" />
            <p className='w-full md:w-2/3 text-gray-600'>
            JJ TEX brings you a wide range of elegant, everyday, and festive wear for women, men, and kids. From timeless sarees to modern styles, we blend tradition with comfort — now available online and in-store.
            </p>
        </div>

        <div className="w-full sm:w-auto pl-10">
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li className="whitespace-nowrap">+91 97919 83410</li>
                <li className="break-all">jjtex001@gmail.com</li>
                <li>This site was designed by</li>
                <li><a href="https://linktr.ee/andrewdom" target='_blank' className='text-pink-500 hover:text-pink-600 transition-colors'>Andrew Dominic</a></li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='py-5 text-sm text-center'>Copyright 2025@ jjtextiles.com - All Right Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
