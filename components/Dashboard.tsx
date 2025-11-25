
import React from 'react';
import type { Product, Sale, Expense } from '../types';
// @ts-ignore
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// FIX: Import icon components
import { SalesIcon, ExpenseIcon, DashboardIcon, ProductIcon } from './ui/Icons';

interface DashboardCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => (
    <div className={`rounded-xl shadow-lg p-6 flex items-center space-x-4 ${color}`}>
        <div className="p-3 bg-white bg-opacity-30 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-lg font-medium text-white opacity-90">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    </div>
);


interface DashboardProps {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales, expenses, onNavigate }) => {
    const today = new Date().toISOString().split('T')[0];

    const todaySales = sales
        .filter(sale => sale.date === today)
        .reduce((sum, sale) => sum + sale.finalAmount, 0);

    const todayExpenses = expenses
        .filter(expense => expense.date === today)
        .reduce((sum, expense) => sum + expense.amount, 0);

    const totalStockValue = products.reduce((sum, product) => sum + (product.purchasePrice * product.quantity), 0);
    
    const totalProfit = sales.reduce((sum, sale) => {
        const cost = sale.items.reduce((itemSum, item) => itemSum + (item.purchasePrice * item.cartQuantity), 0);
        return sum + (sale.finalAmount - cost);
    }, 0);

    // Calculate last 7 days dates for chart
    const getLast7Days = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const last7Days = getLast7Days();

    const chartData = last7Days.map(date => {
        const daySales = sales
            .filter(s => s.date === date)
            .reduce((sum, s) => sum + s.finalAmount, 0);
        
        const dayExpenses = expenses
            .filter(e => e.date === date)
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            date,
            sales: daySales,
            expenses: dayExpenses
        };
    });

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                <button 
                    onClick={() => onNavigate('Sales')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2"
                >
                    <SalesIcon className="w-5 h-5" />
                    New Sale
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Today's Sales" value={`$${todaySales.toFixed(2)}`} color="bg-blue-500" icon={<SalesIcon className="w-8 h-8 text-white" />} />
                <DashboardCard title="Today's Expense" value={`$${todayExpenses.toFixed(2)}`} color="bg-orange-500" icon={<ExpenseIcon className="w-8 h-8 text-white" />} />
                <DashboardCard title="Total Profit" value={`$${totalProfit.toFixed(2)}`} color="bg-green-500" icon={<DashboardIcon className="w-8 h-8 text-white" />} />
                <DashboardCard title="Stock Value" value={`$${totalStockValue.toFixed(2)}`} color="bg-pink-500" icon={<ProductIcon className="w-8 h-8 text-white" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-white mb-4">Recent Sales & Expenses</h2>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-white mb-4">Low Stock Products</h2>
                    <ul className="space-y-3">
                        {products.filter(p => p.quantity <= 10).slice(0, 5).map(p => (
                            <li key={p.id} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-300">{p.name}</span>
                                <span className="font-bold text-red-500 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{p.quantity} left</span>
                            </li>
                        ))}
                        {products.filter(p => p.quantity <= 10).length === 0 && (
                             <p className="text-slate-500 dark:text-slate-400 text-center py-4">No low stock items. Well done!</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
