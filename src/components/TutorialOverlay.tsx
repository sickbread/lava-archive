import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Terminal } from 'lucide-react';

interface SpotlightTutorialProps {
    onClose: () => void;
    t: any;
}

interface Step {
    targetId: string;
    title: string;
    desc: string;
    position: 'right' | 'left' | 'bottom' | 'top';
}

const SpotlightTutorial: React.FC<SpotlightTutorialProps> = ({ onClose, t }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    // 1. DATA ACCESS
    const steps: Step[] = [
        { targetId: 'sidebar-category-list', title: t?.tutorial_sidebar_title || 'Category List', desc: t?.tutorial_sidebar_desc || 'Manage your lore entries here.', position: 'right' },
        { targetId: 'sidebar-add-category', title: t?.tutorial_add_cat_title || 'Add Category', desc: t?.tutorial_add_cat_desc || 'Create new lore classifications.', position: 'right' },
        { targetId: 'quick-search-trigger', title: t?.tutorial_search_title || 'Global Search', desc: t?.tutorial_search_desc || 'Scan the entire database instantly.', position: 'bottom' },
        { targetId: 'view-mode-tabs', title: t?.tutorial_tabs_title || 'View Modes', desc: t?.tutorial_tabs_desc || 'Switch between Editor, Canvas, and Database.', position: 'bottom' },
        { targetId: 'inspector-panel', title: t?.tutorial_inspector_title || 'Asset Inspector', desc: t?.tutorial_inspector_desc || 'View logic and C# export stream.', position: 'left' },
        { targetId: 'reboot-protocol-trigger', title: t?.tutorial_reboot_title || 'Reboot Protocol', desc: t?.tutorial_reboot_desc || 'Restart the system guide anytime.', position: 'right' }
    ];

    const isWelcome = currentStep === 0;
    const isFinish = currentStep === steps.length + 1;
    const currentStepData = steps[currentStep - 1] || null;

    // 2. TARGET TRACKING
    useEffect(() => {
        if (isWelcome || isFinish || !currentStepData) {
            setTargetRect(null);
            return;
        }
        const updateRect = () => {
            const el = document.getElementById(currentStepData.targetId);
            if (el) setTargetRect(el.getBoundingClientRect());
            else setTargetRect(null);
        };
        updateRect();
        const interval = setInterval(updateRect, 1000);
        return () => clearInterval(interval);
    }, [currentStep, currentStepData, isWelcome, isFinish]);

    // 3. HANDLERS
    const handleNext = () => {
        if (currentStep < steps.length + 1) setCurrentStep(prev => prev + 1);
        else onClose();
    };
    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    // 4. POSITIONING (SIMPLIFIED TO AVOID LOOPS)
    const getBoxStyle = (): React.CSSProperties => {
        if (isWelcome || isFinish || !targetRect || !currentStepData) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400
            };
        }

        const padding = 24;
        const boxWidth = 350;
        const estBoxHeight = 220; // Estimated height for clamping logic

        let top = targetRect.top;
        let left = targetRect.right + padding;

        if (currentStepData.position === 'left') {
            left = targetRect.left - boxWidth - padding;
        } else if (currentStepData.position === 'top') {
            left = targetRect.left + (targetRect.width / 2) - (boxWidth / 2);
            top = targetRect.top - estBoxHeight - padding;
        } else if (currentStepData.position === 'bottom') {
            left = targetRect.left + (targetRect.width / 2) - (boxWidth / 2);
            top = targetRect.bottom + padding;
        } else if (currentStepData.position === 'right') {
            // Center vertically relative to target
            top = targetRect.top + (targetRect.height / 2) - (estBoxHeight / 2);
        }

        // Safety clamp (Viewport)
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (left < padding) left = padding;
        if (left + boxWidth > vw - padding) left = vw - boxWidth - padding;
        if (top < padding) top = padding;
        if (top + estBoxHeight > vh - padding) top = vh - estBoxHeight - padding;

        return {
            top: Math.round(top),
            left: Math.round(left),
            width: boxWidth
        };
    };

    return (
        <div className="fixed inset-0 z-[999999] pointer-events-none overflow-hidden h-screen w-screen">
            {/* ZERO BACKDROP FOR STABILITY */}

            {/* 5. Target Highlight (Border Only) */}
            {!isWelcome && !isFinish && targetRect && (
                <div
                    className="absolute border-[3px] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] pointer-events-none transition-all duration-300"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                        borderRadius: 2
                    }}
                >
                    {/* Corner Symbols */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#CC0000]" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#CC0000]" />
                </div>
            )}

            {/* 6. Instruction Box / Modal */}
            <div
                className="absolute bg-[#0a0a0a]/95 border border-[#333] shadow-[0_30px_60px_rgba(0,0,0,0.9)] p-8 flex flex-col items-center text-center pointer-events-auto transition-all duration-300"
                style={getBoxStyle()}
            >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#CC0000] via-[#D4AF37] to-[#CC0000]" />

                <Terminal size={32} className="text-[#CC0000] mb-4" />

                <h2 className="text-xl font-black uppercase tracking-widest text-[#D4AF37] mb-4 font-mono">
                    {isWelcome ? (t?.tutorial_welcome_title || 'INITIALIZING') : (isFinish ? (t?.tutorial_finish_title || 'COMPLETE') : (currentStepData?.title || 'SEQ_0' + currentStep))}
                </h2>

                <p className="text-gray-300 font-mono text-xs leading-relaxed mb-8 max-w-[320px]">
                    {isWelcome ? t?.tutorial_welcome_desc : (isFinish ? t?.tutorial_finish_desc : currentStepData?.desc)}
                </p>



                <div className="flex w-full justify-between items-center gap-4 mt-auto">
                    {/* Navigation */}
                    {!isWelcome && !isFinish ? (
                        <>
                            <button onClick={handlePrev} disabled={currentStep === 1} className="text-[10px] text-[#555] hover:text-white uppercase tracking-tighter transition-colors disabled:opacity-0">
                                [ BACK ]
                            </button>
                            <div className="flex gap-4">
                                <button onClick={onClose} className="text-[10px] text-[#444] hover:text-[#777] uppercase tracking-tighter">
                                    [ SKIP ]
                                </button>
                                <button onClick={handleNext} className="text-[10px] font-bold text-[#D4AF37] hover:text-white uppercase tracking-wider flex items-center gap-1">
                                    NEXT &gt;&gt;
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex flex-col items-center gap-4">
                            <button
                                onClick={handleNext}
                                className="w-full py-3 bg-[#1a0505] border border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white transition-all uppercase tracking-widest font-black text-xs"
                            >
                                {isWelcome ? 'INITIALIZE SYSTEM' : 'EXIT PROTOCOL'}
                            </button>
                            {isWelcome && (
                                <button onClick={onClose} className="text-[9px] text-[#444] hover:text-[#666] uppercase tracking-[0.2em] underline font-mono">
                                    Skip Initial Setup
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpotlightTutorial;
