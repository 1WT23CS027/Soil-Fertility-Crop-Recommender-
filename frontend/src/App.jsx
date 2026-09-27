import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, Thermometer, Droplets, CloudRain, TestTube, 
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, 
  Layers, ShieldCheck, HeartPulse, ArrowRight, ArrowLeft
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

const RANGES = {
  N: { min: 0, max: 140, label: "mg/kg" },
  P: { min: 0, max: 145, label: "mg/kg" },
  K: { min: 0, max: 205, label: "mg/kg" },
  ph: { min: 3.5, max: 10, label: "pH" },
  temperature: { min: 10, max: 45, label: "°C" },
  humidity: { min: 10, max: 100, label: "%" },
  rainfall: { min: 20, max: 300, label: "mm" }
};

const BACKGROUND_IMAGES = {
  '/': "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80",
  '/soil-analysis': "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=2000&q=80",
  '/crop-intelligence': "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80",
  '/soil-care': "https://images.unsplash.com/photo-1592417817098-8f3d6eb19657?auto=format&fit=crop&w=2000&q=80"
};

function SubtleBackground({ bgUrl }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img src={bgUrl} alt="Background" className="w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-radial from-[#0B1A12]/40 via-[#0B1A12]/75 to-[#0B1A12]/95" />
      <div className="absolute inset-0 bg-[#0B1A12]/30 mix-blend-multiply" />
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col justify-center py-6 px-4 md:px-8"
    >
      {children}
    </motion.div>
  );
}

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Soil Analysis", path: "/soil-analysis" },
    { label: "Crop Intelligence", path: "/crop-intelligence" },
    { label: "Soil Care", path: "/soil-care" },
  ];

  return (
    <header className="relative z-30 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-[#0B1A12]/80 backdrop-blur-md">
      <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
        <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
          <span className="text-xl">🌱</span>
        </div>
        <span className="text-xl font-bold text-white tracking-wide">AgriSense AI</span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`text-sm font-medium transition-colors hover:text-emerald-400 ${
              location.pathname === item.path ? "text-emerald-400 font-semibold" : "text-emerald-100/70"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button 
        onClick={() => navigate('/soil-analysis')}
        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full transition-all shadow-lg shadow-emerald-900/30"
      >
        Analyze Field →
      </button>
    </header>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(-1)} 
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 text-emerald-200 text-sm font-medium transition-all mb-6"
    >
      <ArrowLeft className="w-4 h-4 text-[#A3E635]" />
      <span>Back</span>
    </button>
  );
}

export default function App() {
  const [inputs, setInputs] = useState({
    N: 75, P: 45, K: 45, ph: 6.5,
    temperature: 26, humidity: 70, rainfall: 110
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (field, val) => {
    const numVal = parseFloat(val);
    setInputs(prev => ({ ...prev, [field]: isNaN(numVal) ? 0 : numVal }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setPrediction(null);
    setPredictionError(null);
    setLoadingStep(1);

    const stepTwoTimer = setTimeout(() => setLoadingStep(2), 700);
    const stepThreeTimer = setTimeout(() => setLoadingStep(3), 1400);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.crop?.id) {
        throw new Error(data.error || `Prediction service returned HTTP ${response.status}`);
      }

      // The backend returns the canonical crop object. Do not reconstruct the
      // crop name or image path on the frontend, which previously caused
      // prediction/image mismatches.
      setPrediction({ ...data.crop, confidence: data.confidence });
      navigate('/crop-intelligence');
    } catch (err) {
      console.error("Prediction service error:", err);
      setPredictionError(err.message || "Unable to get a crop recommendation.");
    } finally {
      clearTimeout(stepTwoTimer);
      clearTimeout(stepThreeTimer);
      setLoadingStep(0);
      setIsAnalyzing(false);
    }
  };

  const currentBg = BACKGROUND_IMAGES[location.pathname] || BACKGROUND_IMAGES['/'];

  return (
    <div className="relative text-[#E4EFE7] font-sans min-h-screen flex flex-col justify-between">
      <SubtleBackground bgUrl={currentBg} />

      <div className="relative z-10">
        <NavBar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route 
              path="/soil-analysis" 
              element={
                <PageWrapper>
                  <SoilAnalysisPage 
                    inputs={inputs} 
                    handleChange={handleChange} 
                    handleAnalyze={handleAnalyze} 
                    isAnalyzing={isAnalyzing} 
                    loadingStep={loadingStep}
                    predictionError={predictionError}
                  />
                </PageWrapper>
              } 
            />
            <Route 
              path="/crop-intelligence" 
              element={
                <PageWrapper>
                  <CropIntelligencePage 
                    prediction={prediction} 
                    inputs={inputs} 
                    isAnalyzing={isAnalyzing} 
                  />
                </PageWrapper>
              } 
            />
            <Route path="/soil-care" element={<PageWrapper><SoilCarePage inputs={inputs} /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>

      <footer className="py-8 border-t border-white/10 text-center text-emerald-200/50 text-xs bg-[#0B1A12]/90 backdrop-blur-md relative z-20">
        <p>© 2026 AgriSense Precision AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[calc(100vh-6rem)] flex items-center justify-center px-6 text-center">
      <div className="relative z-20 max-w-4xl mx-auto space-y-8 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#A3E635] text-sm font-semibold tracking-wide">
          <Sparkles className="w-4 h-4" />
          <span>PRECISION AI CROP RECOMMENDATION ENGINE</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
          UNDERSTAND YOUR SOIL.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] via-emerald-400 to-teal-200">
            GROW SMARTER.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto font-normal leading-relaxed">
          AI-powered crop recommendations engineered from real-time soil chemistry and micro-climate environmental telemetry.
        </p>
        <div>
          <button 
            onClick={() => navigate('/soil-analysis')}
            className="group bg-gradient-to-r from-[#2E8B57] to-[#1B4D3E] hover:from-[#34A064] text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl transition-all flex items-center gap-3 mx-auto"
          >
            <span>Analyze Your Soil</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}

function SoilAnalysisPage({ inputs, handleChange, handleAnalyze, isAnalyzing, loadingStep, predictionError }) {
  return (
    <section className="relative py-12 px-6">
      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        <BackButton />
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Field Telemetry Analysis</h1>
          <p className="text-emerald-200/70 text-base">Enter field measurement values below to configure the model:</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sprout className="text-[#A3E635]" /> Soil Profile</h3>
            <ParameterInputCard label="Nitrogen (N)" field="N" value={inputs.N} unit="mg/kg" icon={<Sprout className="text-emerald-400" />} onChange={handleChange} range={RANGES.N} />
            <ParameterInputCard label="Phosphorus (P)" field="P" value={inputs.P} unit="mg/kg" icon={<Layers className="text-[#A3E635]" />} onChange={handleChange} range={RANGES.P} />
            <ParameterInputCard label="Potassium (K)" field="K" value={inputs.K} unit="mg/kg" icon={<ShieldCheck className="text-teal-400" />} onChange={handleChange} range={RANGES.K} />
            <ParameterInputCard label="Soil pH" field="ph" value={inputs.ph} unit="pH" step="0.1" icon={<TestTube className="text-sky-400" />} onChange={handleChange} range={RANGES.ph} />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Thermometer className="text-amber-400" /> Climate Profile</h3>
            <ParameterInputCard label="Temperature" field="temperature" value={inputs.temperature} unit="°C" step="0.5" icon={<Thermometer className="text-amber-400" />} onChange={handleChange} range={RANGES.temperature} />
            <ParameterInputCard label="Humidity" field="humidity" value={inputs.humidity} unit="%" icon={<Droplets className="text-blue-400" />} onChange={handleChange} range={RANGES.humidity} />
            <ParameterInputCard label="Rainfall" field="rainfall" value={inputs.rainfall} unit="mm" icon={<CloudRain className="text-cyan-400" />} onChange={handleChange} range={RANGES.rainfall} />
          </div>
        </div>

        {predictionError && (
          <div className="max-w-xl mx-auto flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Prediction service unavailable</p>
              <p className="text-xs text-amber-100/70 mt-1">{predictionError}</p>
              <p className="text-xs text-emerald-200/50 mt-2">Make sure <code>python server.py</code> is running on port 5000.</p>
            </div>
          </div>
        )}

        <div className="pt-8 text-center">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full max-w-xl mx-auto bg-gradient-to-r from-[#2E8B57] via-[#226350] to-[#1B4D3E] hover:from-[#359B62] text-white font-extrabold text-xl py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 border border-emerald-400/30"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#A3E635]" />
                <span>Step {loadingStep} of 3: Computing Recommendation...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-[#A3E635]" />
                <span>ANALYZE SOIL & RECOMMEND CROP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function CropIntelligencePage({ prediction, inputs, isAnalyzing }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [prediction?.id]);

  return (
    <section className="relative py-12 px-6 min-h-[75vh]">
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <BackButton />

        {!prediction && !isAnalyzing && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 space-y-4">
            <Sprout className="w-16 h-16 text-emerald-400/40 mx-auto" />
            <p className="text-xl text-emerald-200/60">No soil telemetry analysis found.</p>
            <button onClick={() => navigate('/soil-analysis')} className="bg-[#2E8B57] text-white px-6 py-3 rounded-full font-bold">Go to Soil Analysis</button>
          </div>
        )}

        {prediction && !isAnalyzing && (
          <div className="bg-[#122A1E] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12 space-y-6 flex flex-col justify-center">
                <span className="px-4 py-1.5 rounded-full bg-[#A3E635]/20 text-[#A3E635] text-xs font-bold tracking-wider uppercase border border-[#A3E635]/30 w-fit">
                  OPTIMAL CROP MATCH FOUND
                </span>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight capitalize">{prediction.name}</h2>
                <p className="text-emerald-100/80 text-base">{prediction.desc}</p>

                {prediction.confidence != null && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 w-fit">
                    <CheckCircle2 className="w-5 h-5 text-[#A3E635]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-200/50">Model confidence</p>
                      <p className="text-lg font-bold text-white">{prediction.confidence}%</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#A3E635]" /> pH ({inputs.ph})</div>
                  <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#A3E635]" /> Temp ({inputs.temperature}°C)</div>
                  <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#A3E635]" /> Nitrogen ({inputs.N})</div>
                  <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#A3E635]" /> Rainfall ({inputs.rainfall}mm)</div>
                </div>
              </div>

              <div className="relative min-h-[350px] lg:min-h-full overflow-hidden bg-[#0A1710] flex items-center justify-center">
                {!imageError ? (
                  <img
                    src={prediction.image}
                    alt={prediction.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <Sprout className="w-16 h-16 text-[#A3E635]" />
                    <p className="text-white font-bold">{prediction.name}</p>
                    <p className="text-xs text-emerald-200/50 max-w-xs">
                      The image for this predicted crop could not be loaded.
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#122A1E] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#122A1E] pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SoilCarePage({ inputs }) {
  return (
    <section className="relative py-12 px-6">
      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <BackButton />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl"><HeartPulse className="w-8 h-8 text-[#A3E635]" /></div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Soil Health Diagnostics</h1>
            <p className="text-emerald-200/70 text-sm">Remediation guidance based on parameter telemetry</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CareGuidanceCard title="Nutrient Management" status={inputs.N < 40 ? "warning" : "good"} advice={inputs.N < 40 ? "Nitrogen levels are low. Consider organic manure or leguminous cover crops." : "Nutrient levels are well balanced."} />
          <CareGuidanceCard title="pH Balance Care" status={inputs.ph < 6.0 || inputs.ph > 7.5 ? "warning" : "good"} advice={inputs.ph < 6.0 ? "Soil is acidic. Apply lime or wood ash." : inputs.ph > 7.5 ? "Soil is alkaline. Add organic compost." : "pH balance is ideal."} />
          <CareGuidanceCard title="Moisture Management" status={inputs.rainfall < 60 ? "warning" : "good"} advice={inputs.rainfall < 60 ? "Low rainfall region. Utilize drip irrigation." : "Precipitation levels supply adequate hydration."} />
        </div>
      </div>
    </section>
  );
}

function ParameterInputCard({ label, field, value, unit, step = "1", icon, onChange, range }) {
  const safeVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">{icon}<span className="text-sm font-semibold text-white">{label}</span></div>
        <span className="text-xs text-emerald-300 font-mono font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">{safeVal} {unit}</span>
      </div>
      <div className="flex items-center gap-4">
        <input type="range" min={range.min} max={range.max} step={step} value={safeVal} onChange={(e) => onChange(field, e.target.value)} className="w-full accent-[#A3E635]" />
        <input type="number" step={step} value={value} onChange={(e) => onChange(field, e.target.value)} className="w-20 bg-black/40 border border-white/20 rounded-xl px-2 py-1 text-center text-sm font-bold text-white" />
      </div>
    </div>
  );
}

function CareGuidanceCard({ title, status, advice }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-base">{title}</h3>
        {status === "warning" ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
      </div>
      <p className="text-emerald-100/70 text-sm leading-relaxed">{advice}</p>
    </div>
  );
}