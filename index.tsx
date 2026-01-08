
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
    CheckCircle2, 
    AlertCircle, 
    ChevronRight, 
    Calculator, 
    Truck, 
    Percent, 
    BookOpen,
    Trophy,
    RefreshCw,
    GraduationCap,
    Info
} from 'lucide-react';

// --- Configuration des Exercices ---
const EXERCISES = [
    {
        id: 1,
        title: "Introduction : La Vente Simple",
        description: "Calculez le montant total d'une facture sans réduction ni frais particuliers. Un seul taux de TVA à 21%.",
        articles: [{ desc: "Souris Ergonomique", qty: 10, pu: 25.00, tva: 21 }],
        reductions: { remise: 0, escompte: 0 },
        port: 0,
        difficulty: "Débutant"
    },
    {
        id: 2,
        title: "La Remise Commerciale",
        description: "Le client achète en quantité. Appliquez une remise commerciale de 10% sur le montant brut.",
        articles: [{ desc: "Rames de papier A4", qty: 50, pu: 5.50, tva: 21 }],
        reductions: { remise: 10, escompte: 0 },
        port: 0,
        difficulty: "Débutant"
    },
    {
        id: 3,
        title: "L'Escompte Financier",
        description: "Le client paie au comptant. Après la remise de 5%, appliquez un escompte de 2%.",
        articles: [{ desc: "Ordinateur Portable Pro", qty: 2, pu: 850.00, tva: 21 }],
        reductions: { remise: 5, escompte: 2 },
        port: 0,
        difficulty: "Intermédiaire"
    },
    {
        id: 4,
        title: "Frais de Transport",
        description: "Ajoutez les frais de port. Notez que les frais de port s'ajoutent au net financier pour former la base de TVA.",
        articles: [{ desc: "Bureau d'angle", qty: 1, pu: 450.00, tva: 21 }],
        reductions: { remise: 0, escompte: 0 },
        port: 35.00,
        difficulty: "Intermédiaire"
    },
    {
        id: 5,
        title: "Multi-Taux de TVA",
        description: "Gérez deux taux différents : 6% pour les livres et 21% pour le matériel informatique.",
        articles: [
            { desc: "Manuel de Comptabilité", qty: 5, pu: 40.00, tva: 6 },
            { desc: "Clé USB 64Go", qty: 5, pu: 12.00, tva: 21 }
        ],
        reductions: { remise: 5, escompte: 0 },
        port: 0,
        difficulty: "Avancé"
    },
    {
        id: 6,
        title: "Le Cas Complet",
        description: "La totale : Plusieurs articles, remise, escompte, frais de port et multi-taux de TVA.",
        articles: [
            { desc: "Farine de blé (sac 25kg)", qty: 10, pu: 18.00, tva: 6 },
            { desc: "Robot Pétrisseur Pro", qty: 1, pu: 1200.00, tva: 21 }
        ],
        reductions: { remise: 10, escompte: 2 },
        port: 50.00,
        difficulty: "Expert"
    }
];

// --- Composants UI ---

