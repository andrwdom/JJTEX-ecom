import React, { useEffect, useState } from 'react'
import { productAPI } from '../services/api'
import { toast } from 'react-toastify'
import EditProduct from './EditProduct'

const List = ({ token }) => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)

  const fetchList = async () => {
    try {
      setLoading(true)
      const response = await productAPI.list()
      
      if (response.success) {
        setList(response.products.reverse());
      } else {
        toast.error(response.message || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const removeProduct = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product?')) {
      return
    }

    try {
      const response = await productAPI.remove(id)
      
      if (response.success) {
        toast.success(response.message || 'Product removed successfully')
        await fetchList();
      } else {
        toast.error(response.message || 'Failed to remove product')
      }
    } catch (error) {
      console.error('Error removing product:', error)
      toast.error(error.response?.data?.message || 'Failed to remove product')
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {editingProduct ? (
        <EditProduct 
          product={editingProduct} 
          token={token} 
          onClose={() => setEditingProduct(null)}
          onUpdate={fetchList}
        />
      ) : (
        <>
          <p className='mb-2'>All Products List</p>
          <div className='flex flex-col gap-2'>
            {/* ------- List Table Title ---------- */}
            <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
              <b>Image</b>
              <b>Name</b>
              <b>Category</b>
              <b>Price</b>
              <b className='text-center'>Edit</b>
              <b className='text-center'>Remove</b>
            </div>

            {/* ------ Product List ------ */}
            {list.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found. Add your first product!
              </div>
            ) : (
              list.map((item, index) => (
                <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm' key={index}>
                  <img className='w-12 h-12 object-cover rounded' src={item.image[0]} alt={item.name} />
                  <p className="truncate">{item.name}</p>
                  <p>{item.category}</p>
                  <p>₹{item.price}</p>
                  <button
                    onClick={() => setEditingProduct(item)}
                    className='text-center py-1 px-2 bg-purple-400 text-white rounded hover:bg-purple-600 transition-colors'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeProduct(item._id)}
                    className='text-center py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  )
}

export default List