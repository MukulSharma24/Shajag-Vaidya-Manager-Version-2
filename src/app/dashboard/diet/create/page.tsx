'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
    id: string;
    registrationId: number;
    fullName: string;
    phoneNumber: string;
    age: number;
    gender: string;
    constitutionType: string;
}

function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 2 && month <= 5) return 'SPRING';
    if (month >= 5 && month <= 7) return 'SUMMER';
    if (month >= 7 && month <= 9) return 'MONSOON';
    if (month >= 9 && month <= 11) return 'AUTUMN';
    return 'WINTER';
}

function getDietTemplate(constitution: string, season: string) {
    // Comprehensive templates for all constitution types
    const templates: any = {
        VATA: {
            morning: ['Warm water with ginger', 'Cooked oatmeal with ghee', 'Soaked almonds (5-6)', 'Dates', 'Warm herbal tea'],
            lunch: ['Cooked rice', 'Warm vegetables', 'Moong dal', 'Buttermilk', 'Warm soups'],
            evening: ['Light khichdi', 'Warm milk with turmeric', 'Cooked vegetables', 'Avoid raw foods', 'Early dinner'],
            guidelines: ['Eat warm, cooked foods', 'Regular meal times', 'Use warming spices', 'Stay hydrated with warm water', 'Avoid cold drinks'],
            restrictions: ['Avoid raw vegetables', 'Limit cold foods', 'Reduce caffeine', 'Avoid irregular eating']
        },
        PITTA: {
            morning: ['Cool water', 'Fresh sweet fruits', 'Coconut water', 'Rice flakes', 'Mint tea'],
            lunch: ['Rice with ghee', 'Cooling vegetables (cucumber)', 'Fresh salads', 'Sweet lassi', 'Light dal'],
            evening: ['Light dinner', 'Cool milk with cardamom', 'Steamed vegetables', 'Sweet fruits', 'Fennel tea'],
            guidelines: ['Favor cooling foods', 'Avoid hot spices', 'Stay hydrated', 'Eat fresh vegetables', 'Avoid overheating'],
            restrictions: ['Avoid spicy foods', 'Limit sour foods', 'Reduce fried items', 'Avoid excessive heat']
        },
        KAPHA: {
            morning: ['Warm water with honey', 'Light breakfast', 'Ginger tea', 'Minimal food', 'Spiced tea'],
            lunch: ['Light grains', 'Spiced vegetables', 'Light dal', 'Bitter greens', 'Warm soups'],
            evening: ['Very light dinner', 'Herbal tea', 'Steamed vegetables', 'Early meal', 'Avoid dairy'],
            guidelines: ['Eat light, warm foods', 'Use heating spices', 'Exercise regularly', 'Skip breakfast if not hungry', 'Stay active'],
            restrictions: ['Avoid dairy', 'Limit sweet foods', 'No cold drinks', 'Avoid heavy foods']
        },
        'VATA-PITTA': {
            morning: ['Warm water', 'Sweet fruits', 'Warm oatmeal', 'Coconut water', 'Herbal tea'],
            lunch: ['Rice or quinoa', 'Cooked vegetables', 'Mung dal', 'Buttermilk (room temp)', 'Light soups'],
            evening: ['Moderate dinner', 'Warm milk (optional)', 'Cooked vegetables', 'Sweet foods', 'Chamomile tea'],
            guidelines: ['Balance warm and cool', 'Regular meal times', 'Moderate spices', 'Stay hydrated', 'Avoid extremes'],
            restrictions: ['Avoid very hot or cold', 'Limit raw foods', 'Reduce caffeine', 'Avoid irregular eating']
        },
        'PITTA-KAPHA': {
            morning: ['Warm water', 'Light fruits', 'Herbal tea', 'Minimal breakfast', 'Ginger water'],
            lunch: ['Light grains', 'Steamed vegetables', 'Light dal', 'Warm water', 'Digestive spices'],
            evening: ['Light dinner', 'Herbal tea', 'Cooked vegetables', 'Early meal', 'Minimal food'],
            guidelines: ['Eat light, moderate foods', 'Use mild spices', 'Avoid heavy foods', 'Stay active', 'Balance diet'],
            restrictions: ['Avoid dairy', 'Limit sweets', 'Reduce fried foods', 'Avoid overeating']
        },
        'VATA-KAPHA': {
            morning: ['Warm water', 'Light warm breakfast', 'Ginger tea', 'Soaked nuts (few)', 'Herbal tea'],
            lunch: ['Warm grains', 'Cooked vegetables', 'Light dal with spices', 'Warm buttermilk', 'Warm soups'],
            evening: ['Warm light dinner', 'Herbal tea', 'Cooked vegetables', 'Early meal', 'Warm spices'],
            guidelines: ['Warm, light foods', 'Regular times', 'Warming spices', 'Stay active', 'Avoid cold'],
            restrictions: ['Avoid cold foods', 'Limit dairy', 'Reduce raw foods', 'Avoid heavy meals']
        },
        TRIDOSHA: {
            morning: ['Warm water', 'Seasonal fruits', 'Herbal tea', 'Balanced breakfast', 'Light grains'],
            lunch: ['Whole grains', 'Variety of vegetables', 'Dal', 'Buttermilk', 'Balanced meal'],
            evening: ['Moderate dinner', 'Warm milk (optional)', 'Cooked vegetables', 'Herbal tea', 'Balanced portions'],
            guidelines: ['Eat balanced meals', 'Variety of foods', 'Regular times', 'Moderate spices', 'Stay active'],
            restrictions: ['Avoid extremes', 'Moderation in all', 'Balance hot-cold', 'Avoid overeating']
        }
    };

    return templates[constitution] || templates.TRIDOSHA;
}