// Added default value for label to make it optional in destructured props, fixing TS error in call sites
const InputField = ({ label = "", value, onChange, correctValue, showFeedback, placeholder = "0.00" }) => {
    const isCorrect = showFeedback && Math.abs(parseFloat(value || 0) - parseFloat(correctValue)) < 0.011;
    const isWrong = showFeedback && !isCorrect;

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
            <div className="relative">
                <input 
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-sm transition-all outline-none
                        ${isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-100' : ''}
                        ${isWrong ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-100' : ''}
                        ${!showFeedback ? 'border-slate-200 focus:border-indigo-400' : ''}
                    `}
                />
                {isCorrect && <CheckCircle2 className="absolute right-2 top-2.5 w-4 h-4 text-emerald-500" />}
                {isWrong && <AlertCircle className="absolute right-2 top-2.5 w-4 h-4 text-rose-500" />}
            </div>
        </div>
    );
};

const App = () => {
    const [exIndex, setExIndex] = useState(0);
    const [userInputs, setUserInputs] = useState({});
    const [showFeedback, setShowFeedback] = useState(false);
    const [completed, setCompleted] = useState([]);
    
    const currentEx = EXERCISES[exIndex];

    // Calculs de la solution (Logique Comptable)
    const solution = useMemo(() => {
        let brut = currentEx.articles.reduce((acc, art) => acc + (art.qty * art.pu), 0);
        let remise = brut * (currentEx.reductions.remise / 100);
        let netCommercial = brut - remise;
        let escompte = netCommercial * (currentEx.reductions.escompte / 100);
        let netFinancier = netCommercial - escompte;
        
        // Répartition des réductions au prorata pour les multi-taux
        const ratioHTVA = brut === 0 ? 0 : netFinancier / brut;
        const basesTva = { 6: 0, 12: 0, 21: 0 };
        currentEx.articles.forEach(a => {
            basesTva[a.tva] += (a.qty * a.pu) * ratioHTVA;
        });

        // Frais de port : ajoutés à la base du taux le plus élevé (règle prudente souvent enseignée) 
        // ou au taux majoritaire. Ici, on utilise le taux le plus élevé présent.
        const maxRate = Math.max(...currentEx.articles.map(a => a.tva));
        basesTva[maxRate] += currentEx.port;

        const tva6 = basesTva[6] * 0.06;
        const tva12 = basesTva[12] * 0.12;
        const tva21 = basesTva[21] * 0.21;
        const totalTva = tva6 + tva12 + tva21;
        const totalApayer = netFinancier + currentEx.port + totalTva;

        return { brut, remise, netCommercial, escompte, netFinancier, tva6, tva12, tva21, totalTva, totalApayer };
    }, [currentEx]);

    const handleInputChange = (field, val) => {
        setUserInputs(prev => ({
            ...prev,
            [exIndex]: { ...(prev[exIndex] || {}), [field]: val }
        }));
    };

    const checkAnswers = () => {
        const inputs = userInputs[exIndex] || {};
        const requiredFields = ['brut', 'netFinancier', 'totalTva', 'totalApayer'];
        const isAllCorrect = requiredFields.every(field => {
            const inputVal = parseFloat(inputs[field] || 0);
            const solVal = solution[field === 'netFinancier' ? 'netFinancier' : field];
            return Math.abs(inputVal - solVal) < 0.011;
        });

        if (isAllCorrect && !completed.includes(exIndex)) {
            setCompleted([...completed, exIndex]);
        }
        setShowFeedback(true);
    };

    const nextExercise = () => {
        if (exIndex < EXERCISES.length - 1) {
            setExIndex(exIndex + 1);
            setShowFeedback(false);
        }
    };

    const curInputs = userInputs[exIndex] || {};

    return (
        <div className="min-h-screen py-8 px-4 flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-5xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                        <GraduationCap className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">FactureMaster <span className="text-indigo-600">v2</span></h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">4ème Technique Comptabilité</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {EXERCISES.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${completed.includes(i) ? 'bg-emerald-500' : i === exIndex ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`}
                        />
                    ))}
                </div>
            </header>

            <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Volet Instructions */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Mission {exIndex + 1}</span>
                            <span className="text-slate-400 text-xs font-mono">{currentEx.difficulty}</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{currentEx.title}</h2>
                        <p className="text-slate-600 text-sm leading-relaxed">{currentEx.description}</p>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" /> Aide Mémoire
                            </h3>
                            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                                <li><b>Brut</b> = Somme des (Qté × P.U.)</li>
                                {currentEx.reductions.remise > 0 && <li>Remise de <b>{currentEx.reductions.remise}%</b> à déduire du Brut.</li>}
                                {currentEx.reductions.escompte > 0 && <li>Escompte de <b>{currentEx.reductions.escompte}%</b> à déduire du Net Commercial.</li>}
                                {currentEx.port > 0 && <li>Frais de port (<b>{currentEx.port}€</b>) à ajouter HTVA.</li>}
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Volet Facture Interactive */}
                <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                        <div>
                            <div className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-2">Document Commercial</div>
                            <div className="text-3xl font-bold tracking-tighter">FACTURE <span className="text-slate-500">#2025-{exIndex+1}</span></div>
                        </div>
                        <div className="text-right opacity-60 text-xs font-mono">
                            PC-WORLD SRL<br/>BCE 0123.456.789
                        </div>
                    </div>

                    <div className="p-8 space-y-8 flex-1">
                        {/* Articles */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                <div className="col-span-6">Désignation</div>
                                <div className="col-span-2 text-center">Qté</div>
                                <div className="col-span-2 text-right">P.U. (€)</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>
                            {currentEx.articles.map((art, i) => (
                                <div key={i} className="grid grid-cols-12 gap-4 items-center text-sm">
                                    <div className="col-span-6 font-semibold text-slate-700">{art.desc} <span className="text-[10px] text-indigo-500 ml-1">({art.tva}%)</span></div>
                                    <div className="col-span-2 text-center font-mono text-slate-500">{art.qty}</div>
                                    <div className="col-span-2 text-right font-mono text-slate-500">{art.pu.toFixed(2)}</div>
                                    <div className="col-span-2 text-right font-bold text-slate-800 font-mono">{(art.qty * art.pu).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Calculs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                            <div className="space-y-4">
                                <InputField 
                                    label="Montant Brut (€)" 
                                    value={curInputs.brut || ''} 
                                    onChange={(v) => handleInputChange('brut', v)}
                                    correctValue={solution.brut}
                                    showFeedback={showFeedback}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField 
                                        label="Net Financier (€)" 
                                        value={curInputs.netFinancier || ''} 
                                        onChange={(v) => handleInputChange('netFinancier', v)}
                                        correctValue={solution.netFinancier}
                                        showFeedback={showFeedback}
                                    />
                                    <InputField 
                                        label="Total TVA (€)" 
                                        value={curInputs.totalTva || ''} 
                                        onChange={(v) => handleInputChange('totalTva', v)}
                                        correctValue={solution.totalTva}
                                        showFeedback={showFeedback}
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col justify-center gap-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Net à payer</p>
                                        <p className="text-3xl font-black text-indigo-900">Total Final</p>
                                    </div>
                                    <div className="w-32">
                                        <InputField 
                                            value={curInputs.totalApayer || ''} 
                                            onChange={(v) => handleInputChange('totalApayer', v)}
                                            correctValue={solution.totalApayer}
                                            showFeedback={showFeedback}
                                            placeholder="€€€"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <button 
                            onClick={() => { setShowFeedback(false); setUserInputs(prev => ({...prev, [exIndex]: {}})) }}
                            className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        >
                            <RefreshCw className="w-4 h-4" /> Réinitialiser
                        </button>
                        
                        <div className="flex gap-4 w-full sm:w-auto">
                            {!showFeedback ? (
                                <button 
                                    onClick={checkAnswers}
                                    className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Calculator className="w-4 h-4" /> Vérifier
                                </button>
                            ) : (
                                <button 
                                    onClick={nextExercise}
                                    disabled={exIndex === EXERCISES.length - 1}
                                    className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {exIndex === EXERCISES.length - 1 ? "Dernier Exercice !" : "Suivant"} <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Victoire */}
            {completed.length === EXERCISES.length && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-12 text-center max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                        <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 drop-shadow-xl animate-bounce" />
                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Excellent Travail !</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Tu as relevé tous les défis de FactureMaster. Tu maîtrises désormais les 3R, l'escompte, le transport et les différents taux de TVA.
                        </p>
                        <button 
                            onClick={() => { setCompleted([]); setExIndex(0); setUserInputs({}); setShowFeedback(false); }}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                        >
                            Recommencer le cours
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
