'use client';

import React, { useState, useEffect } from 'react';
import BulkUploadModal from '@/components/pharmacy/BulkUploadModal';

interface Category {
    id: string;
    name: string;
    description?: string;
    type: string;
    color?: string;
    _count?: { medicines: number };
}

interface Medicine {
    id: string;
    name: string;
    genericName?: string;
    manufacturer?: string;
    type: string;
    strength?: string;
    unit: string;
    description?: string;
    currentStock: number;
    reorderLevel: number;
    purchasePrice: number;
    sellingPrice: number;
    mrp: number;
    batchNumber?: string;
    expiryDate?: string;
    barcode?: string;
    categories: Array<{
        category: Category;
    }>;
}

export default function PharmacyPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showAddMedicine, setShowAddMedicine] = useState(false);
    const [showEditMedicine, setShowEditMedicine] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchMedicines();
        fetchCategories();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/medicines');

            if (!res.ok) {
                throw new Error('Failed to fetch medicines');
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setMedicines(data);
            } else {
                console.error('API returned non-array data:', data);
                setMedicines([]);
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
            setMedicines([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this medicine?')) return;
        try {
            await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
            fetchMedicines();
        } catch (error) {
            console.error('Error deleting medicine:', error);
        }
    };

    const filteredMedicines = Array.isArray(medicines)
        ? medicines.filter((med) => {
            const matchesSearch = searchQuery
                ? med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
                : true;

            const matchesType = typeFilter === 'all' || med.type === typeFilter;

            const matchesCategory = categoryFilter === 'all' ||
                med.categories.some(c => c.category.id === categoryFilter);

            let matchesStock = true;
            if (stockFilter === 'low') {
                matchesStock = med.currentStock > 0 && med.currentStock <= med.reorderLevel;
            } else if (stockFilter === 'out') {
                matchesStock = med.currentStock === 0;
            } else if (stockFilter === 'in') {
                matchesStock = med.currentStock > med.reorderLevel;
            }

            return matchesSearch && matchesType && matchesStock && matchesCategory;
        })
        : [];

    const getStockBadge = (medicine: Medicine) => {
        if (medicine.currentStock === 0) {
            return <span className="badge bg-red-100 text-red-700 border-red-200">Out of Stock</span>;
        } else if (medicine.currentStock <= medicine.reorderLevel) {
            return <span className="badge bg-amber-100 text-amber-700 border-amber-200">Low Stock</span>;
        }
        return <span className="badge bg-green-100 text-green-700 border-green-200">In Stock</span>;
    };

    const stats = {
        total: Array.isArray(medicines) ? medicines.length : 0,
        inStock: Array.isArray(medicines) ? medicines.filter(m => m.currentStock > m.reorderLevel).length : 0,
        lowStock: Array.isArray(medicines) ? medicines.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel).length : 0,
        outOfStock: Array.isArray(medicines) ? medicines.filter(m => m.currentStock === 0).length : 0,
    };

    const medicineTypes = ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Ointment', 'Drops', 'Inhaler'];

    return (
        <div className="w-full px-6 py-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Pharmacy Management</h1>
                        <p className="text-sm text-gray-500">Manage medicines, stock, and inventory</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Manage Categories
                        </button>
                        <button onClick={() => setShowBulkUpload(true)} className="btn btn-secondary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Bulk Upload
                        </button>
                        <button onClick={() => setShowAddMedicine(true)} className="btn btn-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Medicine
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Total Medicines</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">In Stock</p>
                                    <p className="text-2xl font-semibold text-green-600">{stats.inStock}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Low Stock</p>
                                    <p className="text-2xl font-semibold text-amber-600">{stats.lowStock}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Out of Stock</p>
                                    <p className="text-2xl font-semibold text-red-600">{stats.outOfStock}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="card-content">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search medicines..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input pl-10"
                                />
                            </div>

                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-select">
                                <option value="all">All Types</option>
                                {medicineTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="form-select">
                                <option value="all">All Stock</option>
                                <option value="in">In Stock</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>

                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-select">
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {filteredMedicines.length} of {medicines.length} medicines
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medicine Grid/List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
                </div>
            ) : filteredMedicines.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
                    <p className="text-sm text-gray-500 mb-6">Add your first medicine to get started</p>
                    <button onClick={() => setShowAddMedicine(true)} className="btn btn-primary">
                        Add Medicine
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
                    {filteredMedicines.map((medicine) => (
                        <MedicineCard
                            key={medicine.id}
                            medicine={medicine}
                            viewMode={viewMode}
                            onEdit={(med) => {
                                setSelectedMedicine(med);
                                setShowEditMedicine(true);
                            }}
                            onDelete={handleDelete}
                            onStock={(med) => {
                                setSelectedMedicine(med);
                                setShowStockModal(true);
                            }}
                            getStockBadge={getStockBadge}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {showAddMedicine && (
                <AddMedicineModal
                    categories={categories}
                    onClose={() => setShowAddMedicine(false)}
                    onSuccess={() => {
                        setShowAddMedicine(false);
                        fetchMedicines();
                    }}
                    medicineTypes={medicineTypes}
                />
            )}

            {showEditMedicine && selectedMedicine && (
                <EditMedicineModal
                    medicine={selectedMedicine}
                    categories={categories}
                    onClose={() => {
                        setShowEditMedicine(false);
                        setSelectedMedicine(null);
                    }}
                    onSuccess={() => {
                        setShowEditMedicine(false);
                        setSelectedMedicine(null);
                        fetchMedicines();
                    }}
                    medicineTypes={medicineTypes}
                />
            )}

            {showStockModal && selectedMedicine && (
                <StockModal
                    medicine={selectedMedicine}
                    onClose={() => {
                        setShowStockModal(false);
                        setSelectedMedicine(null);
                    }}
                    onSuccess={() => {
                        setShowStockModal(false);
                        setSelectedMedicine(null);
                        fetchMedicines();
                    }}
                />
            )}

            {showCategoryModal && (
                <CategoryModal
                    categories={categories}
                    onClose={() => setShowCategoryModal(false)}
                    onSuccess={() => {
                        setShowCategoryModal(false);
                        fetchCategories();
                        fetchMedicines();
                    }}
                />
            )}

            {showBulkUpload && (
                <BulkUploadModal
                    categories={categories}
                    onClose={() => setShowBulkUpload(false)}
                    onSuccess={() => {
                        setShowBulkUpload(false);
                        fetchMedicines();
                    }}
                />
            )}
        </div>
    );
}

// Medicine Card Component
function MedicineCard({
                          medicine,
                          viewMode,
                          onEdit,
                          onDelete,
                          onStock,
                          getStockBadge,
                      }: {
    medicine: Medicine;
    viewMode: 'grid' | 'list';
    onEdit: (medicine: Medicine) => void;
    onDelete: (id: string) => void;
    onStock: (medicine: Medicine) => void;
    getStockBadge: (medicine: Medicine) => JSX.Element;
}) {
    if (viewMode === 'list') {
        return (
            <div className="card card-hover">
                <div className="card-content">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                            <div className="col-span-2">
                                <h3 className="text-sm font-semibold text-gray-900">{medicine.name}</h3>
                                <p className="text-xs text-gray-500">{medicine.genericName || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="badge bg-gray-100 text-gray-700 border-gray-200 text-xs">{medicine.type}</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-900">{medicine.currentStock} {medicine.unit}</p>
                                {getStockBadge(medicine)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-teal-600">₹{medicine.sellingPrice}</p>
                                <p className="text-xs text-gray-500">MRP: ₹{medicine.mrp}</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => onStock(medicine)} className="btn btn-sm btn-secondary">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    Stock
                                </button>
                                <button onClick={() => onEdit(medicine)} className="btn btn-sm btn-ghost text-gray-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button onClick={() => onDelete(medicine.id)} className="btn btn-sm btn-ghost text-red-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card card-hover">
            <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">{medicine.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{medicine.genericName || 'No generic name'}</p>
                    </div>
                    {getStockBadge(medicine)}
                </div>

                <div className="space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="badge bg-gray-100 text-gray-700 border-gray-200">{medicine.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Stock:</span>
                        <span className="font-medium text-gray-900">{medicine.currentStock} {medicine.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium text-teal-600">₹{medicine.sellingPrice}</span>
                    </div>
                    {medicine.manufacturer && (
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Mfg:</span>
                            <span className="text-gray-700 truncate ml-2">{medicine.manufacturer}</span>
                        </div>
                    )}
                </div>

                {medicine.categories.length > 0 && (
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                            {medicine.categories.slice(0, 3).map((mc) => (
                                <span key={mc.category.id} className="badge bg-teal-50 text-teal-700 border-teal-200 text-xs">
                                    {mc.category.name}
                                </span>
                            ))}
                            {medicine.categories.length > 3 && (
                                <span className="badge bg-gray-50 text-gray-600 border-gray-200 text-xs">
                                    +{medicine.categories.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => onStock(medicine)} className="flex-1 btn btn-sm btn-primary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        Stock
                    </button>
                    <button onClick={() => onEdit(medicine)} className="btn btn-sm btn-ghost text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button onClick={() => onDelete(medicine.id)} className="btn btn-sm btn-ghost text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add Medicine Modal
function AddMedicineModal({ categories, onClose, onSuccess, medicineTypes }: {
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
    medicineTypes: string[];
}) {
    const [formData, setFormData] = useState({
        name: '', genericName: '', manufacturer: '', type: 'Tablet', strength: '', unit: 'Strip',
        description: '', currentStock: '0', reorderLevel: '10', purchasePrice: '0',
        sellingPrice: '0', mrp: '0', batchNumber: '', expiryDate: '', barcode: '', categoryIds: [] as string[]
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch('/api/medicines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) { onSuccess(); } else { alert('Failed to add medicine'); }
        } catch (error) {
            alert('Error adding medicine');
        } finally { setSubmitting(false); }
    };

    const handleCategoryToggle = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter((id: string) => id !== categoryId)
                : [...prev.categoryIds, categoryId]
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold text-gray-900">Add New Medicine</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Medicine Name <span className="text-red-500">*</span></label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input" placeholder="Paracetamol 500mg" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Generic Name</label>
                                <input type="text" value={formData.genericName} onChange={(e) => setFormData({...formData, genericName: e.target.value})} className="form-input" placeholder="Acetaminophen" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Manufacturer</label>
                                <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} className="form-input" placeholder="XYZ Pharma" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type <span className="text-red-500">*</span></label>
                                <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="form-select">
                                    {medicineTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Strength</label>
                                <input type="text" value={formData.strength} onChange={(e) => setFormData({...formData, strength: e.target.value})} className="form-input" placeholder="500mg" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit <span className="text-red-500">*</span></label>
                                <select required value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="form-select">
                                    <option>Strip</option><option>Bottle</option><option>Box</option><option>Piece</option><option>Tube</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="form-textarea" placeholder="Medicine description..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Current Stock</label>
                                <input type="number" min="0" value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reorder Level</label>
                                <input type="number" min="0" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch Number</label>
                                <input type="text" value={formData.batchNumber} onChange={(e) => setFormData({...formData, batchNumber: e.target.value})} className="form-input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Purchase Price (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Selling Price (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">MRP (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="form-input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Expiry Date</label>
                                <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Barcode</label>
                                <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="form-input" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categories / Diseases</label>
                            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg">
                                {categories.map((cat: Category) => (
                                    <button key={cat.id} type="button" onClick={() => handleCategoryToggle(cat.id)} className={`badge ${formData.categoryIds.includes(cat.id) ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-teal-50 hover:border-teal-300'}`}>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            {submitting ? 'Adding...' : 'Add Medicine'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit Medicine Modal
function EditMedicineModal({ medicine, categories, onClose, onSuccess, medicineTypes }: {
    medicine: Medicine;
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
    medicineTypes: string[];
}) {
    const [formData, setFormData] = useState({
        name: medicine.name, genericName: medicine.genericName || '', manufacturer: medicine.manufacturer || '',
        type: medicine.type, strength: medicine.strength || '', unit: medicine.unit,
        description: medicine.description || '', reorderLevel: medicine.reorderLevel.toString(),
        purchasePrice: medicine.purchasePrice.toString(), sellingPrice: medicine.sellingPrice.toString(),
        mrp: medicine.mrp.toString(), batchNumber: medicine.batchNumber || '',
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
        barcode: medicine.barcode || '',
        categoryIds: medicine.categories.map((mc) => mc.category.id)
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch(`/api/medicines/${medicine.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) { onSuccess(); } else { alert('Failed to update medicine'); }
        } catch (error) {
            alert('Error updating medicine');
        } finally { setSubmitting(false); }
    };

    const handleCategoryToggle = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter((id: string) => id !== categoryId)
                : [...prev.categoryIds, categoryId]
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Medicine</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Medicine Name <span className="text-red-500">*</span></label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Generic Name</label>
                                <input type="text" value={formData.genericName} onChange={(e) => setFormData({...formData, genericName: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Manufacturer</label>
                                <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type <span className="text-red-500">*</span></label>
                                <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="form-select">
                                    {medicineTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Strength</label>
                                <input type="text" value={formData.strength} onChange={(e) => setFormData({...formData, strength: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit <span className="text-red-500">*</span></label>
                                <select required value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="form-select">
                                    <option>Strip</option><option>Bottle</option><option>Box</option><option>Piece</option><option>Tube</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} className="form-textarea" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Reorder Level</label>
                                <input type="number" min="0" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch Number</label>
                                <input type="text" value={formData.batchNumber} onChange={(e) => setFormData({...formData, batchNumber: e.target.value})} className="form-input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Purchase Price (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Selling Price (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">MRP (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="form-input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Expiry Date</label>
                                <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Barcode</label>
                                <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="form-input" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Categories / Diseases</label>
                            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg">
                                {categories.map((cat: Category) => (
                                    <button key={cat.id} type="button" onClick={() => handleCategoryToggle(cat.id)} className={`badge ${formData.categoryIds.includes(cat.id) ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-teal-50 hover:border-teal-300'}`}>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            {submitting ? 'Updating...' : 'Update Medicine'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Stock Adjustment Modal
function StockModal({ medicine, onClose, onSuccess }: {
    medicine: Medicine;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch(`/api/medicines/${medicine.id}/stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, quantity: parseInt(quantity), reason, notes }),
            });
            if (response.ok) { onSuccess(); } else { alert('Failed to adjust stock'); }
        } catch (error) {
            alert('Error adjusting stock');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold text-gray-900">Stock Adjustment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">Current Stock: <span className="font-medium text-teal-600">{medicine.currentStock} {medicine.unit}</span></p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Transaction Type <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => setType('IN')} className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${type === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700 hover:border-green-300'}`}>
                                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    Stock In
                                </button>
                                <button type="button" onClick={() => setType('OUT')} className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${type === 'OUT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-700 hover:border-red-300'}`}>
                                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                    </svg>
                                    Stock Out
                                </button>
                                <button type="button" onClick={() => setType('ADJUSTMENT')} className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${type === 'ADJUSTMENT' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Adjust
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Quantity <span className="text-red-500">*</span></label>
                            <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="form-input" placeholder={type === 'ADJUSTMENT' ? 'Set stock to...' : 'Enter quantity'} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reason</label>
                            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="form-input" placeholder="Purchase order, Sale, Damaged, etc." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="form-textarea" placeholder="Additional notes..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            {submitting ? 'Saving...' : 'Save Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Category Management Modal
function CategoryModal({ categories, onClose, onSuccess }: {
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '', type: 'Disease' });
    const [submitting, setSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
            if (response.ok) {
                setNewCategory({ name: '', description: '', type: 'Disease' });
                setShowAdd(false);
                onSuccess();
            } else { alert('Failed to add category'); }
        } catch (error) {
            alert('Error adding category');
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        try {
            await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            onSuccess();
        } catch (error) {
            alert('Error deleting category');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    {!showAdd ? (
                        <div>
                            <button onClick={() => setShowAdd(true)} className="btn btn-primary w-full mb-4">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Category
                            </button>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {categories.map((cat: Category) => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{cat.name}</h4>
                                            <p className="text-sm text-gray-500">{cat.type} • {cat._count?.medicines || 0} medicines</p>
                                        </div>
                                        <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-700">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">Category Name <span className="text-red-500">*</span></label>
                                <input required type="text" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} className="form-input" placeholder="e.g., Fever, Pain Relief" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select value={newCategory.type} onChange={(e) => setNewCategory({...newCategory, type: e.target.value})} className="form-select">
                                    <option>Disease</option><option>Symptom</option><option>MedicineType</option><option>BodySystem</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} rows={2} className="form-textarea" />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn btn-ghost flex-1">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                                    {submitting ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}