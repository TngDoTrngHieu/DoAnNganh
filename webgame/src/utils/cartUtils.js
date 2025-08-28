// Utility functions để quản lý giỏ hàng
export const updateCartCount = () => {
  // Trigger custom event để Header component có thể cập nhật cart count
  try {
    const raw = localStorage.getItem('cart');
    const ids = raw ? JSON.parse(raw) : [];
    const count = Array.isArray(ids) ? ids.length : 0;
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: ids }));
    return count;
  } catch {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
    return 0;
  }
};

export const addToCart = (id) => {
  try {
    const raw = localStorage.getItem('cart');
    const ids = raw ? JSON.parse(raw) : [];
    const set = new Set(Array.isArray(ids) ? ids : []);
    set.add(Number(id));
    const next = Array.from(set);
    localStorage.setItem('cart', JSON.stringify(next));
    
    // Cập nhật cart count
    updateCartCount();
    
    return true;
  } catch (e) {
    const next = [Number(id)];
    localStorage.setItem('cart', JSON.stringify(next));
    
    // Cập nhật cart count
    updateCartCount();
    
    return true;
  }
};

export const removeFromCart = (id) => {
  try {
    const raw = localStorage.getItem('cart');
    const ids = raw ? JSON.parse(raw) : [];
    const next = ids.filter(x => String(x) !== String(id));
    localStorage.setItem('cart', JSON.stringify(next));
    
    // Cập nhật cart count
    updateCartCount();
    
    return true;
  } catch {
    return false;
  }
};

export const clearCartItems = (itemIds) => {
  try {
    const raw = localStorage.getItem('cart');
    const ids = raw ? JSON.parse(raw) : [];
    const remain = Array.isArray(ids) ? ids.filter(x => !itemIds.includes(x)) : [];
    localStorage.setItem('cart', JSON.stringify(remain));
    
    // Cập nhật cart count
    updateCartCount();
    
    return true;
  } catch {
    return false;
  }
};
