
import React, { useState, useCallback } from 'react';
import {
  DashboardIcon, ProductIcon, SalesIcon, ExpenseIcon, CustomerIcon, ReportsIcon, SettingsIcon, LogoutIcon, MenuIcon, XIcon
} from './components/ui/Icons';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Customers from './components/Customers';
import Reports from './components/Reports';

import type { Product, Sale, Expense, Customer, Payment } from './types';

// Mock Data - Reset to empty as per user request
const initialProducts: Product[] = [];

const initialSales: Sale[] = [];

const initialExpenses: Expense[] = [];

const initialCustomers: Customer[] = [];


type View = 'Dashboard' | 'Products' | 'Sales' | 'Expenses' | 'Customers' | 'Reports' | 'Settings';

// Custom hook for managing all shop data with localStorage persistence
const useShopData = () => {
  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('products');
      return saved ? JSON.parse(saved) : initialProducts;
  });
  const [sales, setSales] = useState<Sale[]>(() => {
      const saved = localStorage.getItem('sales');
      return saved ? JSON.parse(saved) : initialSales;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : initialExpenses;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
      const saved = localStorage.getItem('customers');
      return saved ? JSON.parse(saved) : initialCustomers;
  });

  const saveData = <T,>(key: string, data: T) => {
      localStorage.setItem(key, JSON.stringify(data));
  };

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'dateAdded'>) => {
      setProducts(prev => {
          const newIdNumber = (Math.max(0, ...prev.map(p => parseInt(p.id.substring(1)))) || 0) + 1;
          const newProduct = {
              ...productData,
              id: `P${String(newIdNumber).padStart(3, '0')}`,
              dateAdded: new Date().toISOString().split('T')[0]
          };
          const updated = [...prev, newProduct];
          saveData('products', updated);
          return updated;
      });
  }, []);
  
  const updateProduct = useCallback((updatedProduct: Product) => {
      setProducts(prev => {
          const updated = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
          saveData('products', updated);
          return updated;
      });
  }, []);
  
  const deleteProduct = useCallback((productId: string) => {
      setProducts(prev => {
          const updated = prev.filter(p => p.id !== productId);
          saveData('products', updated);
          return updated;
      });
  }, []);

  const addSale = useCallback((saleData: Omit<Sale, 'id'|'date'>) => {
      setSales(prev => {
          const newIdNumber = (Math.max(0, ...prev.map(s => parseInt(s.id.substring(1)))) || 0) + 1;
          const newSale = {
              ...saleData,
              id: `S${String(newIdNumber).padStart(3, '0')}`,
              date: new Date().toISOString().split('T')[0]
          };
          const updated = [...prev, newSale];
          saveData('sales', updated);
          
          // Update product quantities
          setProducts(currentProducts => {
              const productsAfterSale = [...currentProducts];
              newSale.items.forEach(cartItem => {
                  const productIndex = productsAfterSale.findIndex(p => p.id === cartItem.id);
                  if(productIndex !== -1) {
                      productsAfterSale[productIndex].quantity -= cartItem.cartQuantity;
                  }
              });
              saveData('products', productsAfterSale);
              return productsAfterSale;
          });

          // Update Customer Due Amount if Payment Method is Due and Customer is selected
          if (saleData.customerId && saleData.paymentMethod === 'Due') {
              setCustomers(currentCustomers => {
                  const updatedCustomers = currentCustomers.map(c => {
                      if (c.id === saleData.customerId) {
                          return { ...c, dueAmount: c.dueAmount + saleData.finalAmount };
                      }
                      return c;
                  });
                  saveData('customers', updatedCustomers);
                  return updatedCustomers;
              });
          }
          
          return updated;
      });
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
        const newIdNumber = (Math.max(0, ...prev.map(e => parseInt(e.id.substring(1)))) || 0) + 1;
        const newExpense = {
            ...expenseData,
            id: `E${String(newIdNumber).padStart(3, '0')}`,
        };
        const updated = [...prev, newExpense];
        saveData('expenses', updated);
        return updated;
    });
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => {
        const updated = prev.map(e => e.id === updatedExpense.id ? updatedExpense : e);
        saveData('expenses', updated);
        return updated;
    });
  }, []);

  const deleteExpense = useCallback((expenseId: string) => {
    setExpenses(prev => {
        const updated = prev.filter(e => e.id !== expenseId);
        saveData('expenses', updated);
        return updated;
    });
  }, []);

  const addCustomer = useCallback((customerData: Omit<Customer, 'id'>) => {
    setCustomers(prev => {
        const newIdNumber = (Math.max(0, ...prev.map(c => parseInt(c.id.substring(1)))) || 0) + 1;
        const newCustomer = {
            ...customerData,
            id: `C${String(newIdNumber).padStart(3, '0')}`,
        };
        const updated = [...prev, newCustomer];
        saveData('customers', updated);
        return updated;
    });
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => {
        const updated = prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
        saveData('customers', updated);
        return updated;
    });
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => {
        const updated = prev.filter(c => c.id !== customerId);
        saveData('customers', updated);
        return updated;
    });
  }, []);

  const addCustomerPayment = useCallback((customerId: string, amount: number, date: string) => {
    setCustomers(prev => {
        const updated = prev.map(c => {
            if (c.id === customerId) {
                const newPayment: Payment = {
                    id: `PAY-${Date.now()}`,
                    date,
                    amount
                };
                return {
                    ...c,
                    dueAmount: c.dueAmount - amount,
                    payments: [newPayment, ...(c.payments || [])]
                };
            }
            return c;
        });
        saveData('customers', updated);
        return updated;
    });
  }, []);

  return { 
    products, sales, expenses, customers, 
    addProduct, updateProduct, deleteProduct, 
    addSale,
    addExpense, updateExpense, deleteExpense,
    addCustomer, updateCustomer, deleteCustomer, addCustomerPayment
  };
};

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded password for admin
        if (password === 'admin') {
            onLogin();
        } else {
            setError('Incorrect password');
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-200 dark:bg-slate-900">
            <div className="w-full max-w-sm p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl m-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-primary-600">Labib Enterprise</h1>
                    <p className="mt-2 text-slate-500">Shop Management</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Enter Admin Password"
                        className="w-full px-4 py-3 text-lg bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0 transition"
                    />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-transform transform hover:scale-105">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeView, setActiveView] = useState<View>('Dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { 
        products, sales, expenses, customers,
        addProduct, updateProduct, deleteProduct, 
        addSale,
        addExpense, updateExpense, deleteExpense,
        addCustomer, updateCustomer, deleteCustomer, addCustomerPayment
    } = useShopData();

    if (!isLoggedIn) {
        return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
    }

    const renderView = () => {
        switch (activeView) {
            case 'Dashboard':
                return <Dashboard products={products} sales={sales} expenses={expenses} onNavigate={setActiveView} />;
            case 'Products':
                return <Products products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct}/>;
            case 'Sales':
                return <Sales products={products} customers={customers} addSale={addSale} addCustomer={addCustomer} />;
            case 'Expenses':
                return <Expenses expenses={expenses} addExpense={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense} />;
            case 'Customers':
                return <Customers customers={customers} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} addCustomerPayment={addCustomerPayment} />;
            case 'Reports':
                return <Reports sales={sales} expenses={expenses} />;
            case 'Settings':
                return <div className="p-8"><h1 className="text-3xl font-bold">{activeView}</h1><p>This feature is under construction.</p></div>
            default:
                return <Dashboard products={products} sales={sales} expenses={expenses} onNavigate={setActiveView} />;
        }
    };

    const handleViewChange = (view: View) => {
        setActiveView(view);
        setIsMobileMenuOpen(false); // Close menu on mobile after selection
    };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
            <Sidebar 
                activeView={activeView} 
                setActiveView={handleViewChange} 
                onLogout={() => setIsLoggedIn(false)} 
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            
            <div className="flex-1 flex flex-col h-full w-full relative">
                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-slate-800 shadow-sm p-4 flex items-center justify-between z-20">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-primary-600">Labib Enterprise</span>
                    <div className="w-10" /> {/* Spacer for centering if needed, or user icon */}
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout, isOpen, onClose }) => {
    const navItems = [
        { name: 'Dashboard', icon: DashboardIcon },
        { name: 'Products', icon: ProductIcon },
        { name: 'Sales', icon: SalesIcon },
        { name: 'Expenses', icon: ExpenseIcon },
        { name: 'Customers', icon: CustomerIcon },
        { name: 'Reports', icon: ReportsIcon },
        { name: 'Settings', icon: SettingsIcon },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-40
                w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-primary-600">Labib Enterprise</h1>
                    <button onClick={onClose} className="md:hidden text-slate-500 hover:text-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.name}
                            onClick={() => setActiveView(item.name as View)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition duration-200 ${activeView === item.name ? 'bg-primary-500 text-white shadow-md' : 'hover:bg-primary-100 dark:hover:bg-slate-700'}`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="font-semibold">{item.name}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                     <button
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg text-left transition duration-200 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                    >
                        <LogoutIcon className="w-6 h-6" />
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default App;
