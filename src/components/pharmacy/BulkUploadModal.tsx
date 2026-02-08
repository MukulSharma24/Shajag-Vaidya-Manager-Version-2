
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface Category {
    id: string;
    name: string;
    description?: string;
    type: string;
    color?: string;
    _count?: { medicines: number };
}

interface BulkUploadModalProps {
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkUploadModal({ categories, onClose, onSuccess }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        try {
            const data = await parseFile(selectedFile);
            setParsedData(data);
            setPreview(true);
        } catch (error) {
            alert('Error parsing file. Please check the format.');
            console.error(error);
        }
    };

    const parseFile = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;

                    if (file.name.endsWith('.csv')) {
                        const text = data as string;
                        const lines = text.split('\n');
                        const headers = lines[0].split(',').map(h => h.trim());

                        const parsed = lines.slice(1)
                            .filter(line => line.trim())
                            .map(line => {
                                const values = line.split(',').map(v => v.trim());
                                const obj: any = {};
                                headers.forEach((header, index) => {
                                    obj[header] = values[index] || '';
                                });
                                return obj;
                            });

                        resolve(parsed);
                    } else {
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const sheetName = workbook.SheetNames[0];
                        const sheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(sheet);
                        resolve(jsonData);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    };

    const handleUpload = async () => {
        if (parsedData.length === 0) {
            alert('No data to upload');
            return;
        }

        setUploading(true);

        try {
            const medicines = parsedData.map(row => ({
                name: row.name || row.Name || row.medicineName || row['Medicine Name'],
                genericName: row.genericName || row['Generic Name'] || '',
                manufacturer: row.manufacturer || row.Manufacturer || '',
                type: row.type || row.Type || 'Tablet',
                strength: row.strength || row.Strength || '',
                unit: row.unit || row.Unit || 'Strip',
                description: row.description || row.Description || '',
                currentStock: row.currentStock || row['Current Stock'] || row.stock || '0',
                reorderLevel: row.reorderLevel || row['Reorder Level'] || '10',
                purchasePrice: row.purchasePrice || row['Purchase Price'] || '0',
                sellingPrice: row.sellingPrice || row['Selling Price'] || '0',
                mrp: row.mrp || row.MRP || '0',
                batchNumber: row.batchNumber || row['Batch Number'] || '',
                expiryDate: row.expiryDate || row['Expiry Date'] || '',
                barcode: row.barcode || row.Barcode || '',
                categoryIds: [],
            }));

            const response = await fetch('/api/medicines/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicines }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Success! Created ${result.success.length} medicines.\n${result.failed.length > 0 ? `Failed: ${result.failed.length}` : ''}`);
                onSuccess();
            } else {
                alert('Failed to upload medicines');
            }
        } catch (error) {
            alert('Error uploading medicines');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = `name,genericName,manufacturer,type,strength,unit,description,currentStock,reorderLevel,purchasePrice,sellingPrice,mrp,batchNumber,expiryDate,barcode
Paracetamol 500mg,Acetaminophen,XYZ Pharma,Tablet,500mg,Strip,For fever and pain,100,10,5,10,12,BATCH001,2025-12-31,1234567890123
Amoxicillin 250mg,Amoxicillin,ABC Pharma,Capsule,250mg,Strip,Antibiotic,50,15,20,30,35,BATCH002,2026-06-30,9876543210987`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medicines_template.csv';
        a.click();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Medicines</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {!preview ? (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-blue-900 mb-1">Upload CSV or Excel File</h4>
                                        <p className="text-sm text-blue-700">
                                            Download the template below and fill in your medicine data. Supported formats: .csv, .xlsx, .xls
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <button onClick={downloadTemplate} className="btn btn-secondary mb-4">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Template
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Upload File <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="form-input"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Accepted formats: CSV, Excel (.xlsx, .xls)
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Columns:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div>• name (required)</div>
                                    <div>• type (required)</div>
                                    <div>• unit (required)</div>
                                    <div>• genericName</div>
                                    <div>• manufacturer</div>
                                    <div>• strength</div>
                                    <div>• currentStock</div>
                                    <div>• sellingPrice</div>
                                    <div>• mrp</div>
                                    <div>• reorderLevel</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-medium text-green-900">File Parsed Successfully!</h4>
                                        <p className="text-sm text-green-700">Found {parsedData.length} medicines ready to upload</p>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Stock</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-700">Price</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {parsedData.map((row, index) => (
                                        <tr key={index} className="border-t border-gray-200">
                                            <td className="px-4 py-2">{row.name || row.Name || '-'}</td>
                                            <td className="px-4 py-2">{row.type || row.Type || '-'}</td>
                                            <td className="px-4 py-2">{row.currentStock || row['Current Stock'] || '0'}</td>
                                            <td className="px-4 py-2">₹{row.sellingPrice || row['Selling Price'] || '0'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setPreview(false);
                                        setFile(null);
                                        setParsedData([]);
                                    }}
                                    className="btn btn-ghost flex-1"
                                >
                                    Choose Different File
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="btn btn-primary flex-1"
                                >
                                    {uploading ? 'Uploading...' : `Upload ${parsedData.length} Medicines`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}