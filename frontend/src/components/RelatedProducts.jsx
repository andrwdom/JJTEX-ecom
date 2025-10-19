import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductCard from './ProductCard';

const RelatedProducts = ({category,subCategory}) => {

    const { products } = useContext(ShopContext);
    const [related,setRelated] = useState([]);

    useEffect(()=>{

        if (Array.isArray(products) && products.length > 0) {
            
            let productsCopy = products.slice();
            
            productsCopy = productsCopy.filter((item) => category === item.category);
            productsCopy = productsCopy.filter((item) => subCategory === item.subCategory);

            setRelated(productsCopy.slice(0,5));
        } else {
            setRelated([]);
        }
        
    },[products])

  return (
    <div className='my-16 sm:my-24'>
      <div className='text-center text-2xl sm:text-3xl py-2 mb-4'>
        <Title text1={'RELATED'} text2={'PRODUCTS'} />
      </div>
      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4 sm:overflow-x-visible">
        {Array.isArray(related) && related.map((item,index)=>(
          <div
            key={index}
            className="min-w-[70vw] max-w-xs snap-center sm:min-w-0 sm:max-w-none flex-shrink-0"
          >
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default RelatedProducts
