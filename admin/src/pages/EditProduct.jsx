import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const EditProduct = ({ product, token, onClose, onUpdate }) => {
  const [image1, setImage1] = useState(null)
  const [image2, setImage2] = useState(null)
  const [image3, setImage3] = useState(null)
  const [image4, setImage4] = useState(null)
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description)
  const [price, setPrice] = useState(product.price)
  const [category, setCategory] = useState(product.category)
  const [subCategory, setSubCategory] = useState(product.subCategory)
  const [bestseller, setBestseller] = useState(product.bestseller)
  const [sizes, setSizes] = useState(product.sizes || [])

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()

      formData.append("id", product._id)
      formData.append("name", name)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("category", category)
      formData.append("subCategory", subCategory)
      formData.append("bestseller", bestseller)
      formData.append("sizes", JSON.stringify(sizes))

      if (image1) formData.append("image1", image1)
      if (image2) formData.append("image2", image2)
      if (image3) formData.append("image3", image3)
      if (image4) formData.append("image4", image4)

      const response = await axios.post(
        backendUrl + "/api/product/update",
        formData,
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(response.data.message)
        onUpdate()
        onClose()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <div className="flex justify-between items-center w-full">
        <h2 className="text-xl font-semibold">Edit Product</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div>
        <p className='mb-2'>Product Images</p>
        <div className='flex gap-2'>
          <label htmlFor="image1" className="cursor-pointer">
            <img
              className='w-20 h-20 object-cover border rounded'
              src={image1 ? URL.createObjectURL(image1) : product.image[0]}
              alt=""
            />
            <input
              onChange={(e) => setImage1(e.target.files[0])}
              type="file"
              id="image1"
              hidden
            />
          </label>
          <label htmlFor="image2" className="cursor-pointer">
            <img
              className='w-20 h-20 object-cover border rounded'
              src={image2 ? URL.createObjectURL(image2) : (product.image[1] || assets.upload_area)}
              alt=""
            />
            <input
              onChange={(e) => setImage2(e.target.files[0])}
              type="file"
              id="image2"
              hidden
            />
          </label>
          <label htmlFor="image3" className="cursor-pointer">
            <img
              className='w-20 h-20 object-cover border rounded'
              src={image3 ? URL.createObjectURL(image3) : (product.image[2] || assets.upload_area)}
              alt=""
            />
            <input
              onChange={(e) => setImage3(e.target.files[0])}
              type="file"
              id="image3"
              hidden
            />
          </label>
          <label htmlFor="image4" className="cursor-pointer">
            <img
              className='w-20 h-20 object-cover border rounded'
              src={image4 ? URL.createObjectURL(image4) : (product.image[3] || assets.upload_area)}
              alt=""
            />
            <input
              onChange={(e) => setImage4(e.target.files[0])}
              type="file"
              id="image4"
              hidden
            />
          </label>
        </div>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className='w-full max-w-[500px] px-3 py-2 border rounded'
          type="text"
          placeholder='Type here'
          required
        />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className='w-full max-w-[500px] px-3 py-2 border rounded'
          rows="4"
          placeholder='Write content here'
          required
        />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full px-3 py-2 border rounded'
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub category</p>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className='w-full px-3 py-2 border rounded'
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Product Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className='w-full px-3 py-2 border rounded sm:w-[120px]'
            type="number"
            placeholder='25'
            required
          />
        </div>
      </div>

      <div>
        <p className='mb-2'>Product Sizes</p>
        <div className='flex gap-3'>
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div
              key={size}
              onClick={() => setSizes(prev =>
                prev.includes(size)
                  ? prev.filter(item => item !== size)
                  : [...prev, size]
              )}
              className="cursor-pointer"
            >
              <p className={`${
                sizes.includes(size) ? "bg-pink-100" : "bg-slate-200"
              } px-3 py-1 rounded transition-colors`}>
                {size}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className='flex gap-2 mt-2'>
        <input
          onChange={() => setBestseller(prev => !prev)}
          checked={bestseller}
          type="checkbox"
          id='bestseller'
        />
        <label className='cursor-pointer' htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className='px-6 py-2 bg-purple-400 text-white rounded hover:bg-purple-600 transition-colors'
        >
          Update
        </button>
        <button
          type="button"
          onClick={onClose}
          className='px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default EditProduct 