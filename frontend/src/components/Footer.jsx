import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-20 text-sm'>
        <div className='pl-10'>
          <img src={assets.logo1} className='mb-2 w-32' alt="JJ Textiles Logo" />
          <p className='w-full md:w-2/3 text-gray-600'>
            JJ Textiles brings you a wide range of elegant, everyday, and festive wear for women, men, and kids. From timeless sarees to modern styles, we blend tradition with comfort — now available online and in-stor
          </p>
        </div>

        <div className="w-full sm:w-auto pl-10">
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li className="whitespace-nowrap">+91 97919 83410</li>
            <li className="break-all">support@jjtex.com</li>
            <li>No:166A , Anjaneyar Kovil street, Vengaivasal,</li>
            <li>Chennai-600126, Tamilnadu </li>
            <li>Ph: 9940181523</li>
          </ul>
        </div>

        <div className="w-full sm:w-auto pl-10">
          <p className='text-xl font-medium mb-5'>POLICIES</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>
              <Link to="/policies/terms-and-conditions" className="hover:text-pink-500 transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/policies/privacy-policy" className="hover:text-pink-500 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/policies/refund-policy" className="hover:text-pink-500 transition-colors">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/policies/return-policy" className="hover:text-pink-500 transition-colors">
                Return Policy
              </Link>
            </li>
            <li>
              <Link to="/policies/shipping-policy" className="hover:text-pink-500 transition-colors">
                Shipping Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright © 2024 JJ Textiles - All Rights Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
