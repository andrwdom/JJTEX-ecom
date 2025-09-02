import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { productAPI } from '../services/api'
import { toast } from 'react-toastify'
import { categories } from '../data/categories'

const Add = ({ token }) => {
  const [image1, setImage1] = useState(null)
  const [image2, setImage2] = useState(null)
  const [image3, setImage3] = useState(null)
  const [image4, setImage4] = useState(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("kids")
  const [subcategory, setSubcategory] = useState("boys")
  const [itemType, setItemType] = useState("")
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes] = useState([])
  const [sizeStocks, setSizeStocks] = useState({ S: '', M: '', L: '', XL: '', XXL: '' })
  const [loading, setLoading] = useState(false)

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

  const handleImageChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setter(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !description || !price || !category || !subcategory || !itemType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!image1 && !image2 && !image3 && !image4) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subcategory);
      formData.append("type", itemType);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes.map(size => ({ 
        size, 
        stock: Number(sizeStocks[size] || 0) 
      }))));

      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);

      const response = await productAPI.add(formData);

      if (response.success) {
        toast.success(response.message || 'Product added successfully');
        // Reset form
        setName('');
        setDescription('');
        setPrice('');
        setImage1(null);
        setImage2(null);
        setImage3(null);
        setImage4(null);
        setBestseller(false);
        setSizes([]);
        setSizeStocks({ S: '', M: '', L: '', XL: '', XXL: '' });
      } else {
        toast.error(response.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col w-full items-start gap-3'>
      <div>
        <p className='mb-2'>Upload Image</p>
        <div className='flex gap-2'>
          <label className='border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors'>
            <input 
              type="file" 
              onChange={(e) => handleImageChange(e, setImage1)}
              className='hidden' 
              accept="image/*"
            />
            <img src={assets.upload_area} alt="" className='w-20 h-20' />
            <p className='text-sm text-gray-500 mt-2'>Image 1</p>
          </label>
          <label className='border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors'>
            <input 
              type="file" 
              onChange={(e) => handleImageChange(e, setImage2)}
              className='hidden' 
              accept="image/*"
            />
            <img src={assets.upload_area} alt="" className='w-20 h-20' />
            <p className='text-sm text-gray-500 mt-2'>Image 2</p>
          </label>
          <label className='border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors'>
            <input 
              type="file" 
              onChange={(e) => handleImageChange(e, setImage3)}
              className='hidden' 
              accept="image/*"
            />
            <img src={assets.upload_area} alt="" className='w-20 h-20' />
            <p className='text-sm text-gray-500 mt-2'>Image 3</p>
          </label>
          <label className='border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors'>
            <input 
              type="file" 
              onChange={(e) => handleImageChange(e, setImage4)}
              className='hidden' 
              accept="image/*"
            />
            <img src={assets.upload_area} alt="" className='w-20 h-20' />
            <p className='text-sm text-gray-500 mt-2'>Image 4</p>
          </label>
        </div>
      </div>

      <div className='flex flex-col gap-3 w-full'>
        <input 
          onChange={(e) => setName(e.target.value)} 
          value={name} 
          className='border border-gray-300 rounded-md px-3 py-2' 
          type="text" 
          placeholder='Product Name' 
          required 
        />
        <textarea 
          onChange={(e) => setDescription(e.target.value)} 
          value={description} 
          className='border border-gray-300 rounded-md px-3 py-2' 
          placeholder='Product Description' 
          rows="3"
          required 
        />
        <input 
          onChange={(e) => setPrice(e.target.value)} 
          value={price} 
          className='border border-gray-300 rounded-md px-3 py-2' 
          type="number" 
          placeholder='Product Price' 
          required 
        />
      </div>

      <div className='flex gap-3 w-full'>
        <select 
          onChange={(e) => setCategory(e.target.value)} 
          value={category} 
          className='border border-gray-300 rounded-md px-3 py-2 flex-1'
        >
          {Object.keys(categories).map(cat => (
            <option key={cat} value={cat}>{categories[cat].name}</option>
          ))}
        </select>
        <select 
          onChange={(e) => setSubcategory(e.target.value)} 
          value={subcategory} 
          className='border border-gray-300 rounded-md px-3 py-2 flex-1'
        >
          {getSubcategories().map(sub => (
            <option key={sub} value={sub}>{categories[category]?.subcategories[sub]?.name || sub}</option>
          ))}
        </select>
        <select 
          onChange={(e) => setItemType(e.target.value)} 
          value={itemType} 
          className='border border-gray-300 rounded-md px-3 py-2 flex-1'
        >
          {getItemTypes().map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className='flex items-center gap-2'>
        <input 
          type="checkbox" 
          checked={bestseller} 
          onChange={(e) => setBestseller(e.target.checked)} 
          id="bestseller"
        />
        <label htmlFor="bestseller">Bestseller</label>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Sizes & Stock</p>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
          {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
            <div key={size} className='flex flex-col gap-1'>
              <label className='text-sm font-medium'>{size}</label>
              <input 
                type="number" 
                min="0"
                value={sizeStocks[size]} 
                onChange={(e) => setSizeStocks(prev => ({ ...prev, [size]: e.target.value }))}
                className='border border-gray-300 rounded-md px-2 py-1 text-sm'
                placeholder='Stock'
              />
            </div>
          ))}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`px-6 py-2 rounded-md text-white transition-colors ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Adding Product...' : 'Add Product'}
      </button>
    </form>
  )
}

export default Add