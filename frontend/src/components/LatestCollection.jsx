import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const LatestCollection = () => {
    const { products, currency } = useContext(ShopContext)
    const [latestProducts, setLatestProducts] = useState([])

    useEffect(() => {
        console.log('Products in Latest Collection:', products) // Debug log
        setLatestProducts(products.slice(0, 5))
    }, [products])

    return (
        <section className="py-16 px-4">
            {/* Title with lines */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-20 h-px bg-gray-300"></div>
                    <h2 className="text-3xl font-medium">
                        <span className="text-gray-900">LATEST </span>
                        <span className="text-[#ff69b4]">COLLECTIONS</span>
                    </h2>
                    <div className="w-20 h-px bg-gray-300"></div>
                </div>
                <p className="text-gray-600 max-w-3xl mx-auto">
                New styles that celebrate tradition, comfort, and everyday elegance
                </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                {latestProducts.map((product) => (
                    <Link 
                        to={`/product/${product._id}`} 
                        key={product._id}
                        className="group"
                    >
                        <div className="bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-md transition-shadow">
                            {/* Product Image */}
                            <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-gray-50 mb-4">
                                <img 
                                    src={product.image[0]} 
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            
                            {/* Product Info */}
                            <div className="px-2">
                                <h3 className="text-gray-800 font-medium mb-1">
                                    {product.name}
                                </h3>
                                <p className="text-[#FF6EBB] font-semibold">
                                    {currency}{product.price}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Placeholder cards if no products */}
                {latestProducts.length === 0 && (
                    Array(5).fill(null).map((_, index) => (
                        <div key={index} className="bg-white rounded-[2rem] p-4 shadow-sm">
                            <div className="aspect-[4/5] rounded-[1.5rem] bg-gray-100 mb-4"></div>
                            <div className="px-2">
                                <div className="h-4 bg-gray-100 rounded mb-2"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}

export default LatestCollection
