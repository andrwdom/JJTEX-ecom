import React, { useState, useEffect } from 'react'
import {assets} from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { categories } from '../data/categories'

const Add = ({token}) => {

  const [image1,setImage1] = useState(false)
  const [image2,setImage2] = useState(false)
  const [image3,setImage3] = useState(false)
  const [image4,setImage4] = useState(false)

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [price, setPrice] = useState("");
   const [category, setCategory] = useState("kids");
   const [subcategory, setSubcategory] = useState("boys");
   const [itemType, setItemType] = useState("");
   const [bestseller, setBestseller] = useState(false);
   const [sizes, setSizes] = useState([]);
   const [sizeStocks, setSizeStocks] = useState({ S: '', M: '', L: '', XL: '', XXL: '' });

   // Get available subcategories based on selected category
   const getSubcategories = () => {
     if (!category || !categories[category]) return [];
     return Object.keys(categories[category].subcategories);
   };

   // Get available item types based on selected category and subcategory
   const getItemTypes = () => {
     if (!category || !subcategory || !categories[category]?.subcategories[subcategory]) return [];
     return categories[category].subcategories[subcategory].items;
   };

   // Update subcategory when category changes
   useEffect(() => {
     const subcategories = getSubcategories();
     if (subcategories.length > 0) {
       setSubcategory(subcategories[0]);
     }
   }, [category]);

   // Update item type when subcategory changes
   useEffect(() => {
     const types = getItemTypes();
     if (types.length > 0) {
       setItemType(types[0]);
     }
   }, [subcategory]);

   const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      
      const formData = new FormData()

      formData.append("name",name)
      formData.append("description",description)
      formData.append("price",price)
      formData.append("category",category)
      formData.append("subCategory",subcategory)
      formData.append("type",itemType)
      formData.append("bestseller",bestseller)
      formData.append("sizes", JSON.stringify(sizes.map(size => ({ size, stock: Number(sizeStocks[size] || 0) }))));

      image1 && formData.append("image1",image1)
      image2 && formData.append("image2",image2)
      image3 && formData.append("image3",image3)
      image4 && formData.append("image4",image4)

      const response = await axios.post(backendUrl + "/api/product/add",formData,{headers:{token}})

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
   }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
        <div>
          <p className='mb-2'>Upload Image</p>

          <div className='flex gap-2'>
            <label htmlFor="image1">
              <img className='w-20' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
              <input onChange={(e)=>setImage1(e.target.files[0])} type="file" id="image1" hidden/>
            </label>
            <label htmlFor="image2">
              <img className='w-20' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
              <input onChange={(e)=>setImage2(e.target.files[0])} type="file" id="image2" hidden/>
            </label>
            <label htmlFor="image3">
              <img className='w-20' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
              <input onChange={(e)=>setImage3(e.target.files[0])} type="file" id="image3" hidden/>
            </label>
            <label htmlFor="image4">
              <img className='w-20' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
              <input onChange={(e)=>setImage4(e.target.files[0])} type="file" id="image4" hidden/>
            </label>
          </div>
        </div>

        <div className='w-full'>
          <p className='mb-2'>Product name</p>
          <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Type here' required/>
        </div>

        <div className='w-full'>
          <p className='mb-2'>Product description</p>
          <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Write content here' required/>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full'>
          <div>
            <p className='mb-2'>Category</p>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2'>
              {Object.entries(categories).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className='mb-2'>Subcategory</p>
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className='w-full px-3 py-2'>
              {getSubcategories().map(key => (
                <option key={key} value={key}>
                  {categories[category].subcategories[key].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className='mb-2'>Type</p>
            <select value={itemType} onChange={(e) => setItemType(e.target.value)} className='w-full px-3 py-2'>
              {getItemTypes().map((type, index) => (
                <option key={index} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className='mb-2'>Product Price</p>
            <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2' type="number" placeholder='25' />
          </div>
        </div>

        <div>
          <p className='mb-2'>Product Sizes & Stock</p>
          <div className='flex gap-3'>
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <div key={size} className='flex flex-col items-center'>
                <div
                  onClick={() => setSizes(prev => prev.includes(size) ? prev.filter(item => item !== size) : [...prev, size])}
                >
                  <p className={`${sizes.includes(size) ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>{size}</p>
                </div>
                {sizes.includes(size) && (
                  <input
                    type='number'
                    min='0'
                    placeholder='Stock'
                    className='w-16 mt-1 px-2 py-1 border rounded'
                    value={sizeStocks[size]}
                    onChange={e => setSizeStocks(stocks => ({ ...stocks, [size]: e.target.value }))}
                    required
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className='flex gap-2 mt-2'>
          <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' />
          <label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
        </div>

        <button type="submit" className='w-28 py-3 mt-4 bg-purple-400 hover:bg-purple-600 transition-colors px-5 rounded-xl text-white'>ADD</button>

    </form>
  )
}

export default Add