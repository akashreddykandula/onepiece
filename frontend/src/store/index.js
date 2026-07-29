import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@services/api';

// ─── Auth Slice ───────────────────────────────────────────────────────────────
const storedUser  = JSON.parse(localStorage.getItem('op_user') || 'null');
const storedToken = localStorage.getItem('op_token') || null;

export const loginUser    = createAsyncThunk('auth/login',   async (d, { rejectWithValue }) => {
  try { const r = await authAPI.login(d); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});
export const registerUser = createAsyncThunk('auth/register', async (d, { rejectWithValue }) => {
  try { const r = await authAPI.register(d); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});
export const fetchMe      = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { const r = await authAPI.getMe(); return r.data.user; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});
export const updateProfileThunk = createAsyncThunk('auth/updateProfile', async (d, { rejectWithValue }) => {
  try { const r = await authAPI.updateProfile(d); return r.data.user; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});
export const toggleWishlistThunk = createAsyncThunk('auth/toggleWishlist', async (productId, { rejectWithValue }) => {
  try { const r = await authAPI.toggleWishlist(productId); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: storedUser, token: storedToken, loading: false, error: null },
  reducers: {
    logout: (state) => {
      state.user = null; state.token = null;
      localStorage.removeItem('op_token'); localStorage.removeItem('op_user');
    },
    clearAuthError: (state) => { state.error = null; },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('op_user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (b) => {
    const loginFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('op_token', action.payload.token);
      localStorage.setItem('op_user', JSON.stringify(action.payload.user));
    };
    b
      .addCase(loginUser.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled,  loginFulfilled)
      .addCase(loginUser.rejected,   (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, loginFulfilled)
      .addCase(registerUser.rejected,(s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchMe.fulfilled,    (s, a) => {
        s.user = a.payload;
        localStorage.setItem('op_user', JSON.stringify(a.payload));
      })
      .addCase(updateProfileThunk.fulfilled, (s, a) => {
        s.user = a.payload;
        localStorage.setItem('op_user', JSON.stringify(a.payload));
      })
      .addCase(toggleWishlistThunk.fulfilled, (s, a) => {
        if (s.user) s.user.wishlist = a.payload.wishlist;
      });
  },
});
export const { logout, clearAuthError, setUser } = authSlice.actions;

// ─── Cart Slice ───────────────────────────────────────────────────────────────
const savedCart = JSON.parse(localStorage.getItem('op_cart') || '{"items":[]}');

const calcCart = (items) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count    = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : subtotal > 0 ? 79 : 0;
  const gst      = Math.round(((subtotal - 0) * 18) / 118 * 100) / 100;
  const total    = subtotal + shipping;
  return { subtotal, count, shipping, gst, total };
};

const saveCart = (items) => localStorage.setItem('op_cart', JSON.stringify({ items }));

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: savedCart.items || [], ...calcCart(savedCart.items || []) },
  reducers: {
    addItem: (state, { payload }) => {
      const { _id, size, color } = payload;
      const idx = state.items.findIndex(i => i._id === _id && i.size === size && i.color === color);
      if (idx >= 0) {
        state.items[idx].quantity += (payload.quantity || 1);
      } else {
        state.items.push({ ...payload, quantity: payload.quantity || 1 });
      }
      Object.assign(state, calcCart(state.items));
      saveCart(state.items);
    },
    removeItem: (state, { payload }) => {
      state.items = state.items.filter(i => !(i._id === payload._id && i.size === payload.size && i.color === payload.color));
      Object.assign(state, calcCart(state.items));
      saveCart(state.items);
    },
    updateQuantity: (state, { payload }) => {
      const { _id, size, color, quantity } = payload;
      const item = state.items.find(i => i._id === _id && i.size === size && i.color === color);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => !(i._id === _id && i.size === size && i.color === color));
        } else {
          item.quantity = quantity;
        }
      }
      Object.assign(state, calcCart(state.items));
      saveCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      Object.assign(state, calcCart([]));
      localStorage.removeItem('op_cart');
    },
    saveForLater: (state, { payload }) => {
      // remove from cart (just a convenience — actual "saved" list is in user profile)
      state.items = state.items.filter(i => !(i._id === payload._id && i.size === payload.size));
      Object.assign(state, calcCart(state.items));
      saveCart(state.items);
    },
  },
});
export const { addItem, removeItem, updateQuantity, clearCart, saveForLater } = cartSlice.actions;

// ─── UI Slice ─────────────────────────────────────────────────────────────────
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    cartOpen:       false,
    searchOpen:     false,
    mobileMenuOpen: false,
    preloaderDone:  false,
    toastQueue:     [],
  },
  reducers: {
    openCart:        (s) => { s.cartOpen = true; },
    closeCart:       (s) => { s.cartOpen = false; },
    toggleCart:      (s) => { s.cartOpen = !s.cartOpen; },
    openSearch:      (s) => { s.searchOpen = true; },
    closeSearch:     (s) => { s.searchOpen = false; },
    openMobileMenu:  (s) => { s.mobileMenuOpen = true; },
    closeMobileMenu: (s) => { s.mobileMenuOpen = false; },
    setPreloaderDone:(s) => { s.preloaderDone = true; },
  },
});
export const { openCart, closeCart, toggleCart, openSearch, closeSearch, openMobileMenu, closeMobileMenu, setPreloaderDone } = uiSlice.actions;

// ─── Recently Viewed Slice ────────────────────────────────────────────────────
const rvSlice = createSlice({
  name: 'recentlyViewed',
  initialState: { items: JSON.parse(localStorage.getItem('op_rv') || '[]') },
  reducers: {
    addToRecentlyViewed: (state, { payload }) => {
      state.items = [payload, ...state.items.filter(p => p._id !== payload._id)].slice(0, 12);
      localStorage.setItem('op_rv', JSON.stringify(state.items));
    },
  },
});
export const { addToRecentlyViewed } = rvSlice.actions;

// ─── Store ────────────────────────────────────────────────────────────────────
const store = configureStore({
  reducer: {
    auth:           authSlice.reducer,
    cart:           cartSlice.reducer,
    ui:             uiSlice.reducer,
    recentlyViewed: rvSlice.reducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export default store;
