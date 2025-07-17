import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { categories } from '../data/categories.jsx';
import { useLocation } from 'react-router-dom';

const Collection = () => {
  const { products, search, showSearch, setSearch, setShowSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortType, setSortType] = useState('relevant');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const location = useLocation();

  // Reset search when directly navigating to Collection page
  useEffect(() => {
    // Check if we came from a direct navigation (not from search)
    const fromSearch = location.state?.fromSearch;
    if (!fromSearch) {
      setSearch('');
      setShowSearch(false);
    }
  }, [location]);

  const toggleExpand = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const toggleItem = (item) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      }
      return [...prev, item];
    });
  };

  const applyFilter = () => {
    setIsSearching(true);
    let productsCopy = [...products];

    if (showSearch && search) {
      const searchTerm = search.toLowerCase().trim();
      productsCopy = productsCopy.filter(item => {
        const itemName = item.name.toLowerCase();
        const itemCategory = item.category.toLowerCase();
        const itemSubCategory = item.subCategory.toLowerCase();
        
        const searchWords = searchTerm.split(' ');
        return searchWords.every(word => 
          itemName.includes(word) || 
          itemCategory.includes(word) || 
          itemSubCategory.includes(word)
        );
      });
    }

    if (selectedCategory) {
      productsCopy = productsCopy.filter(item => 
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedSubcategory) {
      productsCopy = productsCopy.filter(item => 
        item.subCategory.toLowerCase() === selectedSubcategory.toLowerCase()
      );
    }

    if (selectedItems.length > 0) {
      productsCopy = productsCopy.filter(item => 
        selectedItems.some(selectedItem => 
          item.type?.toLowerCase() === selectedItem.toLowerCase()
        )
      );
    }

    setFilterProducts(productsCopy);
    setIsSearching(false);
  };

  const sortProduct = () => {
    let fpCopy = [...filterProducts];

    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a,b) => (a.price - b.price)));
        break;
      case 'high-low':
        setFilterProducts(fpCopy.sort((a,b) => (b.price - a.price)));
        break;
      default:
        applyFilter();
        break;
    }
  };

  useEffect(() => {
      applyFilter();
  }, [selectedCategory, selectedSubcategory, selectedItems, search, showSearch, products]);

  useEffect(() => {
    sortProduct();
  }, [sortType]);

  return (
    <div className='flex flex-col sm:flex-row gap-1 pt-8 border-t w-full'>
      {/* Filter Panel */}
      <div className='w-full sm:w-40 md:w-48 lg:w-56 flex-shrink-0'>
        <div className='sticky top-20'>
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className='w-full sm:hidden flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100 mb-4'
          >
            <span className='font-medium text-gray-800'>Filters</span>
            <svg 
              className={`w-5 h-5 transition-transform ${showFilter ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`${showFilter ? 'block' : 'hidden'} sm:block space-y-6`}>
            {/* Filter Header */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-gray-800'>Filters</h2>
              {selectedItems.length > 0 && (
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Categories */}
            <div className='space-y-2'>
              {Object.entries(categories).map(([categoryKey, categoryData]) => (
                <div key={categoryKey} className='bg-white rounded-xl overflow-hidden'>
                  <button
                    onClick={() => toggleExpand(categoryKey)}
                    className='w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors hover:bg-gray-50'
                  >
                    <span className='font-medium text-gray-800'>{categoryData.name}</span>
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform ${expandedCategories[categoryKey] ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${
                    expandedCategories[categoryKey] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}>
                    <div className='p-4 space-y-6 bg-gray-50'>
                      {Object.entries(categoryData.subcategories).map(([subKey, subData]) => (
                        <div key={subKey} className='space-y-3'>
                          <div className='flex items-center gap-2 text-gray-700'>
                            <span className='text-lg'>{subData.icon}</span>
                            <span className='font-medium'>{subData.name}</span>
                          </div>
                          <div className='ml-7 space-y-2'>
                            {subData.items.map((item, index) => (
                              <label key={index} className='flex items-center gap-3 group cursor-pointer'>
                                <div className='relative flex items-center'>
                                  <input
                                    type='checkbox'
                                    checked={selectedItems.includes(item)}
                                    onChange={() => toggleItem(item)}
                                    className='w-4 h-4 border-2 rounded text-pink-500 focus:ring-pink-500 focus:ring-offset-0 transition-colors cursor-pointer'
                                  />
                                </div>
                                <span className='text-sm text-gray-600 group-hover:text-pink-600 transition-colors'>
                                  {item}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 w-full'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
          <Title text1={'ALL'} text2={'COLLECTIONS'} />

          {/* Sort Dropdown */}
          <div className="relative inline-block w-full sm:w-48">
            <select 
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-200 focus:border-pink-300 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1rem'
              }}
            >
              <option value="relevant">Sort by: Relevant</option>
              <option value="low-high">Sort by: Low to High</option>
              <option value="high-low">Sort by: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedItems.map((item, index) => (
              <span key={index} 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-pink-50 text-pink-700 border border-pink-100 transition-colors hover:bg-pink-100">
                {item}
                <button 
                  onClick={() => toggleItem(item)}
                  className="hover:text-pink-900 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Results Info */}
        {search && (
          <div className="mb-6 text-sm text-gray-600">
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
                <span>Searching...</span>
              </div>
            ) : (
              <p>Showing {filterProducts.length} results for "{search}"</p>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8 w-full'>
          {filterProducts.length > 0 ? (
            filterProducts.map((item, index) => (
              <ProductItem 
                key={index} 
                name={item.name} 
                id={item._id} 
                price={item.price} 
                image={item.image} 
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-600">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">{search ? 'Try adjusting your search or filters' : 'No products available in this category'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
