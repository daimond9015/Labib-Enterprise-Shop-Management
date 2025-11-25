import React, { useState, useMemo } from 'react';
import type { Sale, Expense } from '../types';
// @ts-ignore
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DownloadIcon } from './ui/Icons';

interface ReportsProps {
    sales: Sale[];
    expenses: Expense[];
}

const Reports: React.FC<ReportsProps> = ({ sales, expenses }) => {
    // Helper for formatting local date to YYYY-MM-DD
    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Default to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    
    const [startDate, setStartDate] = useState(formatDate(firstDay));
    const [endDate, setEndDate] = useState(formatDate(date));
    const [selectedPreset, setSelectedPreset] = useState('This Month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Filter Logic
    const filteredSales = useMemo(() => {
        return sales.filter(s => s.date >= startDate && s.date <= endDate);
    }, [sales, startDate, endDate]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.date >= startDate && e.date <= endDate);
    }, [expenses, startDate, endDate]);

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const preset = e.target.value;
        setSelectedPreset(preset);
        
        if (preset === 'Custom') return;

        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (preset) {
            case 'Today':
                // start/end = today
                break;
            case 'Yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'This Week':
                const day = today.getDay(); 
                const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
                start.setDate(diff);
                break;
            case 'Last Week':
                const lastWeekToday = new Date(today);
                lastWeekToday.setDate(today.getDate() - 7);
                const lastWeekDay = lastWeekToday.getDay();
                const lastWeekDiff = lastWeekToday.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1);
                start = new Date(lastWeekToday);
                start.setDate(lastWeekDiff);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'This Month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'Last Month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'This Year':
                start = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                return;
        }
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    // Auto-switch to "Custom" if user manually changes date
    const handleManualDateChange = (isStart: boolean, value: string) => {
        setSelectedPreset('Custom');
        if (isStart) setStartDate(value);
        else setEndDate(value);
    };

    // Metrics Calculations
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.finalAmount, 0);
    
    const totalCOGS = filteredSales.reduce((sum, sale) => {
        const cost = sale.items.reduce((itemSum, item) => itemSum + (item.purchasePrice * item.cartQuantity), 0);
        return sum + cost;
    }, 0);

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - totalExpenses;

    // Chart Data Preparation - Sales vs Expenses Over Time
    const chartData = useMemo(() => {
        const dataMap: Record<string, { date: string; sales: number; expenses: number }> = {};

        // Helper to ensure date exists in map
        const initDate = (d: string) => {
            if (!dataMap[d]) dataMap[d] = { date: d, sales: 0, expenses: 0 };
        };

        filteredSales.forEach(s => {
            initDate(s.date);
            dataMap[s.date].sales += s.finalAmount;
        });

        filteredExpenses.forEach(e => {
            initDate(e.date);
            dataMap[e.date].expenses += e.amount;
        });

        return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredSales, filteredExpenses]);

    // Chart Data Preparation - Sales by Category
    const categorySalesData = useMemo(() => {
        const categoryMap: Record<string, number> = {};

        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                // Using Gross Sales (Selling Price * Quantity) for category breakdown
                const itemTotal = item.sellingPrice * item.cartQuantity;
                if (!categoryMap[item.category]) {
                    categoryMap[item.category] = 0;
                }
                categoryMap[item.category] += itemTotal;
            });
        });

        return Object.keys(categoryMap).map(category => ({
            name: category,
            value: categoryMap[category]
        })).sort((a, b) => b.value - a.value);
    }, [filteredSales]);

    // Monthly Sales Report Data
    const monthlySalesData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(0, i).toLocaleString('en-US', { month: 'short' }),
            totalSales: 0
        }));

        sales
            .filter(sale => new Date(sale.date).getFullYear() === selectedYear)
            .forEach(sale => {
                const monthIndex = new Date(sale.date).getMonth();
                if (months[monthIndex]) {
                    months[monthIndex].totalSales += sale.finalAmount;
                }
            });
        
        return months;
    }, [sales, selectedYear]);

    const handleExport = () => {
        const headers = ['Type', 'Date', 'ID', 'Description', 'Category', 'Amount', 'Payment Method'];
        const rows = [headers.join(',')];
    
        filteredSales.forEach(sale => {
            const description = sale.items.map(i => `${i.name} x${i.cartQuantity}`).join('; ');
            const category = [...new Set(sale.items.map(i => i.category))].join('; ');
            const row = [
                'Sale',
                sale.date,
                sale.id,
                `"${description.replace(/"/g, '""')}"`, // Escape quotes
                `"${category.replace(/"/g, '""')}"`,
                sale.finalAmount.toFixed(2),
                sale.paymentMethod
            ];
            rows.push(row.join(','));
        });
    
        filteredExpenses.forEach(expense => {
            const row = [
                'Expense',
                expense.date,
                expense.id,
                `"${expense.title.replace(/"/g, '""')}"`,
                `"${expense.category.replace(/"/g, '""')}"`,
                expense.amount.toFixed(2),
                '-'
            ];
            rows.push(row.join(','));
        });
    
        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Shop_Report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Financial Reports</h1>
                
                <div className="flex flex-col lg:flex-row gap-3 w-full md:w-auto items-end md:items-center">
                    <button 
                        onClick={handleExport}
                        className="flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-sm h-10 w-full lg:w-auto"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Export CSV</span>
                    </button>

                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <select 
                            value={selectedPreset} 
                            onChange={handlePresetChange}
                            className="p-2 bg-slate-100 dark:bg-slate-700 rounded border-none text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 font-medium"
                        >
                            <option value="Today">Today</option>
                            <option value="Yesterday">Yesterday</option>
                            <option value="This Week">This Week</option>
                            <option value="Last Week">Last Week</option>
                            <option value="This Month">This Month</option>
                            <option value="Last Month">Last Month</option>
                            <option value="This Year">This Year</option>
                            <option value="Custom">Custom Range</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 hidden sm:inline">|</span>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-500 dark:text-slate-400">From</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => handleManualDateChange(true, e.target.value)} 
                                    className="p-1 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-500 dark:text-slate-400">To</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => handleManualDateChange(false, e.target.value)} 
                                    className="p-1 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">${totalRevenue.toFixed(2)}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cost of Goods Sold</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">${totalCOGS.toFixed(2)}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-teal-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gross Profit</p>
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">${grossProfit.toFixed(2)}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-cyan-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Gross Profit Margin</p>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{grossProfitMargin.toFixed(1)}%</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Operational Expenses</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">${totalExpenses.toFixed(2)}</p>
                </div>
                
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        ${netProfit.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales vs Expenses (Time) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Sales vs Expenses</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
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
                    {chartData.length === 0 && (
                        <p className="text-center text-slate-500 mt-4">No data available.</p>
                    )}
                </div>

                {/* Sales by Category (Pie Chart) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Sales by Category</h2>
                    <div className="h-64 w-full flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categorySalesData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categorySalesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2 overflow-y-auto max-h-40 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                         {categorySalesData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-sm px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-white">${item.value.toFixed(2)}</span>
                            </div>
                         ))}
                         {categorySalesData.length === 0 && <p className="text-center text-slate-500">No sales data found.</p>}
                    </div>
                </div>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales List */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col h-96">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex justify-between">
                        <span>Sales Summary</span>
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {filteredSales.length} Records
                        </span>
                    </h3>
                    <div className="overflow-y-auto flex-1 pr-2">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-2 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                    <th className="py-2 font-semibold text-slate-600 dark:text-slate-400">ID</th>
                                    <th className="py-2 font-semibold text-slate-600 dark:text-slate-400 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map(sale => (
                                    <tr key={sale.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{sale.date}</td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{sale.id}</td>
                                        <td className="py-2 font-medium text-slate-800 dark:text-white text-right">${sale.finalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col h-96">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex justify-between">
                        <span>Expenses Summary</span>
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {filteredExpenses.length} Records
                        </span>
                    </h3>
                    <div className="overflow-y-auto flex-1 pr-2">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-2 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                    <th className="py-2 font-semibold text-slate-600 dark:text-slate-400">Title</th>
                                    <th className="py-2 font-semibold text-slate-600 dark:text-slate-400 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{expense.date}</td>
                                        <td className="py-2 text-slate-700 dark:text-slate-300">{expense.title}</td>
                                        <td className="py-2 font-medium text-slate-800 dark:text-white text-right">${expense.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

             {/* Monthly Sales Report */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Monthly Sales Report</h2>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <label htmlFor="year-select" className="font-semibold text-slate-600 dark:text-slate-300">Year:</label>
                        <input
                            id="year-select"
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                            className="p-2 w-24 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlySalesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                formatter={(value: number) => `$${value.toFixed(2)}`}
                            />
                            <Legend />
                            <Bar dataKey="totalSales" name="Total Sales" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {monthlySalesData.every(m => m.totalSales === 0) && (
                    <p className="text-center text-slate-500 mt-4">No sales data available for the selected year.</p>
                )}
            </div>
        </div>
    );
};

export default Reports;