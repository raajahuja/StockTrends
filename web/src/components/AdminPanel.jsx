import React from 'react';

const AdminPanel = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#1e293b]">
                    <h2 className="text-xl font-bold text-white font-[family-name:var(--font-display)]">Admin Control Center</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">System Status</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-sm text-slate-300">API Server Online (http://localhost:3001)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-left">
                                <h4 className="text-sm font-bold text-white">Refetch Data</h4>
                                <p className="text-xs text-slate-400 mt-1">Manual trigger for index sync</p>
                            </button>
                            <button className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-left">
                                <h4 className="text-sm font-bold text-white">Cache Clear</h4>
                                <p className="text-xs text-slate-400 mt-1">Reset local aggregation cache</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Close Panel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
