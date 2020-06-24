import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { removeEmitHelper } from 'typescript';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarketplace:products');
      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    const foundProduct = products.find((productInCart) => productInCart.id === product.id);
    if (foundProduct) {
      increment(foundProduct.id);
    } else {
      setProducts([...products, { ...product, quantity: 1 }]);
      await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    }
  }, [products]);

  const increment = useCallback(async id => {
    setProducts(products.map((productInCart) => { 
      if (productInCart.id === id) {
        return { ...productInCart, quantity: productInCart.quantity + 1 };
       }
      return productInCart;
    }));
    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, [products]);

  const decrement = useCallback(async id => {
    const foundProduct = products.find((productInCart) => productInCart.id === id);
    if (!foundProduct) return;

    if (foundProduct.quantity === 1) {
      remove(foundProduct.id);
    } else {
      setProducts(products.map((productInCart) => { 
        if (productInCart.id === id) {
          return { ...productInCart, quantity: productInCart.quantity - 1 };
         }
        return productInCart;
      }));
      await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    }
  }, [products]);

  const remove = useCallback(async (id) => {
    setProducts(products.filter((productInCart) => productInCart.id !== id));
    await AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
