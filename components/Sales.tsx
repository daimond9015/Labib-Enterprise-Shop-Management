import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Product, CartItem, Sale, Customer } from '../types';
import { ScanIcon } from './ui/Icons';

declare const jsQR: any;

interface SalesProps {
  products: Product[];
  customers: Customer[];
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
}

const Sales: React.FC<SalesProps> = ({ products, customers, addSale, addCustomer }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Due'>('Cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, products]);

  const addToCart = (product: Product, quantityToAdd: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      // --- Logic for EXISTING item in cart ---
      if (existingItem) {
          const newCartQuantity = existingItem.cartQuantity + quantityToAdd;
          // Check against available stock
          if (newCartQuantity > product.quantity) {
              alert(`Cannot add ${quantityToAdd} more of "${product.name}".\n\nRequested total: ${newCartQuantity}\nAvailable stock: ${product.quantity}\nAlready in cart: ${existingItem.cartQuantity}`);
              return prevCart; // Return original cart without changes
          }
          // Update quantity for the existing item
          return prevCart.map(item =>
            item.id === product.id ? { 
                ...item, 
                cartQuantity: newCartQuantity,
                cost: item.purchasePrice * newCartQuantity 
            } : item
          );
      } 
      // --- Logic for NEW item in cart ---
      else {
        // Check against available stock
        if (quantityToAdd > product.quantity) {
             alert(`Cannot add ${quantityToAdd} of "${product.name}".\n\nOnly ${product.quantity} is available in stock.`);
             return prevCart; // Return original cart without changes
        }
        // Add the new item to the cart
        const newCartItem: CartItem = {
            id: product.id,
            name: product.name,
            category: product.category,
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            quantity: product.quantity,
            dateAdded: product.dateAdded,
            cartQuantity: quantityToAdd,
            cost: product.purchasePrice * quantityToAdd
        };
        return [...prevCart, newCartItem];
      }
    });
    setSearchTerm(''); // Clear search after successful add
  };

  const handleProductSelect = (product: Product) => {
    setProductToAdd(product);
    setIsQuantityModalOpen(true);
  };
  
  const handleQuantityConfirm = (quantity: number) => {
    if (productToAdd) {
        addToCart(productToAdd, quantity);
    }
    setIsQuantityModalOpen(false);
    setProductToAdd(null);
  };

  const quickAddToCart = (product: Product) => {
      addToCart(product, 1);
  }

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && newQuantity > 0 && newQuantity <= product.quantity) {
      setCart(cart.map(item => 
        item.id === productId 
        ? { 
            ...item, 
            cartQuantity: newQuantity,
            cost: item.purchasePrice * newQuantity
          } 
        : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.sellingPrice * item.cartQuantity, 0), [cart]);
  const finalAmount = useMemo(() => subtotal - discount, [subtotal, discount]);
  
  const clearFormState = () => {
      setCart([]);
      setSearchTerm('');
      setDiscount(0);
      setPaymentMethod('Cash');
      setSelectedCustomerId('');
  };

  const handleCompleteSale = () => {
    if(cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    if (paymentMethod === 'Due' && !selectedCustomerId) {
        alert("Please select a customer for Due payments.");
        return;
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const newSale: Omit<Sale, 'id' | 'date'> = {
        items: cart,
        total: subtotal,
        discount,
        finalAmount,
        paymentMethod,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'
    };
    addSale(newSale);
    clearFormState();
    alert("Sale completed successfully!");
  };

  const handleAddNewCustomer = (data: Omit<Customer, 'id'>) => {
      addCustomer(data);
      setIsAddCustomerModalOpen(false);
  };
  
  const handleReset = () => {
      if (cart.length > 0) {
          if (!window.confirm("Are you sure you want to clear the current sale?")) return;
      }
      clearFormState();
  };

  return (
    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Point of Sale</h1>
            <button 
                onClick={handleReset}
                className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition duration-300 flex items-center gap-2"
            >
                <span>New Sale / Reset</span>
            </button>
        </div>
        
        <div className="flex gap-2 mb-4 relative z-20">
            <div className="relative flex-grow">
                <input
                    type="text"
                    placeholder="Search for products to add..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                />
                {searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 rounded-lg shadow-lg mt-1 overflow-hidden">
                    {searchResults.map(p => (
                        <li key={p.id} onClick={() => handleProductSelect(p)} className="p-3 hover:bg-primary-100 dark:hover:bg-primary-900 cursor-pointer">
                        {p.name} - ${p.sellingPrice} ({p.quantity} in stock)
                        </li>
                    ))}
                    </ul>
                )}
            </div>
            <button 
                onClick={() => setIsQuickAddOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-lg shadow transition flex items-center justify-center min-w-[50px]"
                title="Quick Add by ID / Scan"
            >
                <ScanIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left min-w-[500px] lg:min-w-0">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-2 font-semibold text-slate-600 dark:text-slate-300">Product</th>
                <th className="p-2 font-semibold text-slate-600 dark:text-slate-300">Price</th>
                <th className="p-2 font-semibold text-slate-600 dark:text-slate-300 w-24">Quantity</th>
                <th className="p-2 font-semibold text-slate-600 dark:text-slate-300">Total</th>
                <th className="p-2 font-semibold text-slate-600 dark:text-slate-300"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td className="p-2 font-medium text-slate-800 dark:text-white">{item.name}</td>
                  <td className="p-2 text-slate-700 dark:text-slate-200">${item.sellingPrice.toFixed(2)}</td>
                  <td className="p-2">
                    <input type="number" value={item.cartQuantity} onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-700 rounded text-center" />
                  </td>
                  <td className="p-2 text-slate-700 dark:text-slate-200">${(item.sellingPrice * item.cartQuantity).toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cart.length === 0 && <p className="text-center text-slate-500 py-10">Your cart is empty.</p>}
        </div>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl shadow-inner p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Order Summary</h2>
        <div className="space-y-4 flex-grow">
            <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Customer</label>
                <div className="flex gap-2">
                    <select 
                        value={selectedCustomerId} 
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex-1 p-2 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600"
                    >
                        <option value="">Walk-in Customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} (Due: ${c.dueAmount})</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => setIsAddCustomerModalOpen(true)}
                        className="bg-primary-600 text-white p-2 rounded hover:bg-primary-700 transition"
                        title="Add New Customer"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex justify-between text-lg">
                <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                <span className="font-semibold text-slate-800 dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
             <div className="flex justify-between items-center text-lg">
                <label htmlFor="discount" className="text-slate-600 dark:text-slate-300">Discount ($)</label>
                <input id="discount" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 p-1 rounded bg-white dark:bg-slate-700 text-right font-semibold text-slate-800 dark:text-white" />
            </div>
             <div className="border-t border-slate-300 dark:border-slate-600 my-4"></div>
             <div className="flex justify-between text-2xl font-bold">
                <span className="text-slate-800 dark:text-white">Total</span>
                <span className="text-primary-600">${finalAmount.toFixed(2)}</span>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Payment Method</h3>
            <div className="grid grid-cols-3 gap-2 mb-6">
                {(['Cash', 'Card', 'Due'] as const).map(method => (
                    <button key={method} onClick={() => setPaymentMethod(method)} className={`p-2 rounded-lg font-semibold text-center transition ${paymentMethod === method ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>{method}</button>
                ))}
            </div>
            <button onClick={handleCompleteSale} className="w-full bg-green-500 text-white font-bold text-lg py-4 rounded-lg shadow-lg hover:bg-green-600 transition">
                Complete Sale
            </button>
        </div>
      </div>

      {isQuickAddOpen && (
          <QuickAddModal 
            products={products} 
            onAdd={quickAddToCart} 
            onClose={() => setIsQuickAddOpen(false)} 
          />
      )}
      
      {isAddCustomerModalOpen && (
          <SimpleCustomerModal 
            onSave={handleAddNewCustomer}
            onClose={() => setIsAddCustomerModalOpen(false)}
          />
      )}

      {isQuantityModalOpen && productToAdd && (
          <QuantityModal 
            product={productToAdd}
            onConfirm={handleQuantityConfirm}
            onClose={() => setIsQuantityModalOpen(false)}
          />
      )}
    </div>
  );
};

interface QuantityModalProps {
    product: Product;
    onConfirm: (quantity: number) => void;
    onClose: () => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({ product, onConfirm, onClose }) => {
    const [quantity, setQuantity] = useState(1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleConfirm = () => {
        if (quantity > 0 && quantity <= product.quantity) {
            onConfirm(quantity);
        } else {
            alert(`Please enter a quantity between 1 and ${product.quantity}.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{product.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">In Stock: {product.quantity}</p>
                <input
                    ref={inputRef}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                    className="w-full p-4 text-lg bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-primary-500 focus:ring-0 mb-4"
                    min="1"
                    max={product.quantity}
                />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 transition">Cancel</button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">Add to Cart</button>
                </div>
            </div>
        </div>
    );
};

interface QuickAddModalProps {
    products: Product[];
    onAdd: (product: Product) => void;
    onClose: () => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ products, onAdd, onClose }) => {
    const [scanId, setScanId] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isScanPaused, setIsScanPaused] = useState(false); // Cooldown state
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number>();

    const startScan = async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", "true"); // Required for iOS
                    await videoRef.current.play();
                    streamRef.current = stream;
                    setIsScanning(true);
                    requestRef.current = requestAnimationFrame(tick);
                }
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setMessage({ text: "Could not access camera.", type: 'error' });
        }
    };

    const stopScan = useCallback(() => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsScanning(false);
    }, []);

    const tick = () => {
        // Do not scan if a cooldown is active
        if (isScanPaused) {
            requestRef.current = requestAnimationFrame(tick);
            return;
        }

        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code) {
                        setIsScanPaused(true); // Pause scanning to prevent duplicates
                        const product = products.find(p => p.id === code.data);
                        if(product) {
                            onAdd(product);
                            setMessage({ text: `Added: ${product.name}`, type: 'success' });
                        } else {
                            setMessage({ text: 'Product not found!', type: 'error' });
                        }
                        // Cooldown period before scanning can resume
                        setTimeout(() => {
                            setIsScanPaused(false);
                            setMessage(null);
                        }, 1500);
                    }
                }
            }
        }
        requestRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        if(!isScanning) {
           inputRef.current?.focus();
        }
        return () => {
            stopScan(); // Ensure camera stops when component unmounts or modal closes
        };
    }, [isScanning, stopScan]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = scanId.trim();
        if (!trimmedId) return;

        const product = products.find(p => p.id === trimmedId);
        
        if (product) {
            onAdd(product);
            setMessage({ text: `Added: ${product.name}`, type: 'success' });
        } else {
            setMessage({ text: 'Product not found!', type: 'error' });
        }
        setScanId(''); 

        // Clear message after a delay
        setTimeout(() => setMessage(null), 1500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ScanIcon className="w-5 h-5" />
                        Quick Add / Scan
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl">&times;</button>
                </div>
                
                {!isScanning && (
                    <>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Scan a barcode or type the Product ID and press Enter.
                        </p>
                        <form onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Product ID (e.g., P001)"
                                value={scanId}
                                onChange={(e) => setScanId(e.target.value)}
                                className="w-full p-4 text-lg bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-primary-500 focus:ring-0 mb-4"
                            />
                        </form>
                    </>
                )}
                
                <div className="relative w-full aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden mb-4">
                     <video ref={videoRef} className={`w-full h-full object-cover ${!isScanning && 'hidden'}`} />
                     <canvas ref={canvasRef} className="hidden" />
                     {!isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-slate-500">Camera is off</p>
                        </div>
                     )}
                </div>

                {message && (
                    <div className={`p-3 rounded-lg mb-4 text-center font-semibold ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-between items-center gap-2">
                    {isScanning ? (
                        <button type="button" onClick={stopScan} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition" title="Stop camera">
                            Stop Scanning
                        </button>
                    ) : (
                        <button type="button" onClick={startScan} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition" title="Start camera">
                            Start Scanning
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const SimpleCustomerModal: React.FC<{ onSave: (data: Omit<Customer, 'id'>) => void; onClose: () => void; }> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', dueAmount: 0 });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Add New Customer</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                    <input type="tel" placeholder="Phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Sales;