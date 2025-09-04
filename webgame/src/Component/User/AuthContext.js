import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  return (
    <AuthContext.Provider value={{ user, setUser, cartCount, setCartCount }}>
      {children}
    </AuthContext.Provider>
  );
};
