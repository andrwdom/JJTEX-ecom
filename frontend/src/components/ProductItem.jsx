import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link, useNavigate } from 'react-router-dom'
import { fixImageUrl, getFallbackImage } from '../utils/imageUtils'

const ProductItem = ({id, image, name, price}) => {
  const { currency } = useContext(ShopContext);
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    navigate(`/product/${id}`);
  }

  return (
    <Link 
      onClick={handleClick} 
      className='text-gray-700 cursor-pointer' 
      to={`/product/${id}`}
    >
      <div className='overflow-hidden'>
        <img 
          className='hover:scale-110 transition ease-in-out' 
          src={fixImageUrl(image[0])} 
          alt={name}
          onError={(e) => {
            console.warn('Image failed to load:', e.target.src);
            e.target.src = getFallbackImage('product');
          }}
        />
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className='text-sm font-medium'>{currency}{price}</p>
    </Link>
  )
}

export default ProductItem
