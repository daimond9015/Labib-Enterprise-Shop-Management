import React, { useState } from 'react';
import type { Product } from '../types';

interface ProductsProps {
    products: Product[];
    addProduct: (product: Omit<Product, 'id' | 'dateAdded'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
}

// Renamed from ProductSearchDetail to be more generic for viewing product details
const ProductDetailModal: React.FC<{ product: Product; onClose: () => void; }> = ({ product, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{product.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">ID: {product.id}</p>
                    </div>
                    <button onClick={onClose} className="text-2xl font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white">&times;</button>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Category</span>
                        <span className="text-slate-800 dark:text-white">{product.category}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Purchase Price</span>
                        <span className="text-slate-800 dark:text-white">${product.purchasePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Selling Price</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">${product.sellingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Stock Quantity</span>
                        <span className={`font-bold ${product.quantity <= 10 ? 'text-red-500' : 'text-blue-500'}`}>{product.quantity} pcs</span>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Confirmation Modal for Deletion
const DeleteConfirmationModal: React.FC<{ product: Product; onConfirm: () => void; onClose: () => void; }> = ({ product, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
             <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Deletion</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Are you sure you want to delete <span className="font-bold text-red-600">"{product.name}"</span>?
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

const Products: React.FC<ProductsProps> = ({ products, addProduct, updateProduct, deleteProduct }) => {
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter States
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [stockFilter, setStockFilter] = useState('All');

    // Modal & Action States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewingProductDetail, setViewingProductDetail] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    // Get Unique Categories
    const uniqueCategories = Array.from(new Set(products.map(p => p.category))).sort();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);

        // Check for exact ID match to show detail pop-up
        const exactMatch = products.find(p => p.id.toLowerCase() === newSearchTerm.toLowerCase());
        setViewingProductDetail(exactMatch || null);
    };

    const handleCloseDetailModal = () => {
        setViewingProductDetail(null);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setMinPrice('');
        setMaxPrice('');
        setStockFilter('All');
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        
        const price = p.sellingPrice;
        const min = minPrice === '' ? Number.MIN_SAFE_INTEGER : parseFloat(minPrice);
        const max = maxPrice === '' ? Number.MAX_SAFE_INTEGER : parseFloat(maxPrice);
        const matchesPrice = price >= min && price <= max;

        let matchesStock = true;
        if (stockFilter === 'Low Stock') matchesStock = p.quantity <= 10;
        if (stockFilter === 'Out of Stock') matchesStock = p.quantity === 0;
        if (stockFilter === 'In Stock') matchesStock = p.quantity > 0;

        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingProduct(null);
        setIsModalOpen(false);
    };

    const handleSaveProduct = (formData: Omit<Product, 'id' | 'dateAdded'>) => {
        if (editingProduct) {
            updateProduct({ ...formData, id: editingProduct.id, dateAdded: editingProduct.dateAdded });
        } else {
            addProduct(formData);
        }
        handleCloseModal();
    };

    const handleDeleteConfirm = () => {
        if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Products</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition duration-300"
                >
                    Add Product
                </button>
            </div>
            
            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg space-y-4">
                <div className="w-full">
                    <input
                        type="text"
                        placeholder="Search by Product ID or Name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-r-8 border-transparent focus:border-primary-500 focus:ring-0 text-slate-700 dark:text-slate-200"
                    >
                        <option value="All">All Categories</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-r-8 border-transparent focus:border-primary-500 focus:ring-0 text-slate-700 dark:text-slate-200"
                    >
                        <option value="All">All Stock Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock (≤10)</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>

                    <input 
                        type="number" 
                        placeholder="Min Price" 
                        value={minPrice} 
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-transparent focus:border-primary-500 focus:ring-0"
                    />

                    <input 
                        type="number" 
                        placeholder="Max Price" 
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-transparent focus:border-primary-500 focus:ring-0"
                    />

                    <button 
                        onClick={clearFilters}
                        className="p-3 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                        <span>Clear Filters</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Purchase Price</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Selling Price</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Quantity</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr 
                                key={product.id} 
                                className={`
                                    border-b border-slate-200 dark:border-slate-700 transition cursor-pointer
                                    ${product.quantity <= 10 
                                        ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40' 
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }
                                `}
                                onClick={() => setViewingProductDetail(product)}
                            >
                                <td className="p-4 text-slate-700 dark:text-slate-200">{product.id}</td>
                                <td className="p-4 font-medium text-slate-800 dark:text-white">{product.name}</td>
                                <td className="p-4 text-slate-700 dark:text-slate-200">{product.category}</td>
                                <td className="p-4 text-slate-700 dark:text-slate-200">${product.purchasePrice.toFixed(2)}</td>
                                <td className="p-4 text-slate-700 dark:text-slate-200">${product.sellingPrice.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.quantity <= 10 ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'}`}>
                                        {product.quantity}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }} className="text-primary-600 hover:text-primary-800 mr-2">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product); }} className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && (
                    <p className="text-center text-slate-500 py-10">No products found matching your filters.</p>
                )}
            </div>
            
            {isModalOpen && <ProductModal product={editingProduct} onSave={handleSaveProduct} onClose={handleCloseModal} />}
            {viewingProductDetail && <ProductDetailModal product={viewingProductDetail} onClose={handleCloseDetailModal} />}
            {productToDelete && <DeleteConfirmationModal product={productToDelete} onConfirm={handleDeleteConfirm} onClose={() => setProductToDelete(null)} />}
        </div>
    );
};

interface ProductModalProps {
    product: Product | null;
    onSave: (formData: Omit<Product, 'id' | 'dateAdded'>) => void;
    onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        category: product?.category || '',
        purchasePrice: product?.purchasePrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        quantity: product?.quantity || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0" />
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0" />
                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} placeholder="Purchase Price" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0" />
                    <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} placeholder="Selling Price" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0" />
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Products;