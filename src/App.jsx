import React from 'react';
import confetti from 'canvas-confetti';
import QUESTIONS from './data/questions';

/* createIcon wraps the global lucide icons loaded via CDN in index.html */
const createIcon = (name) => ({ size = 24, className = "" }) =>
  React.createElement("i", { "data-lucide": name, className, style: { width: size, height: size } });

const Bus = createIcon("bus");
const Eye = createIcon("eye");
const Users = createIcon("users");
const ShieldAlert = createIcon("shield-alert");
const TrainFront = createIcon("train-front");
const DoorOpen = createIcon("door-open");
const Wrench = createIcon("wrench");
const CheckCircle = createIcon("check-circle");
const AlertCircle = createIcon("alert-circle");
const ChevronRight = createIcon("chevron-right");
const Trophy = createIcon("trophy");
const Printer = createIcon("printer");
const Clock = createIcon("clock");

const UNIT_TITLES = [
  { id: 1, title: "Danger Zones & Mirrors", icon: Eye },
  { id: 2, title: "Loading & Unloading", icon: Users },
  { id: 3, title: "Emergency Procedures", icon: ShieldAlert },
  { id: 4, title: "Railroad Crossings", icon: TrainFront },
  { id: 5, title: "Student Management", icon: DoorOpen },
  { id: 6, title: "Pre-Trip Inspection", icon: Wrench },
  { id: 7, title: "Post-Trip & Special Needs", icon: Bus },
];

const STORAGE_KEY = 'mnBusStats2026';

const loadStats = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {
    unitProgress: {},
    totalCorrect: 0,
    examsPassed: 0,
    muted: false
  };
};

const saveStats = (stats) => localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));

