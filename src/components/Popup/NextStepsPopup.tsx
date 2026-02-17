'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NextStepsPopupProps {
    show: boolean;
    patientId: string;
    patientName: string;
    onClose: () => void;
}

export default function NextStepsPopup({
                                           show,
                                           patientId,
                                           patientName,
                                           onClose
                                       }: NextStepsPopupProps) {
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (show) {
            // Delay to trigger entrance animation
            setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }
    }, [show]);

    if (!show && !isVisible) return null;

    const handleOption = (option: 'diet' | 'therapy') => {
        setIsExiting(true);

        setTimeout(() => {
            if (option === 'diet') {
                router.push(`/dashboard/diet/create?patientId=${patientId}`);
            } else {
                router.push(`/dashboard/therapy/create?patientId=${patientId}`);
            }
            onClose();
        }, 300);
    };

    const handleSkip = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-end p-6">
            <div
                className={`pointer-events-auto w-full max-w-md transition-all duration-500 ease-out ${
                    isVisible && !isExiting
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0'
                }`}
            >
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Success Header with Gradient */}
                    <div className="relative bg-gradient-to-r from-teal-500 via-green-500 to-emerald-500 p-6 pb-8">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                        <div className="relative">
                            {/* Success Icon */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Success!</h3>
                                    <p className="text-white/90 text-sm">Prescription created</p>
                                </div>
                            </div>

                            {/* Patient Name */}
                            <div className="mt-3 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg inline-block">
                                <p className="text-white text-sm font-medium">
                                    For: {patientName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 -mt-4 relative">
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                            <p className="text-gray-700 font-semibold mb-1 text-sm">
                                🎯 What's next?
                            </p>
                            <p className="text-gray-600 text-xs">
                                Complete the treatment plan for better outcomes
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {/* Diet Plan Button */}
                            <button
                                onClick={() => handleOption('diet')}
                                className="group w-full p-4 bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-2 border-green-200 hover:border-green-400 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <span className="text-xl">🍽️</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                                            Create Diet Plan
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Constitution-based nutrition
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Therapy Button */}
                            <button
                                onClick={() => handleOption('therapy')}
                                className="group w-full p-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <span className="text-xl">💆</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">
                                            Schedule Therapy
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Panchakarma sessions
                                        </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Skip Button */}
                            <button
                                onClick={handleSkip}
                                className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium text-sm rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>

                        {/* Pro Tip */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600 text-sm flex-shrink-0">💡</span>
                                <p className="text-xs text-blue-900">
                                    <span className="font-semibold">Pro tip:</span> Complete plans improve patient outcomes and satisfaction
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}