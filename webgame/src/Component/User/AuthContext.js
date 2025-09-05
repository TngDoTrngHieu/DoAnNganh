import { createContext, useState, useEffect } from "react";
import { getCurrentUser, authApi } from "../../configs/Api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    authApi().get('/carts/items/')
      .then(res => setCartCount(Array.isArray(res.data.items) ? res.data.items.length : 0))
      .catch(() => setCartCount(0));
  };

  useEffect(() => {
    getCurrentUser()
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    refreshCart(); 
  }, [user,refreshCart]);

  return (
    <AuthContext.Provider value={{ user, setUser, cartCount, setCartCount, refreshCart }}>
      {children}
    </AuthContext.Provider>
  );
};
