import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';

import {
  logout, clearAuthError, toggleWishlistThunk,
  addItem, removeItem, updateQuantity, clearCart,
  openCart, closeCart, toggleCart, openSearch, closeSearch,
} from '@store/index';
import { debounce } from '@utils/helpers';

// ─── useAuth ──────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate  = useNavigate();
  const { user, token, loading, error } = useSelector(s => s.auth);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully.');
  }, [dispatch, navigate]);

  const requireAuth = useCallback((cb) => {
    if (!user) {
      toast.error('Please log in to continue.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    if (cb) cb();
    return true;
  }, [user, navigate]);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return { user, token, loading, error, isAdmin, handleLogout, requireAuth, isLoggedIn: !!user };
};

// ─── useCart ──────────────────────────────────────────────────────────────────
export const useCart = () => {
  const dispatch = useDispatch();
  const cart     = useSelector(s => s.cart);

  const addToCart = useCallback((product) => {
    dispatch(addItem(product));
    dispatch(openCart());
    toast.success(`${product.name || 'Item'} added to cart!`, {
      icon: '🛒',
      style: { fontWeight: 500 },
    });
  }, [dispatch]);

  const removeFromCart = useCallback((item) => {
    dispatch(removeItem(item));
    toast.success('Item removed from cart.');
  }, [dispatch]);

  const changeQuantity = useCallback((item) => {
    dispatch(updateQuantity(item));
  }, [dispatch]);

  const emptyCart = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  return {
    ...cart,
    addToCart,
    removeFromCart,
    changeQuantity,
    emptyCart,
    openCart: () => dispatch(openCart()),
    closeCart: () => dispatch(closeCart()),
    toggleCart: () => dispatch(toggleCart()),
  };
};

// ─── useWishlist ──────────────────────────────────────────────────────────────
export const useWishlist = () => {
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const navigate   = useNavigate();

  const isWishlisted = useCallback((productId) => {
    return !!user?.wishlist?.includes?.(productId);
  }, [user]);

  const toggleWishlist = useCallback((productId, productName) => {
    if (!user) {
      toast.error('Please log in to save items.');
      navigate('/login');
      return;
    }
    const wasWishlisted = isWishlisted(productId);
    dispatch(toggleWishlistThunk(productId));
    toast.success(wasWishlisted ? 'Removed from wishlist' : `${productName || 'Item'} saved!`, {
      icon: wasWishlisted ? '💔' : '❤️',
    });
  }, [dispatch, user, isWishlisted, navigate]);

  return { isWishlisted, toggleWishlist, wishlist: user?.wishlist || [] };
};

// ─── useDebounce ──────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
};

// ─── useScrollTop ─────────────────────────────────────────────────────────────
export const useScrollTop = () => {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
};

// ─── useScrollLock ────────────────────────────────────────────────────────────
export const useScrollLock = (locked) => {
  useEffect(() => {
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [locked]);
};

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue; }
    catch { return initialValue; }
  });
  const set = useCallback((v) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  const remove = useCallback(() => {
    setValue(initialValue);
    localStorage.removeItem(key);
  }, [key, initialValue]);
  return [value, set, remove];
};

// ─── useOutsideClick ─────────────────────────────────────────────────────────
export const useOutsideClick = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// ─── useKeyPress ─────────────────────────────────────────────────────────────
export const useKeyPress = (key, callback) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === key) callback(e); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback]);
};

// ─── useAnimateOnScroll ───────────────────────────────────────────────────────
export const useAnimateOnScroll = (options = {}) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1, ...options });
  return { ref, inView };
};

// ─── useCountUp ──────────────────────────────────────────────────────────────
export const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const { ref, inView } = useAnimateOnScroll();

  useEffect(() => {
    if (!inView || hasStarted) return;
    setHasStarted(true);
    const step = (end - start) / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, start, duration, hasStarted]);

  return { count, ref };
};

// ─── useProductFilters ────────────────────────────────────────────────────────
export const useProductFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    page: 1, sort: 'newest', minPrice: '', maxPrice: '',
    sizes: [], colors: [], ...initialFilters,
  });

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const toggleArrayFilter = useCallback((key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const updated = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [key]: updated, page: 1 };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ page: 1, sort: 'newest', minPrice: '', maxPrice: '', sizes: [], colors: [], ...initialFilters });
  }, [initialFilters]);

  const setPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return { filters, setFilter, toggleArrayFilter, resetFilters, setPage };
};

// ─── useUI ────────────────────────────────────────────────────────────────────
export const useUI = () => {
  const dispatch = useDispatch();
  const ui       = useSelector(s => s.ui);
  return {
    ...ui,
    openSearch:  () => dispatch(openSearch()),
    closeSearch: () => dispatch(closeSearch()),
  };
};
