
import React, { useState } from 'react';
import type { Expense } from '../types';

interface ExpensesProps {
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, addExpense, updateExpense, deleteExpense }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

    // Get unique categories for filter
    const uniqueCategories = Array.from(new Set(expenses.map(e => e.category))).sort();

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const handleOpenModal = (expense: Expense | null = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingExpense(null);
        setIsModalOpen(false);
    };

    const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
        if (editingExpense) {
            updateExpense({ ...expenseData, id: editingExpense.id });
        } else {
            addExpense(expenseData);
        }
        handleCloseModal();
    };

    const handleDeleteConfirm = () => {
        if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Expenses</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition duration-300"
                >
                    Add Expense
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4 w-full md:w-auto flex-1">
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-r-8 border-transparent focus:border-primary-500 focus:ring-0 text-slate-700 dark:text-slate-200"
                    >
                        <option value="All">All Categories</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">${totalFilteredAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Expenses List */}
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Title</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <td className="p-4 text-slate-700 dark:text-slate-200">{expense.date}</td>
                                <td className="p-4 font-medium text-slate-800 dark:text-white">{expense.title}</td>
                                <td className="p-4">
                                    <span className="bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-sm">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-slate-800 dark:text-white">${expense.amount.toFixed(2)}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleOpenModal(expense)} className="text-primary-600 hover:text-primary-800 mr-4">Edit</button>
                                    <button onClick={() => setExpenseToDelete(expense)} className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredExpenses.length === 0 && (
                    <p className="text-center text-slate-500 py-10">No expenses found matching your criteria.</p>
                )}
            </div>

            {isModalOpen && (
                <ExpenseModal
                    expense={editingExpense}
                    onSave={handleSaveExpense}
                    onClose={handleCloseModal}
                />
            )}

            {expenseToDelete && (
                <DeleteConfirmationModal
                    expense={expenseToDelete}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setExpenseToDelete(null)}
                />
            )}
        </div>
    );
};

interface ExpenseModalProps {
    expense: Expense | null;
    onSave: (data: Omit<Expense, 'id'>) => void;
    onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ expense, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: expense?.title || '',
        category: expense?.category || '',
        amount: expense?.amount || '',
        date: expense?.date || new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title: formData.title,
            category: formData.category,
            amount: Number(formData.amount),
            date: formData.date
        });
    };

    const commonCategories = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Other'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
                    {expense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Electricity Bill"
                            required
                            className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <div className="relative">
                            <input
                                list="categories"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="Select or type..."
                                required
                                className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-primary-500 focus:ring-0"
                            />
                            <datalist id="categories">
                                {commonCategories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
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

const DeleteConfirmationModal: React.FC<{ expense: Expense; onConfirm: () => void; onClose: () => void; }> = ({ expense, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Confirm Deletion</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">"{expense.title}"</span>?
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

export default Expenses;
