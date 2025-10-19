import React, { useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// Share options component
const ShareOptions = ({ product, onClose }) => {
  const shareUrl = window.location.href;
  const shareText = `Check out ${product.name} on JJ Textiles!`;

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      url: `https://web.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      mobileUrl: `whatsapp://send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    },
    {
      name: 'Facebook',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Twitter',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Copy Link',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      url: '#'
    }
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to opening share links
      window.open(shareLinks[0].url, '_blank');
    }
    onClose();
  };

  const handleShareClick = (link, index) => {
    if (link.name === 'Copy Link') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Link copied to clipboard!');
        onClose();
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    } else if (link.name === 'WhatsApp') {
      // Check if mobile or desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      window.open(isMobile ? link.mobileUrl : link.url, '_blank');
      onClose();
    } else {
      window.open(link.url, '_blank');
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Share this product</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {shareLinks.map((link, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => handleShareClick(link, index)}
            >
              <div className="text-gray-700">{link.icon}</div>
              <span className="text-sm text-gray-600">{link.name}</span>
            </button>
          ))}
        </div>
        {navigator.share && (
          <button
            onClick={handleShare}
            className="w-full mt-4 bg-primary-500 text-white rounded-full py-2 font-medium hover:bg-primary-600 transition-colors"
          >
            Share via...
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full mt-2 border border-gray-200 rounded-full py-2 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

const Product = () => {
  const { productId } = useParams();
  const { currency, addToCart, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const galleryRef = useRef(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const lastScrollY = useRef(0);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + `/api/products/${productId}`);
      if (response.data.product) {
        setProductData(response.data.product);
        setImage(response.data.product.images?.[0]);
      } else {
        toast.error('Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Optimized scroll handler with debounce
  const handleScroll = useCallback(() => {
    if (window.innerWidth >= 640) return;
    
    const currentScrollY = window.scrollY;
    const scrollThreshold = 200;
    
    // Only update if we've crossed the threshold
    if (currentScrollY > scrollThreshold && !showStickyBar) {
      setShowStickyBar(true);
    } else if (currentScrollY <= scrollThreshold && showStickyBar) {
      setShowStickyBar(false);
    }
    
    lastScrollY.current = currentScrollY;
  }, [showStickyBar]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Optimized size selection handler
  const handleSizeSelection = useCallback((item) => {
    setSize(item.size);
    setSelectedStock(item.stock);
  }, []);

  // Optimized add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!size) {
      toast.error('Select Product Size');
      return;
    }
    addToCart(productData._id, size);
  }, [size, productData, addToCart]);

  // Optimized buy now handler
  const handleBuyNow = useCallback(() => {
    if (!size) {
      toast.error('Select Product Size');
      return;
    }
    addToCart(productData._id, size);
    navigate('/place-order');
  }, [size, productData, addToCart, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Product not found</p>
      </div>
    );
  }

  return (
    <div className="border-t-2 pt-4 sm:pt-10 transition-opacity ease-in duration-500 opacity-100 bg-white min-h-screen pb-20 sm:pb-0">
      {/* Back button for mobile */}
      <div className="sm:hidden px-4 mb-2 sticky top-0 bg-white z-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-10 px-2 sm:px-8 max-w-6xl mx-auto">
        {/* Image Gallery */}
        <div className="flex-1 flex flex-col items-center w-full">
          <div className="w-full max-w-md relative">
            {/* Share button */}
            <button
              onClick={() => setShowShareOptions(true)}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <motion.img
              key={image}
              src={image}
              alt={productData.name}
              className="w-full aspect-[4/5] object-cover rounded-2xl shadow-md mb-2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            />
            {/* Thumbnails - horizontal scroll on mobile */}
            <div
              ref={galleryRef}
              className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide px-1 snap-x snap-mandatory"
            >
              {productData.image.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={productData.name}
                  className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all duration-200 snap-center ${img === image ? 'border-primary-500 scale-105' : 'border-gray-200'}`}
                  onClick={() => setImage(img)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-0"
        >
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1 text-gray-900">{productData.name}</h1>
          <p className="text-gray-600 text-base sm:text-lg mb-2">{productData.description}</p>
          <div className="text-3xl font-semibold text-primary-500 mb-2">{currency}{productData.price}</div>

          {/* Size Selector */}
          <div className="flex flex-col gap-2 my-2">
            <p className="text-sm font-medium text-gray-700 mb-1">Select Size</p>
            <div className="flex gap-2 flex-wrap">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => handleSizeSelection(item)}
                  className={`rounded-full border py-2 px-5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 ${item.size === size ? 'bg-primary-100 border-primary-500 text-primary-600 shadow' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
                  key={index}
                >
                  {item.size}
                </button>
              ))}
            </div>
            {size && (
              <div className="mt-2 w-full max-w-xs flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-medium">Stock left: <span className="font-semibold text-gray-700">{selectedStock}</span></span>
                  {selectedStock <= 5 && (
                    <motion.span
                      initial={{ scale: 0.9, opacity: 0.7 }}
                      animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="ml-2 px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 text-xs font-semibold shadow-sm"
                    >
                      Only a few left!
                    </motion.span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      selectedStock <= 5 
                        ? 'bg-red-500' 
                        : selectedStock <= 10 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min((selectedStock / 20) * 100, 100)}%`,
                      transition: { duration: 0.8, ease: "easeOut" }
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>0</span>
                  <span>20+</span>
                </div>
                {selectedStock === 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm font-medium mt-1"
                  >
                    Out of stock
                  </motion.p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons (desktop) */}
          <div className="hidden sm:flex gap-4 mt-2">
            <button 
              onClick={handleAddToCart} 
              className="bg-primary-400 rounded-full text-white px-8 py-3 text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              className="bg-black rounded-full text-white px-8 py-3 text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              BUY NOW
            </button>
          </div>
        </motion.div>
      </div>

      {/* Sticky Action Bar (mobile) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg flex sm:hidden gap-2 px-4 py-3"
          >
            <button 
              onClick={handleAddToCart} 
              className="flex-1 bg-primary-400 rounded-full text-white py-3 text-base font-semibold hover:bg-primary-600 transition-colors"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-black rounded-full text-white py-3 text-base font-semibold hover:bg-gray-800 transition-colors"
            >
              Buy Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Options Modal */}
      <AnimatePresence>
        {showShareOptions && (
          <ShareOptions product={productData} onClose={() => setShowShareOptions(false)} />
        )}
      </AnimatePresence>

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  );
};

export default Product;
