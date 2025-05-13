import { 
  FaChild, 
  FaBaby, 
  FaUserTie, 
  FaTshirt 
} from 'react-icons/fa';
import { 
  GiClothes, 
  GiDress, 
  GiJewelCrown 
} from 'react-icons/gi';

export const categories = {
  kids: {
    name: "Kids",
    subcategories: {
      boys: {
        name: "Boys Clothing",
        icon: <FaChild className="text-2xl text-blue-500" />,
        items: [
          "T-Shirts",
          "Clothing Sets",
          "Ethnic Wear",
          "Bottoms",
          "Shirts",
          "Jeans",
          "Innerwear"
        ]
      },
      girls: {
        name: "Girls Clothing",
        icon: <GiClothes className="text-2xl text-pink-500" />,
        items: [
          "Dresses & Jumpsuits",
          "Tops & Tees",
          "Ethnic Wear",
          "Skirts & Shorts",
          "Jeans",
          "Clothing Sets",
          "Innerwear"
        ]
      },
      baby: {
        name: "Baby Clothing",
        icon: <FaBaby className="text-2xl text-purple-500" />,
        items: [
          "Rompers & Bodysuits",
          "Clothing Sets",
          "Dresses",
          "T-Shirts & Tops",
          "Bottoms",
          "Girls Sets",
          "Accessories"
        ]
      },
      teens: {
        name: "Teens Clothing",
        icon: <FaUserTie className="text-2xl text-green-500" />,
        items: [
          "T-Shirts",
          "Shirts",
          "Jeans",
          "Ethnic Wear",
          "Bottoms",
          "Dresses & Jumpsuits",
          "Tops & Tees",
          "Innerwear"
        ]
      }
    }
  },
  women: {
    name: "Women",
    subcategories: {
      ethnic: {
        name: "Ethnic Wear",
        icon: <GiDress className="text-2xl text-red-500" />,
        items: [
          "Kurtas & Kurtis",
          "Kurta Sets",
          "Traditional Sarees",
          "Party Wear Sarees",
          "Blouses",
          "Lehengas",
          "Dupattas",
          "Dress Materials"
        ]
      },
      western: {
        name: "Western Wear",
        icon: <FaTshirt className="text-2xl text-indigo-500" />,
        items: [
          "Tops",
          "Tees",
          "Dresses",
          "Jumpsuits",
          "Shirts",
          "Jeans",
          "Sleepwear"
        ]
      },
      jewellery: {
        name: "Jewellery",
        icon: <GiJewelCrown className="text-2xl text-yellow-500" />,
        items: [
          "Earrings",
          "Rings"
        ]
      }
    }
  }
}; 