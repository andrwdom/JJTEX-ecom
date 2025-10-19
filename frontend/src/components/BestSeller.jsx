import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'

const BestSeller = () => {
    const { products } = useContext(ShopContext)
    const [bestSellers, setBestSellers] = useState([])

    useEffect(() => {
        if (Array.isArray(products)) {
            const bestSellerProducts = products.filter(product => product.bestseller === true)
            setBestSellers(bestSellerProducts)
        } else {
            setBestSellers([])
        }
    }, [products])

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    return (
        <section className="py-16 px-4">
            {/* Title with lines */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="flex items-center justify-center gap-4 mb-4">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: 80 }}
                        transition={{ duration: 0.5 }}
                        className="h-px bg-gray-300"
                    />
                    <h2 className="text-3xl font-medium">
                        <span className="text-gray-900">BEST </span>
                        <span className="text-[#ff69b4]">SELLERS</span>
                    </h2>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: 80 }}
                        transition={{ duration: 0.5 }}
                        className="h-px bg-gray-300"
                    />
                </div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-600 max-w-3xl mx-auto"
                >
                    Handpicked by customers, worn with love.
                </motion.p>
            </motion.div>

            {/* Products Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-7xl mx-auto"
            >
                {bestSellers.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}

                {/* Placeholder cards if no products */}
                {bestSellers.length === 0 && (
                    Array(5).fill(null).map((_, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-[2rem] p-4 shadow-sm"
                        >
                            <div className="aspect-[4/5] rounded-[1.5rem] bg-gray-100 mb-4 animate-pulse"></div>
                            <div className="px-2">
                                <div className="h-4 bg-gray-100 rounded mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </section>
    )
}

export default BestSeller
