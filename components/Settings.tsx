import React, { useState } from 'react';
import type { Theme } from '../types';
import { SunIcon, MoonIcon, MonitorIcon } from './ui/Icons';

interface SettingsProps {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    onClearData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, onThemeChange, onClearData }) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const handleClearDataClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmClear = () => {
        onClearData();
        setIsConfirmModalOpen(false);
    };

    const themeOptions = [
        { value: 'light', label: 'Light', icon: SunIcon },
        { value: 'dark', label: 'Dark', icon: MoonIcon },
        { value: 'system', label: 'System', icon: MonitorIcon },
    ];

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>

            {/* Appearance Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-white mb-4">Appearance</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Choose how the application looks. System will match your OS settings.</p>
                <div className="grid grid-cols-3 gap-4">
                    {themeOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => onThemeChange(option.value as Theme)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all duration-200
                                ${theme === option.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`
                            }
                        >
                            <option.icon className="w-8 h-8" />
                            <span className="font-semibold">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Management Settings */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-red-500/20 dark:border-red-500/30">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    This action is irreversible. All your products, sales, expenses, and customer data will be permanently deleted.
                </p>
                <button
                    onClick={handleClearDataClick}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300"
                >
                    Clear All Application Data
                </button>
            </div>

            {isConfirmModalOpen && (
                <ConfirmationModal
                    onConfirm={handleConfirmClear}
                    onClose={() => setIsConfirmModalOpen(false)}
                />
            )}
        </div>
    );
};

// Confirmation Modal for Data Deletion
const ConfirmationModal: React.FC<{ onConfirm: () => void; onClose: () => void; }> = ({ onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Are you absolutely sure?</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    This action cannot be undone. All data will be permanently erased. Please confirm you want to proceed.
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold py-2 px-5 rounded-lg hover:bg-slate-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700 transition"
                    >
                        Confirm & Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;