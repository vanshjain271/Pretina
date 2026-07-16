import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isCartVisible: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, variant, quantity } = action.payload;
      const minQty = product.minOrderQty || 1;
      const addQty = quantity || minQty;
      const key = variant ? `${product._id}_${variant._id}` : product._id;
      
      const existingItem = state.items.find(item => {
        const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
        return itemKey === key;
      });
      
      if (existingItem) {
        existingItem.quantity += addQty;
      } else {
        state.items.push({ product, variant, quantity: addQty });
      }
    },
    removeFromCart: (state, action) => {
      const { productId, variantId } = action.payload;
      const keyToRemove = variantId ? `${productId}_${variantId}` : productId;
      
      state.items = state.items.filter(item => {
        const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
        return itemKey !== keyToRemove;
      });
    },
    updateQuantity: (state, action) => {
      const { productId, variantId, quantity } = action.payload;
      const keyToUpdate = variantId ? `${productId}_${variantId}` : productId;
      
      const existingItem = state.items.find(item => {
        const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
        return itemKey === keyToUpdate;
      });
      
      if (existingItem) {
        const minQty = existingItem.product.minOrderQty || 1;
        let newQty = parseInt(quantity, 10);
        
        if (isNaN(newQty) || newQty <= 0) {
          state.items = state.items.filter(item => {
            const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
            return itemKey !== keyToUpdate;
          });
          return;
        }

        // Round up to nearest multiple of minQty if it's not a multiple
        if (newQty % minQty !== 0) {
           newQty = Math.ceil(newQty / minQty) * minQty;
        }

        existingItem.quantity = newQty;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    toggleCart: (state) => {
      state.isCartVisible = !state.isCartVisible;
    },
    setCartVisible: (state, action) => {
      state.isCartVisible = action.payload;
    }
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, setCartVisible } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectIsCartVisible = (state) => state.cart.isCartVisible;
export const selectCartTotalItems = (state) => state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotalPrice = (state) => state.cart.items.reduce((total, item) => {
  const price = item.variant ? (item.variant.salePrice || item.variant.price || item.product.salePrice) : item.product.salePrice;
  return total + (price * item.quantity);
}, 0);
export const selectItemQuantity = (state, productId, variantId) => {
  const keyToFind = variantId ? `${productId}_${variantId}` : productId;
  const item = state.cart.items.find(i => {
    const itemKey = i.variant ? `${i.product._id}_${i.variant._id}` : i.product._id;
    return itemKey === keyToFind;
  });
  return item ? item.quantity : 0;
};

export default cartSlice.reducer;
