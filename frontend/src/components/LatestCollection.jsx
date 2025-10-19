import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductCard from './ProductCard'

const LatestCollection = () => {
    const { products } = useContext(ShopContext)
    const [latestProducts, setLatestProducts] = useState([])

    useEffect(() => {
        console.log('Products in Latest Collection:', products) // Debug log
        console.log('Products type:', typeof products, 'Is Array:', Array.isArray(products))
        // Ensure products is an array before slicing
        if (Array.isArray(products)) {
            setLatestProducts(products.slice(0, 5))
        } else {
            console.warn('Products is not an array:', products)
            setLatestProducts([])
        }
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
                {Array.isArray(latestProducts) && latestProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
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