export default function App() {
  const [stats, setStats] = React.useState(loadStats());
  const [view, setView] = React.useState('menu');
  const [mode, setMode] = React.useState(null);
  const [currentUnit, setCurrentUnit] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const [showExp, setShowExp] = React.useState(false);
  const [missed, setMissed] = React.useState([]);
  const [timeLeft, setTimeLeft] = React.useState(0);

  React.useEffect(() => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }, []);

  React.useEffect(() => {
    if (mode === 'real' && timeLeft > 0 && view === 'quiz') {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && view === 'quiz' && questions.length > 0 && mode === 'real') {
      endQuiz();
    }
  }, [timeLeft, mode, view, questions.length]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const speak = (text) => {
    if (stats.muted) return;
    try {
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      speechSynthesis.speak(utter);
    } catch (e) {}
  };

  const startQuiz = (type, unitId = null) => {
    let pool = unitId ? QUESTIONS.filter(q => q.unit === unitId) : QUESTIONS;
    const nums = type === 'real' ? 20 : type === 'full' ? 50 : pool.length;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, nums);
    setQuestions(shuffled);
    setMode(type);
    setCurrentUnit(unitId);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setShowExp(false);
    setMissed([]);
    setTimeLeft(type === 'real' ? 1800 : 0);
    setView('quiz');
    speak(`Starting ${type === 'real' ? 'real exam mode' : type === 'full' ? 'full practice' : 'unit practice'}. Good luck!`);
  };

  const handleAnswer = (answer) => {
    if (showExp) return;
    const q = questions[currentIdx];
    let correct = false;
    if (q.type === 'tf') correct = (answer === true) === q.a;
    else if (q.type === 'fib') correct = String(answer).toLowerCase().trim() === String(q.a).toLowerCase();
    else correct = answer === q.a;

    setSelected(answer);
    setShowExp(true);
    if (correct) setScore((s) => s + 1);
    else setMissed((m) => [...m, q]);

    const key = currentUnit || mode;
    setStats(prev => {
      const prog = prev.unitProgress[key] || { correct: 0, total: 0 };
      prog.total += 1;
      if (correct) prog.correct += 1;
      const newStats = {
        ...prev,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        unitProgress: { ...prev.unitProgress, [key]: prog }
      };
      saveStats(newStats);
      return newStats;
    });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowExp(false);
      speak(questions[currentIdx + 1]?.q || '');
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    const finalScore = score;
    const passed = mode === 'real' ? finalScore >= 16 : finalScore >= Math.ceil(questions.length * 0.8);
    if (passed && mode === 'real') {
      setStats(prev => {
        const newStats = { ...prev, examsPassed: prev.examsPassed + 1 };
        saveStats(newStats);
        return newStats;
      });
      try {
        confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
    setScore(finalScore);
    setView('results');
  };

  const QuestionInput = ({ q }) => {
    if (!q) return null;
    if (q.type === 'tf') {
      return (
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
          {['True', 'False'].map(opt => (
            <button key={opt} disabled={showExp} onClick={() => handleAnswer(opt === 'True')}
              aria-pressed={showExp && selected === (opt === 'True')}
              className={`p-8 text-2xl font-bold rounded-xl border-4 transition-all ${showExp
                ? (q.a === (opt === 'True') ? 'border-green-500 bg-green-100' : selected === (opt === 'True') ? 'border-red-500 bg-red-100' : 'border-gray-300')
                : 'border-gray-400 hover:border-blue-600 hover:bg-blue-50'}`}>
              {opt}
            </button>
          ))}
        </div>
      );
    }
    if (q.type === 'fib') {
      const [input, setInput] = React.useState('');
      return (
        <div className="max-w-2xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} disabled={showExp}
            className="w-full p-6 text-2xl border-4 rounded-xl text-center" placeholder="Type answer here" />
          <button onClick={() => handleAnswer(input)} disabled={showExp || !input.trim()}
            className="mt-6 px-12 py-4 bg-blue-600 text-white rounded-xl text-xl font-bold">Submit</button>
        </div>
      );
    }
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {q.o.map((opt, i) => (
          <button key={i} disabled={showExp} onClick={() => handleAnswer(opt)}
            className={`w-full p-6 text-left text-xl rounded-xl border-4 transition-all ${showExp
              ? (opt === q.a ? 'border-green-500 bg-green-100' : selected === opt ? 'border-red-500 bg-red-100' : 'border-gray-300')
              : 'border-gray-400 hover:border-blue-600 hover:bg-blue-50'}`}>
            {opt}
            {showExp && opt === q.a && <CheckCircle className="inline ml-4 text-green-600" size={32} />}
            {showExp && selected === opt && opt !== q.a && <AlertCircle className="inline ml-4 text-red-600" size={32} />}
          </button>
        ))}
      </div>
    );
  };

  if (view === 'menu') {
    return (
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">Minnesota School Bus (S) Endorsement Training 2026</h1>
        <p className="text-xl text-gray-700 mb-12">Free interactive practice • Real exam simulation • Progress tracking</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <button onClick={() => startQuiz('real')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-8 px-12 rounded-2xl text-2xl shadow-lg">
            Real Exam Mode (20 random Qs • 30 min timer • 80% to pass)
          </button>
          <button onClick={() => startQuiz('full')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-8 px-12 rounded-2xl text-2xl shadow-lg">
            Full Practice Test (50 questions)
          </button>
        </div>

        <h2 className="text-3xl font-bold text-blue-900 mb-8">Practice by Unit</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {UNIT_TITLES.map(u => {
            const prog = stats.unitProgress[u.id] || { correct: 0, total: 0 };
            const pct = prog.total ? Math.round((prog.correct / prog.total) * 100) : 0;
            return (
              <button key={u.id} onClick={() => startQuiz('unit', u.id)}
                className="bg-white hover:bg-gray-50 border-4 border-blue-200 rounded-2xl p-6 text-left shadow-md transition">
                <div className="flex items-center gap-4">
                  <u.icon size={48} className="text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold">{u.title}</h3>
                    <p className="text-sm text-gray-600">Progress: {pct}% ({prog.correct}/{prog.total})</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-gray-600">
          <p>Exams Passed: {stats.examsPassed} | Total Correct Answers: {stats.totalCorrect}</p>
        </div>
      </div>
    );
  }

  if (view === 'quiz') {
    const q = questions[currentIdx];
    const progress = ((currentIdx + (showExp ? 1 : 0)) / questions.length) * 100;
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-blue-800 text-white p-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>Question {currentIdx + 1} of {questions.length}</div>
            {mode === 'real' && <div className="text-2xl font-mono"><Clock size={32} className="inline" /> {formatTime(timeLeft)}</div>}
            <button onClick={() => setView('menu')} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded">Exit</button>
          </div>
          <div className="w-full bg-gray-300 h-4 mt-2 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex-1 p-8">
          <h2 className="text-3xl font-bold text-center mb-12">{q?.q}</h2>
          <QuestionInput q={q} />

          {showExp && (
            <div className="mt-12 max-w-4xl mx-auto">
              <div className={`p-6 rounded-xl ${selected === q.a ? 'bg-green-100 border-4 border-green-500' : 'bg-red-100 border-4 border-red-500'}`}>
                <p className="text-2xl font-bold mb-4">{selected === q.a ? 'Correct!' : 'Incorrect'}</p>
                <p className="text-lg"><strong>Explanation:</strong> {q.exp}</p>
                {q.s && <p className="text-sm mt-4"><strong>Source:</strong> {q.s} • {q.r}</p>}
              </div>
              <button onClick={nextQuestion} className="mt-6 px-12 py-4 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700">
                {currentIdx < questions.length - 1 ? 'Next Question' : 'See Results'} <ChevronRight className="inline ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'results') {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = mode === 'real' ? score >= 16 : percentage >= 80;
    return (
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold mb-8">{passed ? 'Congratulations! You Passed!' : 'Keep Practicing'}</h1>
        <div className="text-6xl font-bold text-blue-900 mb-4">{score} / {questions.length}</div>
        <p className="text-3xl mb-8">{percentage}% Correct</p>

        {passed && mode === 'real' && <Trophy size={120} className="mx-auto text-yellow-500 mb-8" />}

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 print-only">
            <h2 className="text-3xl font-bold mb-4">Minnesota School Bus Training - Exam Report</h2>
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>Score: {score}/{questions.length} ({percentage}%)</p>
            <p>Result: {passed ? 'PASSED' : 'Did not pass'}</p>
          </div>

          {missed.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Questions to Review ({missed.length})</h2>
              <div className="space-y-6 text-left">
                {missed.map((q, i) => (
                  <div key={i} className="bg-red-50 p-6 rounded-xl border-2 border-red-300">
                    <p className="font-bold text-xl">{q.q}</p>
                    <p className="mt-2"><strong>Correct Answer:</strong> {q.a}</p>
                    <p className="mt-2">{q.exp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-8 no-print">
            <button onClick={() => window.print()} className="bg-gray-800 text-white px-8 py-4 rounded-xl text-xl flex items-center gap-3">
              <Printer size={32} /> Print Report
            </button>
            <button onClick={() => setView('menu')} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