const CONSTITUTIONS = [
    { id: 'VATA', name: 'Vata', icon: '💨', desc: 'Air & Space' },
    { id: 'PITTA', name: 'Pitta', icon: '🔥', desc: 'Fire & Water' },
    { id: 'KAPHA', name: 'Kapha', icon: '🌊', desc: 'Water & Earth' },
    { id: 'VATA-PITTA', name: 'Vata-Pitta', icon: '💨🔥', desc: 'Dual' },
    { id: 'PITTA-KAPHA', name: 'Pitta-Kapha', icon: '🔥🌊', desc: 'Dual' },
    { id: 'VATA-KAPHA', name: 'Vata-Kapha', icon: '💨🌊', desc: 'Dual' },
    { id: 'TRIDOSHA', name: 'Tridosha', icon: '⚖️', desc: 'Balanced' },
];

const SEASONS = [
    { id: 'SPRING', name: 'Spring (Vasant)', icon: '🌸', months: 'Feb-May' },
    { id: 'SUMMER', name: 'Summer (Grishma)', icon: '☀️', months: 'May-Jul' },
    { id: 'MONSOON', name: 'Monsoon (Varsha)', icon: '🌧️', months: 'Jul-Sep' },
    { id: 'AUTUMN', name: 'Autumn (Sharad)', icon: '🍂', months: 'Sep-Nov' },
    { id: 'WINTER', name: 'Winter (Shishir)', icon: '❄️', months: 'Nov-Feb' },
];

