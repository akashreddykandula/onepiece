// API Base
export const API_URL = import.meta.env.VITE_API_URL || "/api";

// App Info
export const APP_NAME = "ONE PIECE";
export const APP_TAGLINE = "Your Statement. Your Style.";
export const APP_URL = import.meta.env.VITE_APP_URL || "https://onepiece.in";
export const SUPPORT_EMAIL = "support@onepiece.in";
export const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";

// Razorpay
export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || "";

// Pagination
export const PAGE_SIZE = 16;
export const ADMIN_PAGE_SIZE = 20;

// Image placeholder
export const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80";
export const PLACEHOLDER_PRODUCT =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80";

// Order status config
export const ORDER_STATUSES = {
  pending: { label: "Pending", color: "status-pending", step: 0 },
  confirmed: { label: "Confirmed", color: "status-confirmed", step: 1 },
  packed: { label: "Packed", color: "status-packed", step: 2 },
  shipped: { label: "Shipped", color: "status-shipped", step: 3 },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "status-out_for_delivery",
    step: 4,
  },
  delivered: { label: "Delivered", color: "status-delivered", step: 5 },
  cancelled: { label: "Cancelled", color: "status-cancelled", step: -1 },
  return_requested: {
    label: "Return Requested",
    color: "status-returned",
    step: -1,
  },
  returned: { label: "Returned", color: "status-returned", step: -1 },
};

export const ORDER_TIMELINE_STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: "✅" },
  { key: "packed", label: "Order Packed", icon: "📦" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

// Payment methods
export const PAYMENT_METHODS = [
  {
    id: "razorpay",
    label: "UPI / Card / Net Banking",
    icon: "💳",
    description: "Pay securely via Razorpay",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: "💵",
    description: "Pay when you receive",
  },
];

// Sort options
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "trending", label: "Trending" },
];

// Filter sizes
export const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
export const SIZES_FOOTWEAR = ["5", "6", "7", "8", "9", "10", "11", "12"];

// India states
export const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];

// Nav links
export const NAV_LINKS = [
  {
    label: "Men",
    href: "/collections?category=men",
  },
  {
    label: "Women",
    href: "/collections?category=women",
  },
  {
    label: "New Arrivals",
    href: "/collections?isNewArrival=true",
  },
  {
    label: "Shop",
    mega: true,
  },
  {
    label: "Sale",
    href: "/collections?isOnSale=true",
  },
  {
    label: "Custom Print",
    href: "/custom-print",
  },
];
// Social links
export const SOCIAL_LINKS = [
  { name: "Instagram", href: "#", icon: "FiInstagram" },
  { name: "Facebook", href: "#", icon: "FiFacebook" },
  { name: "Twitter", href: "#", icon: "FiTwitter" },
  { name: "YouTube", href: "#", icon: "FiYoutube" },
];

export const SHOP_MENU = [
  {
    title: "Collections",
    links: [
      {
        label: "Shop All",
        href: "/collections",
      },
      {
        label: "Trending",
        href: "/collections?sort=trending",
      },
      {
        label: "Best Sellers",
        href: "/collections?isBestSeller=true",
      },
      {
        label: "Featured",
        href: "/collections?isFeatured=true",
      },
      {
        label: "New Arrivals",
        href: "/collections?isNewArrival=true",
      },
    ],
  },

  {
    title: "Men",
    links: [
      {
        label: "T-Shirts",
        href: "/collections?category=men&subcategory=tshirts",
      },
      {
        label: "Shirts",
        href: "/collections?category=men&subcategory=shirts",
      },
      {
        label: "Jackets",
        href: "/collections?category=men&subcategory=jackets",
      },
      {
        label: "Sportswear",
        href: "/collections?category=men&subcategory=sportswear",
      },
    ],
  },

  {
    title: "Women",
    links: [
      {
        label: "T-Shirts",
        href: "/collections?category=women&subcategory=tshirts",
      },
      {
        label: "Tops",
        href: "/collections?category=women&subcategory=tops",
      },
      {
        label: "Dresses",
        href: "/collections?category=women&subcategory=dresses",
      },
      {
        label: "Jackets",
        href: "/collections?category=women&subcategory=jackets",
      },
    ],
  },
];
