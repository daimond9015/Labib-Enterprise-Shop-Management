
import React, { useState } from 'react';
import type { Customer, Payment } from '../types';
import { MoneyIcon } from './ui/Icons';

interface CustomersProps {
    customers: Customer[];
    addCustomer: (customer: Omit<Customer, 'id'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (id: string) => void;
    addCustomerPayment: (id: string, amount: number, date: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, addCustomer, updateCustomer, deleteCustomer, addCustomerPayment }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalDue = filteredCustomers.reduce((sum, c) => sum + c.dueAmount, 0);

    const handleOpenModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(false);
    };

    const handleOpenPaymentModal = (customer: Customer) => {
        setSelectedCustomerForPayment(customer);
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setSelectedCustomerForPayment(null);
        setIsPaymentModalOpen(false);
    };

    const handleSaveCustomer = (customerData: Omit<Customer, 'id'>) => {
        if (editingCustomer) {
            updateCustomer({ ...customerData, id: editingCustomer.id });
        } else {
            addCustomer(customerData);
        }
        handleCloseModal();
    };

    const handleDeleteConfirm = () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Customers</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition duration-300"
                >
                    Add Customer
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Search by Name, Phone or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                    />
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Outstanding Due</p>
                    <p className="text-2xl font-bold text-red-500">${totalDue.toFixed(2)}</p>
                </div>
            </div>

            {/* Customers List */}
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Phone</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Due Amount</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <td className="p-4 text-slate-700 dark:text-slate-200">{customer.id}</td>
                                <td className="p-4 font-medium text-slate-800 dark:text-white">{customer.name}</td>
                                <td className="p-4 text-slate-700 dark:text-slate-200">{customer.phone}</td>
                                <td className="p-4">
                                    <span className={`font-bold ${customer.dueAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        ${customer.dueAmount.toFixed(2)}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex justify-end items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenPaymentModal(customer)} 
                                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-md transition"
                                        title="Pay Due"
                                    >
                                        <MoneyIcon className="w-4 h-4" />
                                        <span>Pay</span>
                                    </button>
                                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                    <button onClick={() => handleOpenModal(customer)} className="text-primary-600 hover:text-primary-800">Edit</button>
                                    <button onClick={() => setCustomerToDelete(customer)} className="text-red-600 hover:text-red-800 ml-2">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                    <p className="text-center text-slate-500 py-10">No customers found.</p>
                )}
            </div>

            {isModalOpen && (
                <CustomerModal
                    customer={editingCustomer}
                    onSave={handleSaveCustomer}
                    onClose={handleCloseModal}
                />
            )}

            {isPaymentModalOpen && selectedCustomerForPayment && (
                <PaymentHistoryModal
                    customer={selectedCustomerForPayment}
                    onAddPayment={addCustomerPayment}
                    onClose={handleClosePaymentModal}
                />
            )}

            {customerToDelete && (
                <DeleteConfirmationModal
                    customer={customerToDelete}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setCustomerToDelete(null)}
                />
            )}
        </div>
    );
};

interface CustomerModalProps {
    customer: Customer | null;
    onSave: (data: Omit<Customer, 'id'>) => void;
    onClose: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        dueAmount: customer?.dueAmount || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
                    {customer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Customer Name"
                            required
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Phone Number"
                            required
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Amount ($)</label>
                        <input
                            type="number"
                            name="dueAmount"
                            value={formData.dueAmount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{ customer: Customer; onConfirm: () => void; onClose: () => void; }> = ({ customer, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Deletion</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">"{customer.name}"</span>?
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

// Payment History Modal
interface PaymentHistoryModalProps {
    customer: Customer;
    onAddPayment: (id: string, amount: number, date: string) => void;
    onClose: () => void;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ customer, onAddPayment, onClose }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (numAmount > 0) {
            onAddPayment(customer.id, numAmount, date);
            setAmount(''); // Reset amount but keep modal open
        }
    };

    const payments = customer.payments || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{customer.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400">Payment History</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-bold">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Current Due Status */}
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                        <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">Current Outstanding Due:</span>
                        <span className={`text-2xl font-bold ${customer.dueAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ${customer.dueAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* Add Payment Form */}
                    <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">Record New Payment</h3>
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="p-2 bg-slate-50 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount ($)"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                min="0.01"
                                step="0.01"
                                className="p-2 bg-slate-50 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 flex-1"
                                required
                            />
                            <button 
                                type="submit" 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition"
                            >
                                Add Payment
                            </button>
                        </form>
                    </div>

                    {/* History Table */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">Transaction History</h3>
                        <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-600">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                                        <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Transaction ID</th>
                                        <th className="p-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {payments.length > 0 ? (
                                        payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="p-3 text-slate-700 dark:text-slate-200">{payment.date}</td>
                                                <td className="p-3 text-xs text-slate-500 dark:text-slate-400 font-mono">{payment.id}</td>
                                                <td className="p-3 font-bold text-green-600 dark:text-green-400 text-right">
                                                    +${payment.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-slate-500">No payment history recorded.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-bold py-2 px-6 rounded hover:bg-slate-300 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Customers;