export default function CreateDietPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);

    const [constitution, setConstitution] = useState('');
    const [season, setSeason] = useState(getCurrentSeason());
    const [notes, setNotes] = useState('');

    const [morningMeal, setMorningMeal] = useState<string[]>([]);
    const [lunchMeal, setLunchMeal] = useState<string[]>([]);
    const [eveningMeal, setEveningMeal] = useState<string[]>([]);
    const [guidelines, setGuidelines] = useState<string[]>([]);
    const [restrictions, setRestrictions] = useState<string[]>([]);

    // Edit mode states
    const [editingMeal, setEditingMeal] = useState<string>('');
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        const searchPatients = async () => {
            if (patientSearch.trim().length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            try {
                setSearching(true);
                const res = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.patients || []);
                    setShowResults(true);
                }
            } catch (error) {
                console.error('Error searching patients:', error);
            } finally {
                setSearching(false);
            }
        };

        const timer = setTimeout(searchPatients, 300);
        return () => clearTimeout(timer);
    }, [patientSearch]);

    const selectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setPatientSearch(`${patient.fullName} (ID: ${patient.registrationId})`);
        setShowResults(false);

        if (patient.constitutionType && patient.constitutionType !== 'Not assessed yet') {
            const constType = patient.constitutionType.toUpperCase().replace(/\s+/g, '-');
            const matchingConst = CONSTITUTIONS.find(c => constType.includes(c.id.split('-')[0]));
            if (matchingConst) {
                setConstitution(matchingConst.id);
                loadTemplate(matchingConst.id, season);
            }
        }
    };

    const selectConstitution = (constitutionType: string) => {
        setConstitution(constitutionType);
        loadTemplate(constitutionType, season);
    };

    const selectSeason = (newSeason: string) => {
        setSeason(newSeason);
        if (constitution) {
            loadTemplate(constitution, newSeason);
        }
    };

    const loadTemplate = (constitutionType: string, seasonType: string) => {
        const template = getDietTemplate(constitutionType, seasonType);
        setMorningMeal([...template.morning]);
        setLunchMeal([...template.lunch]);
        setEveningMeal([...template.evening]);
        setGuidelines([...template.guidelines]);
        setRestrictions([...template.restrictions]);
    };

    // Customization functions
    const addItem = (mealType: string) => {
        if (!newItem.trim()) return;

        switch(mealType) {
            case 'morning':
                setMorningMeal([...morningMeal, newItem.trim()]);
                break;
            case 'lunch':
                setLunchMeal([...lunchMeal, newItem.trim()]);
                break;
            case 'evening':
                setEveningMeal([...eveningMeal, newItem.trim()]);
                break;
            case 'guidelines':
                setGuidelines([...guidelines, newItem.trim()]);
                break;
            case 'restrictions':
                setRestrictions([...restrictions, newItem.trim()]);
                break;
        }

        setNewItem('');
        setEditingMeal('');
    };

    const removeItem = (mealType: string, index: number) => {
        switch(mealType) {
            case 'morning':
                setMorningMeal(morningMeal.filter((_, i) => i !== index));
                break;
            case 'lunch':
                setLunchMeal(lunchMeal.filter((_, i) => i !== index));
                break;
            case 'evening':
                setEveningMeal(eveningMeal.filter((_, i) => i !== index));
                break;
            case 'guidelines':
                setGuidelines(guidelines.filter((_, i) => i !== index));
                break;
            case 'restrictions':
                setRestrictions(restrictions.filter((_, i) => i !== index));
                break;
        }
    };

    const handleSubmit = async () => {
        if (!selectedPatient) {
            alert('Please select a patient');
            return;
        }

        if (!constitution) {
            alert('Please select a constitution type');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                patientId: selectedPatient.id,
                constitution,
                season,
                morningMeal: JSON.stringify(morningMeal),
                lunchMeal: JSON.stringify(lunchMeal),
                eveningMeal: JSON.stringify(eveningMeal),
                guidelines: guidelines.join('\n'),
                restrictions: restrictions.join('\n'),
                notes,
            };

            const res = await fetch('/api/diet/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                alert('Diet plan created successfully!');
                router.push(`/dashboard/diet/plans/${data.plan.id}`);
            } else {
                alert(data.error || 'Failed to create diet plan');
            }
        } catch (error) {
            console.error('Error creating plan:', error);
            alert('Failed to create diet plan');
        } finally {
            setLoading(false);
        }
    };

    const renderEditableMealSection = (title: string, icon: string, items: string[], mealType: string, bgColor: string, borderColor: string) => (
        <div className={`p-4 ${bgColor} border ${borderColor} rounded-xl`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {icon} {title}
                </h3>
                <button
                    onClick={() => setEditingMeal(editingMeal === mealType ? '' : mealType)}
                    className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium transition-colors"
                >
                    {editingMeal === mealType ? '✓ Done' : '✏️ Customize'}
                </button>
            </div>

            <ul className="space-y-2">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm text-gray-700 group">
                        <span>• {item}</span>
                        {editingMeal === mealType && (
                            <button
                                onClick={() => removeItem(mealType, idx)}
                                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs transition-all"
                            >
                                ✕
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {editingMeal === mealType && (
                <div className="mt-3 flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem(mealType)}
                        placeholder="Add new item..."
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                        onClick={() => addItem(mealType)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Add
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Diet Plan</h1>
                        <p className="text-gray-600">Customizable constitution-based nutrition plan</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ← Back
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Patient Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            1. Select Patient <span className="text-red-500">*</span>
                        </h2>

                        {!selectedPatient ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    placeholder="Search by name, phone, or ID..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    autoFocus
                                />

                                {searching && (
                                    <div className="absolute right-4 top-3.5">
                                        <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-teal-600 rounded-full"></div>
                                    </div>
                                )}

                                {showResults && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            searchResults.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    onClick={() => selectPatient(patient)}
                                                    className="w-full px-4 py-3 hover:bg-teal-50 text-left border-b last:border-b-0"
                                                >
                                                    <div className="font-semibold text-gray-900">{patient.fullName}</div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        ID: {patient.registrationId} • {patient.age} yrs • {patient.phoneNumber}
                                                    </div>
                                                    {patient.constitutionType && (
                                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full mt-1 inline-block">
                                                            {patient.constitutionType}
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">No patients found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-500 rounded-xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-teal-700 mb-1 font-semibold">✓ SELECTED PATIENT</p>
                                        <p className="text-xl font-bold text-gray-900 mb-2">{selectedPatient.fullName}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-700">
                                            <span>ID: {selectedPatient.registrationId}</span>
                                            <span>{selectedPatient.age} yrs</span>
                                            <span>{selectedPatient.gender}</span>
                                            <span>📞 {selectedPatient.phoneNumber}</span>
                                        </div>
                                        {selectedPatient.constitutionType && (
                                            <div className="mt-2">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                                    {selectedPatient.constitutionType}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedPatient(null);
                                            setPatientSearch('');
                                        }}
                                        className="px-4 py-2 bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Constitution Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            2. Select Constitution <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">Includes mixed constitutions (Vata-Pitta, etc.)</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {CONSTITUTIONS.map(constitutionItem => (
                                <button
                                    key={constitutionItem.id}
                                    onClick={() => selectConstitution(constitutionItem.id)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                                        constitution === constitutionItem.id
                                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                                            : 'border-gray-200 hover:border-purple-300 bg-white'
                                    }`}
                                >
                                    <div className="text-3xl mb-1">{constitutionItem.icon}</div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-0.5">{constitutionItem.name}</h3>
                                    <p className="text-xs text-gray-600">{constitutionItem.desc}</p>
                                    {constitution === constitutionItem.id && (
                                        <div className="mt-1 text-purple-600 text-lg">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Season */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. Select Season</h2>
                        <p className="text-sm text-gray-600 mb-4">Current: {getCurrentSeason()}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {SEASONS.map(seasonItem => (
                                <button
                                    key={seasonItem.id}
                                    onClick={() => selectSeason(seasonItem.id)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                                        season === seasonItem.id
                                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                                            : 'border-gray-200 hover:border-blue-300 bg-white'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{seasonItem.icon}</div>
                                    <h3 className="font-bold text-gray-900 text-xs">{seasonItem.name.split(' ')[0]}</h3>
                                    <p className="text-xs text-gray-600">{seasonItem.months}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 4: Customizable Meals */}
                    {constitution && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">4. Customize Diet Plan</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Template for {constitution} • Click "Customize" to edit meals
                                    </p>
                                </div>
                                <button
                                    onClick={() => loadTemplate(constitution, season)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    🔄 Reset to Template
                                </button>
                            </div>

                            <div className="space-y-4">
                                {renderEditableMealSection('Morning (6-8 AM)', '☀️', morningMeal, 'morning', 'bg-amber-50', 'border-amber-200')}
                                {renderEditableMealSection('Lunch (12-1 PM)', '🍽️', lunchMeal, 'lunch', 'bg-orange-50', 'border-orange-200')}
                                {renderEditableMealSection('Evening (6-7 PM)', '🌙', eveningMeal, 'evening', 'bg-indigo-50', 'border-indigo-200')}
                                {renderEditableMealSection('Guidelines', '✓', guidelines, 'guidelines', 'bg-green-50', 'border-green-200')}
                                {renderEditableMealSection('Restrictions', '✗', restrictions, 'restrictions', 'bg-red-50', 'border-red-200')}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. Additional Notes</h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Patient-specific instructions, allergies, preferences..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedPatient || !constitution}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            {loading ? '⏳ Creating...' : '✓ Create Customized Diet Plan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}