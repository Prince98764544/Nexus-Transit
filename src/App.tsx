import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, AlertCircle, CheckCircle, Layers, Package, Send, 
  ShieldAlert, Truck, Zap, Moon, Sun, LayoutDashboard, 
  Settings, User, Map, BarChart3, LogOut, Menu, X, Github,
  Terminal, ChevronRight, Play, FileText, Download, FileCheck, Info, Clock, Navigation,
  Upload, Eye, ShieldCheck, Cpu, Network
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Markdown from 'react-markdown';
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  useAuthState 
} from 'react-firebase-hooks/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import GeospatialView from './components/GeospatialView';
import MCPControlPlane from './components/MCPControlPlane';
import { mcpBridge } from './lib/mcp';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getAI();

type TraceLog = {
  id: string;
  agent: string;
  message: string;
  status: 'active' | 'success' | 'warning' | 'error';
  timestamp: string;
};

type A2UIComponent = {
  id: string;
  type: 'ActionCard' | 'Table' | 'Map';
  props?: any;
  data?: {
    headers?: string[];
    rows?: any[][];
  };
};

const AgentTraceViewer = ({ log }: { log: TraceLog }) => {
   let colorClass = "text-brand-500";
   if (log.agent.includes("RISK")) colorClass = "text-red-500";
   else if (log.agent.includes("FREIGHT")) colorClass = "text-amber-600";
   else if (log.agent.includes("COMPLIANCE")) colorClass = "text-emerald-600";

   return (
      <div className="space-y-3 bg-white/40 p-4 rounded-xl border border-gray-100/50 backdrop-blur-sm">
         <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded bg-gray-100 text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{log.agent}</span>
            {log.message.includes("Tool Invocation") && (
               <span className="px-2 py-0.5 rounded bg-brand-500 text-white text-[8px] font-black uppercase tracking-widest">TOOL_INVOCATION</span>
            )}
            <div className={`flex-1 h-px bg-gray-100/50`} />
            <span className="text-[9px] text-gray-300 font-mono">{log.timestamp}</span>
         </div>
         <div className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto scrollbar-hide">
            <Markdown>{log.message}</Markdown>
         </div>
      </div>
   );
};

const ImpactChart = ({ data }: { data: any[] }) => {
   if (!data || data.length === 0) return null;
   
   return (
      <div className="h-64 mt-6 bg-white/50 p-4 rounded-2xl border border-gray-100">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
               <XAxis 
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} 
               />
               <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} 
               />
               <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
               />
               <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                     <Cell key={`cell-${entry.category || index}`} fill={entry.color || '#3B82F6'} />
                  ))}
               </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
   );
};

const FileUploader = ({ onFileSelect }: { onFileSelect: (base64: string) => void }) => {
   const [preview, setPreview] = useState<string | null>(null);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setPreview(reader.result as string);
            onFileSelect(base64String);
         };
         reader.readAsDataURL(file);
      }
   };

   return (
      <div className="relative group">
         <input 
            type="file" 
            accept="image/*" 
            onChange={handleChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
         />
         <div className={`w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${preview ? 'border-brand-500 bg-brand-50/10' : 'border-gray-200 bg-gray-50 group-hover:border-brand-300'}`}>
            {preview ? (
               <img src={preview} alt="Grounding Preview" className="h-full w-full object-cover rounded-xl" />
            ) : (
               <>
                  <Upload className="w-5 h-5 text-gray-400 mb-2 group-hover:text-brand-500 transition-colors" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-500">Image Grounding (Sat/Docs)</span>
               </>
            )}
         </div>
         {preview && (
            <button 
               onClick={(e) => { e.stopPropagation(); setPreview(null); onFileSelect(''); }}
               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg z-20"
            >
               <X className="w-3 h-3" />
            </button>
         )}
      </div>
   );
};

const FinalReportView = ({ reports, onExport, onClose }: { reports: any, onExport: () => void, onClose: () => void }) => {
   return (
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="bg-white border border-gray-200 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-full"
      >
         <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <CheckCircle className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Orchestration Complete</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-Modal Resolution Mesh Finalized</p>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-red-500 transition-colors">[ CLOSE REPORT ]</button>
               <button onClick={onExport} className="flex items-center gap-2 px-5 py-3 bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20">
                  <Download className="w-4 h-4" />
                  Export PDF Report
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            {reports.mapData && (
               <div className="space-y-4">
                  <GeospatialView redirection={reports.mapData} isScanning={false} />
                  <div className="flex gap-4">
                     {reports.prediction && (
                        <div className="flex-1 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                              <Activity className="w-5 h-5 text-emerald-600" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Self-Healing Prediction</p>
                              <p className="text-xs font-bold text-gray-700">{reports.prediction}</p>
                           </div>
                        </div>
                     )}
                     <div className="flex-1 bg-brand-50/50 border border-brand-100 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                           <Cpu className={`w-5 h-5 ${reports.confidence > 80 ? 'text-emerald-600' : 'text-brand-600'}`} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Neural Confidence Score</p>
                           <p className={`text-xs font-black ${reports.confidence > 80 ? 'text-emerald-600' : 'text-brand-600'}`}>{reports.confidence}% Probability of Optimal Resolution</p>
                        </div>
                     </div>
                  </div>

                  {reports.manifestInfo && (
                     <div className="bg-amber-50/30 border border-amber-100 p-6 rounded-3xl flex items-start gap-6 animate-in slide-in-from-left-4 duration-500">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
                           <FileText className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Vision Manifest Extraction</h4>
                           <div className="flex gap-4">
                              <p className="text-xs text-gray-700"><strong>BOL ID:</strong> {reports.manifestInfo.id}</p>
                              <p className="text-xs text-gray-700"><strong>Contents:</strong> {reports.manifestInfo.contents}</p>
                           </div>
                           <p className="text-[10px] italic text-red-500 font-bold mt-2">Detected Risk: {reports.manifestInfo.detectedRisk}</p>
                        </div>
                     </div>
                  )}
               </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Risk Assessment */}
               <div className="space-y-6 bg-gray-50/30 p-8 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="w-4 h-4 text-brand-500" />
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">RISK ASSESSMENT</h3>
                  </div>
                  <div className="prose prose-sm max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-strong:text-brand-500 font-medium leading-relaxed">
                     <Markdown>{reports.risk}</Markdown>
                  </div>
                  {reports.charts?.riskImpact && (
                     <ImpactChart data={reports.charts.riskImpact} />
                  )}
               </div>

               {/* Freight Strategy */}
               <div className="space-y-6 bg-gray-50/30 p-8 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-3">
                     <Truck className="w-4 h-4 text-brand-500" />
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">FREIGHT STRATEGY</h3>
                  </div>
                  <div className="prose prose-sm max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-strong:text-brand-500 font-medium leading-relaxed">
                     <Markdown>{reports.strategy}</Markdown>
                  </div>
                  {reports.charts?.costAnalysis && (
                     <ImpactChart data={reports.charts.costAnalysis} />
                  )}
               </div>
            </div>

            {/* Strategic Roadmap */}
            {reports.roadmap && (
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <Zap className="w-4 h-4 text-brand-500" />
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">RESOLUTION ROADMAP</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {reports.roadmap.map((step: any, idx: number) => (
                        <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl relative group hover:border-brand-300 transition-all">
                           <div className="absolute -top-3 left-4 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-[8px] font-bold text-gray-400 uppercase tracking-widest group-hover:bg-brand-500 group-hover:text-white transition-colors">Phase 0{idx + 1}</div>
                           <p className="text-xs font-bold text-gray-800 mb-2 mt-2">{step.step}</p>
                           <div className="flex items-center justify-between mt-4">
                              <span className="text-[9px] font-black text-brand-500 uppercase flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 {step.duration}
                              </span>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${step.risk === 'High' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                 {step.risk} Risk
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Memory Citation */}
            <div className="bg-[#0A0A0C] p-10 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)]" />
               <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px]" />
               
               <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center shrink-0 border border-white/10 group-hover:border-brand-500/50 transition-colors">
                     <Layers className="w-8 h-8 text-brand-400 animate-pulse" />
                  </div>
                  <div className="space-y-3 flex-1 text-center md:text-left">
                     <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">AlloyDB Memory Recall</h4>
                     </div>
                     <p className="text-xl font-black text-white leading-tight">Citing Strategy Cluster <span className="text-brand-400">#NEX-882-V2</span></p>
                     <p className="text-sm text-gray-400 font-medium max-w-xl">Nexus identified a 99.4% variance match with a 2024 Port Strike scenario. Re-weighting node priorities based on historical success metrics to ensure 100% compliance delivery.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 shrink-0">
                     <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/5 text-center">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Success Prob.</p>
                        <p className="text-lg font-black text-white">98.2%</p>
                     </div>
                     <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/5 text-center">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Data Points</p>
                        <p className="text-lg font-black text-white">12.4k</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Verified Report (Customs) */}
            <div className="space-y-6 bg-white p-10 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-10 -mt-10 rounded-full blur-3xl" />
               <div className="flex items-center gap-3 mb-8">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-900">Verified Compliance Protocol</h3>
               </div>
               <div className="prose prose-sm max-w-none prose-p:text-gray-500 prose-strong:text-gray-900 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  <Markdown>{reports.verified}</Markdown>
               </div>
            </div>
         </div>
      </motion.div>
   );
};

export default function App() {
  const [user, loading, errorAuth] = useAuthState(auth);
  const [logs, setLogs] = useState<TraceLog[]>([]);
  const [input, setInput] = useState('Suez Canal blockage causing 14-day delay for European shipments.');
  const [isSimulating, setIsSimulating] = useState(false);
  const [reports, setReports] = useState<any>(null);
  const [lastMapData, setLastMapData] = useState<any>(null);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [hitlData, setHitlData] = useState<any>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string>('');
  const [caseHistory, setCaseHistory] = useState<any[]>([]);
  const [sentimentFeed, setSentimentFeed] = useState<any[]>([
     { id: 1, source: 'PORT_OF_LA_API', msg: 'Vessel queue increasing +12%', type: 'warning' },
     { id: 2, source: 'ROUTERS_FINANCE', msg: 'Potential strike in Hamburg ports', type: 'error' },
     { id: 3, source: 'SENTINEL_SAT', msg: 'Weather patterns clearing Suez', type: 'success' }
  ]);
  const [thinkingLevel, setThinkingLevel] = useState('HIGH (Reasoning)');
  const [maxLoops, setMaxLoops] = useState(3);
  const logCounter = useRef(0);

  const login = () => {
     const provider = new GoogleAuthProvider();
     signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  useEffect(() => {
     if (user) {
        const fetchHistory = async () => {
           const q = query(
              collection(db, "cases"), 
              where("userId", "==", user.uid),
              orderBy("timestamp", "desc"),
              limit(5)
           );
           const querySnapshot = await getDocs(q);
           const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           setCaseHistory(history);
        };
        fetchHistory();
     }
  }, [user]);

  const generateId = () => {
    logCounter.current += 1;
    return `nexus-${logCounter.current}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const exportReport = () => {
    if (!reports) return;

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Title
    doc.setFontSize(22);
    doc.text('Nexus Transit Resolution Protocol', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${timestamp}`, 14, 28);
    doc.text(`Scenario: ${caseHistory[0]?.scenario || 'N/A'}`, 14, 34);

    let yPos = 45;

    // Add Risk
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Risk Assessment', 14, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(50);
    const riskLines = doc.splitTextToSize(reports.risk, 180);
    doc.text(riskLines, 14, yPos);
    yPos += (riskLines.length * 5) + 15;

    if (yPos > 250) { doc.addPage(); yPos = 20; }

    // Add Strategy
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Freight Strategy', 14, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(50);
    const strategyLines = doc.splitTextToSize(reports.strategy, 180);
    doc.text(strategyLines, 14, yPos);
    yPos += (strategyLines.length * 5) + 15;

    if (yPos > 220) { doc.addPage(); yPos = 20; }

    // Add Verified
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Verified Compliance', 14, yPos);
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(80);
    const verifiedLines = doc.splitTextToSize(reports.verified, 180);
    doc.text(verifiedLines, 14, yPos);

    doc.save('Nexus_Resolution_Report.pdf');
  };

  const simulateDisruption = async (promptMsg: string, hitlResponse?: string) => {
    if (!promptMsg.trim() || isSimulating || !user) return;
    setIsSimulating(true);
    
    if (!hitlResponse) {
       // Only clear the report if it's a fresh run, but keep the map data for visual continuity
       setReports(null);
       setShowFinalReport(false);
       setLogs([]);
    }
    
    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    
    try {
      // Stateful Memory: Fetch similar historical context (simulated vector search)
      const historicalContext = caseHistory.length > 0 
         ? `HISTORICAL CONTEXT (AlloyDB Memory): Similar case resolved previously: ${caseHistory[0].scenario}. Strategy used: ${caseHistory[0].resolution.substring(0, 50)}...`
         : "No historical context found in AlloyDB memory clusters.";

      const systemInstruction = `You are the Nexus Multi-Agent Orchestrator (A2O) for Global Supply Chain.
      
      CAPABILITIES:
      - Vision: Analyze images (Bills of Lading, Sat Imagery, Cargo Manifests). Extract specific tracking IDs, container numbers, and seal statuses.
      - HITL: Trigger "verification_request" for critical approvals.
      - Geospatial Grounding: Provide "mapData" for routing. **CRITICAL: You MUST always return realistic [longitude, latitude] coordinates for the scenario.**
      - MCP_TOOL_USAGE: You can call remote tools via the Model Context Protocol. Available: get_maritime_congestion, regulatory_compliance_check.
      - Stateful Memory: Use historical context provided manually.
      - Predictive Analysis: Provide a "prediction" field with a self-healing strategy.
      
      WORKFLOW:
      1. Initialization & Historical Lookup (${historicalContext})
      2. MCP_RESOURCE_DISCOVERY: Identify relevant remote tools.
      3. PREDICTIVE_SENTIMENT_ANALYSIS: Search RSS and social feeds for risks.
      4. VISION_GROUNDING: Deep inspection of visual evidence.
      5. PARALLEL_RE-ROUTING_SOLVER: Calculate alternative routes.
      6. [Optional] HUMAN_IN_THE_LOOP verification.
      7. MCP_TOOL_EXECUTION: Call discovered tools for validation.
      8. COMPLIANCE_SEALING.
      
      RESPONSE SCHEMA:
      {
         "logs": [{"agent": "AGENT_NAME", "message": "Log content"}],
         "reports": {
            "confidence": Number (0-100),
            "manifestInfo": { "id": "String", "contents": "String", "detectedRisk": "String" } | null,
            "risk": "Markdown text",
            "strategy": "Markdown text",
            "verified": "Markdown text",
            "prediction": "One sentence predictive healing strategy",
            "roadmap": [{"step": "String", "duration": "String", "risk": "Low|Med|High"}],
            "charts": {
               "riskImpact": [{"category": "String", "impact": Number, "color": "Hex"}],
               "costAnalysis": [{"category": "String", "impact": Number, "color": "Hex"}]
            },
            "mapData": {
               "from": [number, number],
               "to": [number, number],
               "alternative": [[number, number], ...]
            }
         },
         "verification_request": {
            "description": "Description",
            "actionRequired": "Action"
         } | null
      }
      
      **GEOSPATIAL COORDINATES GUIDE (lon, lat):**
      - Suez Canal: [32.3, 30.6]
      - Rotterdam: [4.4, 51.9]
      - Shanghai: [121.5, 31.2]
      - Los Angeles: [-118.2, 34.0]
      - Hamburg: [9.9, 53.5]
      - Singapore: [103.8, 1.3]
      - Panama Canal: [-79.9, 9.1]
      
      Coordinate agents: SENTIMENT_ANALYSIS, NEXUS_TRANSIT, VISION_CORE, RISK_AGENT, FREIGHT_AGENT, COMPLIANCE_CRITIC.`;

      const contents: any[] = [{ role: 'user', parts: [{ text: `SCENARIO: ${promptMsg}` }] }];
      if (uploadedBase64) {
         contents[0].parts.push({
            inlineData: {
               mimeType: "image/jpeg",
               data: uploadedBase64
            }
         });
      }

      if (hitlResponse) {
         contents.push({ role: 'user', parts: [{ text: `User Action: ${hitlResponse}. Proceed to finalization.` }] });
      }

      if (!ai) {
        setLogs(prev => [...prev, { 
          id: generateId(), 
          agent: 'SYSTEM', 
          message: 'Uplink failure: AI Core not initialized. Please ensure GEMINI_API_KEY is configured in the environment.', 
          status: 'error', 
          timestamp: now() 
        }]);
        setIsSimulating(false);
        return;
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            thinkingConfig: {
               thinkingLevel: thinkingLevel.includes('HIGH') ? ThinkingLevel.HIGH : thinkingLevel.includes('MEDIUM') ? ThinkingLevel.LOW : ThinkingLevel.MINIMAL
            }
          }
        });
      } catch (genError: any) {
        if (genError?.message?.includes('429') || genError?.message?.includes('Quota')) {
           setLogs(prev => [...prev, { 
             id: generateId(), 
             agent: 'SYSTEM', 
             message: 'CRITICAL: Neural Link Congestion (Rate Exceeded). The orchestrator is overloaded. Please wait 60 seconds for the uplink to stabilize before retrying.', 
             status: 'error', 
             timestamp: now() 
           }]);
        } else {
           throw genError;
        }
        setIsSimulating(false);
        return;
      }

      const data = JSON.parse(response.text);
      
      // Step-by-step log output
      if (Array.isArray(data.logs)) {
        for (const log of data.logs) {
          setLogs(prev => [...prev, { ...log, id: generateId(), timestamp: now(), status: 'active' }]);
          await new Promise(r => setTimeout(r, 800));
          
          // Dynamic MCP Injection: If we encounter a compliance log, show the MCP tool execution
          if (log.agent === 'COMPLIANCE_CRITIC' || log.message.includes('Compliance')) {
             setLogs(prev => [...prev, { 
               id: generateId(), 
               agent: 'MCP_BRIDGE', 
               message: 'MCP Tool Triggered: [regulatory_compliance_check]. Validating against remote EU ruleset...', 
               status: 'active', 
               timestamp: now() 
             }]);
             await mcpBridge.executeTool('regulatory_compliance_check', { manifest_id: 'NEX-882', destination_country: 'Germany' });
             await new Promise(r => setTimeout(r, 600));
             setLogs(prev => [...prev, { 
               id: generateId(), 
               agent: 'MCP_BRIDGE', 
               message: 'MCP Result: SUCCESS. Tool [regulatory_compliance_check] confirmed full compliance.', 
               status: 'success', 
               timestamp: now() 
             }]);
          }
        }
      }

      if (data.verification_request) {
         setHitlData(data.verification_request);
         setLogs(prev => [...prev, { 
            id: generateId(), 
            agent: 'NEXUS_TRANSIT', 
            message: 'HUMAN INTERVENTION REQUIRED: Pausing for protocol verification...', 
            status: 'warning', 
            timestamp: now() 
         }]);
      } else {
         setReports(data.reports);
         setLastMapData(data.reports.mapData);
         setShowFinalReport(true);
         setHitlData(null);

         // Persistence: Save to Firestore Case History (Stateful Memory)
         if (!hitlResponse) {
            try {
               await addDoc(collection(db, "cases"), {
                  userId: user.uid,
                  scenario: promptMsg,
                  resolution: data.reports.strategy,
                  impactScore: data.reports.charts?.riskImpact?.[0]?.impact || 50,
                  timestamp: Timestamp.now(),
                  isPublic: false
               });
            } catch (pErr) {
               console.error("Historical persistence failed:", pErr);
            }
         }
      }

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, { id: generateId(), agent: 'SYSTEM', message: 'Uplink failure to Multi-Agent Orchestrator. Check connectivity or API quota.', status: 'error', timestamp: now() }]);
    }

    setIsSimulating(false);
  }

  if (!user && !loading) {
     return (
        <div className="h-screen bg-[#0A0A0C] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl space-y-8 text-center"
           >
              <div className="w-20 h-20 bg-brand-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-brand-500/40">
                 <Truck className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-4">
                 <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Nexus Command</h1>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                    Please authorize your uplink to the Multi-Agent Orchestrator (A2O).
                 </p>
              </div>
              <button 
                onClick={login}
                className="w-full bg-brand-500 text-white py-5 rounded-2xl font-black text-sm tracking-[0.2em] uppercase shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                 <ShieldCheck className="w-5 h-5" />
                 Initialize Uplink
              </button>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                 Biometric Authentication Required
              </p>
           </motion.div>
        </div>
     );
  }

  if (loading) {
     return (
        <div className="h-screen bg-[#FBFBFD] flex items-center justify-center">
           <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-500 animate-bounce" />
              <div className="w-3 h-3 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-3 h-3 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFD] text-[#1D1D1F] font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-10 shrink-0 z-50 sticky top-0">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-xl font-black tracking-[0.05em] uppercase whitespace-nowrap leading-none">Nexus Transit</h1>
            <p className="text-[7px] sm:text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Autonomous Logistics</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 hidden xl:block overflow-hidden relative group">
           <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
           <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
           <motion.div 
             animate={{ x: [0, -1000] }}
             transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
             className="flex gap-12 whitespace-nowrap"
           >
              {[1, 2, 3].map(set => (
                 <div key={set} className="flex gap-12 items-center">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Suez Canal: </span>
                       <span className="text-[10px] font-bold text-gray-700">Congestion increasing +14.2%</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Panama Port: </span>
                       <span className="text-[10px] font-bold text-gray-700">Clearance rate optimized</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hamburg: </span>
                       <span className="text-[10px] font-bold text-gray-700">Labor negotiations escalating</span>
                    </div>
                 </div>
              ))}
           </motion.div>
        </div>

        <div className="flex items-center gap-2 sm:gap-8 shrink-0">
          <div className="hidden md:flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Load</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`load-bar-${i}`} className={`w-0.5 h-2 rounded-full ${i <= 3 ? 'bg-brand-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Agents</span>
            <span className="text-xs sm:text-lg font-black text-brand-500 leading-none">06</span>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <button 
             onClick={logout}
             className="flex flex-col items-end gap-1 group"
          >
            <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap group-hover:text-red-500 transition-colors">Logout</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] sm:text-xs font-black uppercase text-emerald-600 tracking-tighter group-hover:text-red-600 transition-colors">{user?.displayName?.split(' ')[0] || 'User'}</span>
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 lg:grid lg:grid-cols-12 gap-6 lg:p-10 p-4 bg-gray-50/50 overflow-y-auto">

        
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
          
          {/* Disruption Scenario */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-brand-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-brand-500">DISRUPTION SCENARIO</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setInput("Port strike in Rotterdam affecting all Tier 1 containers.")}
                  className={`px-3 py-1 text-[10px] font-bold border rounded-md transition-colors ${input.includes("strike") ? 'border-brand-100 text-brand-500 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  Strike
                </button>
                <button 
                  onClick={() => setInput("Suez Canal blockage causing 14-day delay for European shipments.")}
                  className={`px-3 py-1 text-[10px] font-bold border rounded-md transition-colors ${input.includes("Suez") ? 'border-brand-100 text-brand-500 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  Weather
                </button>
              </div>
            </div>
            
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:bg-white transition-all resize-none scrollbar-hide"
            />

            <div className="space-y-4">
               <FileUploader onFileSelect={setUploadedBase64} />
               
               <button 
                  onClick={() => simulateDisruption(input)}
                  disabled={isSimulating || !input.trim()}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-3 shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all"
               >
                  {isSimulating ? (
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                        <span>Orchestrating...</span>
                     </div>
                  ) : (
                     <>
                        <Play className="w-4 h-4 fill-current" />
                        Initialize Nexus
                     </>
                  )}
               </button>
            </div>
          </section>

          {/* Engine Settings */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-brand-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Engine Settings</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thinking Level</label>
                <select value={thinkingLevel} onChange={(e) => setThinkingLevel(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold transition-all">
                  <option>HIGH (Reasoning)</option>
                  <option>MEDIUM (Balanced)</option>
                  <option>LOW (Velocity)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Max Loops</label>
                <input type="number" value={maxLoops} onChange={(e) => setMaxLoops(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold transition-all" />
              </div>
            </div>
          </section>

          {/* Agent Hierarchy */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-brand-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Predictive Pulse</h2>
            </div>
            <div className="space-y-3">
               {sentimentFeed.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100 group hover:bg-white transition-all">
                     <div className={`w-1 h-auto rounded-full ${item.type === 'error' ? 'bg-red-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                     <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.source}</p>
                        <p className="text-[10px] font-bold text-gray-700 truncate">{item.msg}</p>
                     </div>
                  </div>
               ))}
               <button className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-brand-500 hover:text-brand-600 transition-colors animate-pulse">
                  [ SCANNING LIVE FEEDS... ]
               </button>
            </div>
          </section>

          {/* Agent Hierarchy */}
          <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6 flex-1 min-h-[400px]">
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-brand-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Agent Hierarchy</h2>
            </div>
            <div className="space-y-4 font-mono text-[11px] overflow-hidden">
              <div className="flex items-center gap-4 text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100 min-w-0">
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="font-black text-gray-900 truncate flex-1">nexus_transit</span>
                <span className="ml-auto text-[9px] opacity-60 bg-white px-2 py-0.5 rounded border border-gray-100 uppercase flex-shrink-0">Sequential</span>
              </div>
              <div className="ml-4 sm:ml-6 space-y-4 border-l-2 border-gray-100/50 pl-4 sm:pl-6 overflow-hidden">
                <div className="flex items-center gap-4 text-gray-700 bg-gray-50/30 p-3 rounded-xl border border-gray-100 min-w-0">
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="font-bold truncate flex-1">sentiment_analysis_node</span>
                  <span className="ml-auto text-[9px] opacity-60 bg-white px-2 py-0.5 rounded border border-gray-100 uppercase flex-shrink-0">Live RSS</span>
                </div>
                <div className="flex items-center gap-4 text-gray-700 bg-gray-50/30 p-3 rounded-xl border border-gray-100 min-w-0">
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="font-bold truncate flex-1">pre_routing_team</span>
                  <span className="ml-auto text-[9px] opacity-60 bg-white px-2 py-0.5 rounded border border-gray-100 uppercase flex-shrink-0">Parallel</span>
                </div>
                <div className="ml-4 sm:ml-6 space-y-2 border-l-2 border-gray-100/30 pl-4 sm:pl-6">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 transition-all hover:bg-brand-50/20 group min-w-0">
                      <div className="w-5 h-5 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center text-[10px] group-hover:bg-brand-50 transition-colors">🌐</div>
                      <span className="text-gray-600 font-bold truncate flex-1">risk_agent</span>
                      <span className="ml-auto text-[8px] font-black text-brand-500 opacity-80 px-1.5 py-0.5 bg-brand-50 rounded uppercase flex-shrink-0">3-Flash</span>
                   </div>
                   <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 transition-all hover:bg-brand-50/20 group min-w-0">
                      <div className="w-5 h-5 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center text-[10px] group-hover:bg-brand-50 transition-colors">📦</div>
                      <span className="text-gray-600 font-bold truncate flex-1">freight_agent</span>
                      <span className="ml-auto text-[8px] font-black text-brand-500 opacity-80 px-1.5 py-0.5 bg-brand-50 rounded uppercase flex-shrink-0">3-Flash</span>
                   </div>
                </div>
                <div className="flex items-center gap-4 text-gray-700 bg-gray-50/30 p-3 rounded-xl border border-gray-100 min-w-0">
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="font-bold truncate flex-1">customs_compliance_team</span>
                  <span className="ml-auto text-[9px] opacity-60 bg-white px-2 py-0.5 rounded border border-gray-100 uppercase flex-shrink-0">Loop</span>
                </div>
                <div className="ml-4 sm:ml-6 space-y-2 border-l-2 border-gray-100/30 pl-4 sm:pl-6">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 font-bold truncate flex-1">document_generator</span>
                      <span className="ml-auto text-[8px] font-black text-brand-500 opacity-80 px-1.5 py-0.5 bg-brand-50 rounded uppercase flex-shrink-0">3-Flash</span>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 min-w-0">
                      <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 font-bold truncate flex-1">compliance_critic</span>
                      <span className="ml-auto text-[8px] font-black text-emerald-600 opacity-80 px-1.5 py-0.5 bg-emerald-50 rounded uppercase flex-shrink-0">3.1-Pro</span>
                    </div>
                </div>
              </div>
            </div>
          </section>

          {/* Strategic Roadmap (Simplified Sidebar version or the existing Diagnostics) */}
          <section className="bg-[#0A0A0C] rounded-3xl p-6 space-y-4 border border-white/5">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">System Online</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-500/60 uppercase">Uptime: 24d 14h 02m</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Latency</p>
                   <p className="text-xs font-mono font-bold text-white">42ms</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Stability</p>
                   <p className="text-xs font-mono font-bold text-white">99.98%</p>
                </div>
             </div>
             <div className="flex justify-between items-center pt-2">
                <div className="flex gap-1">
                   {[...Array(8)].map((_, i) => (
                      <div key={i} className={`w-1 h-3 rounded-full ${i < 6 ? 'bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
                   ))}
                </div>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Link Stable</span>
             </div>
          </section>

          {/* Model Context Protocol Interface */}
          <MCPControlPlane />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-[600px]">

          {!showFinalReport ? (
             <>
               {/* Always show map at top of right column when not in final report mode */}
               <div className="shrink-0">
                  <GeospatialView 
                     redirection={lastMapData} 
                     isScanning={isSimulating} 
                  />
               </div>

               {/* Logs View */}
               <section className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 backdrop-blur-sm sticky top-0 z-10">
                     <div className="flex items-center gap-4">
                        <Terminal className="w-4 h-4 text-gray-400" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Live Execution Logs</h2>
                     </div>
                     <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
                    <AnimatePresence mode="popLayout">
                      {logs.length === 0 && !isSimulating && (
                        <motion.div key="empty-logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center gap-8 opacity-40 py-20">
                           <div className="relative">
                              <Activity className="w-16 h-16 text-brand-500 animate-[pulse_3s_ease-in-out_infinite]" />
                              <div className="absolute inset-0 bg-brand-500 blur-3xl opacity-20 -z-10" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Awaiting System Initialization</span>
                        </motion.div>
                      )}
                      
                      {isSimulating && logs.length === 0 && (
                         <motion.div 
                            key="orchestrating-message"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-4 py-20"
                         >
                            <div className="flex gap-2">
                               <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                               <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                               <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500/60 animate-pulse px-10 text-center">Orchestrating Autonomous Resolution Mesh...</span>
                         </motion.div>
                      )}

                      {logs.map(log => (
                        <motion.div 
                           key={`log-${log.id}`} 
                           initial={{ opacity: 0, x: -10 }} 
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ type: 'spring', stiffness: 100 }}
                        >
                          <AgentTraceViewer log={log} />
                        </motion.div>
                      ))}
                      
                      {isSimulating && logs.length > 0 && (
                         <div className="flex justify-center py-4">
                            <div className="flex gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
                               <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.1s]" />
                               <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                            </div>
                         </div>
                      )}

                      {hitlData && !isSimulating && (
                         <motion.div 
                            key="hitl-request"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0A0A0C] border border-brand-500/30 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(59,130,246,0.15)] relative overflow-hidden group my-6"
                         >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32 transition-transform group-hover:scale-125 duration-1000" />
                            <div className="relative z-10 space-y-8">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                                     <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
                                  </div>
                                  <div>
                                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Nexus Override Required</h3>
                                     <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.3em] mt-1">Status: Awaiting Commander Verification</p>
                                  </div>
                               </div>

                               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-2">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Branch</p>
                                  <p className="text-gray-300 font-medium leading-relaxed">{hitlData.description}</p>
                               </div>

                               <div className="flex flex-col sm:flex-row gap-4">
                                  <button 
                                     onClick={() => simulateDisruption(input, `APPROVED: ${hitlData.actionRequired}`)}
                                     className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0"
                                  >
                                     <CheckCircle className="w-4 h-4" />
                                     {hitlData.actionRequired || 'Upgrade Protocol'}
                                  </button>
                                  <button 
                                     onClick={() => setHitlData(null)}
                                     className="px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
                                  >
                                     Abort
                                  </button>
                               </div>
                               
                               <div className="flex items-center justify-center gap-2 pt-4">
                                  <div className="w-1 h-1 rounded-full bg-brand-500" />
                                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.5em]">System holding in suspended logic state...</span>
                                  <div className="w-1 h-1 rounded-full bg-brand-500" />
                               </div>
                            </div>
                         </motion.div>
                      )}
                      <div key="logs-end-spacer" ref={logsEndRef} className="h-10" />
                    </AnimatePresence>
                  </div>
               </section>
             </>
          ) : (
            <FinalReportView 
               reports={reports} 
               onExport={exportReport} 
               onClose={() => setShowFinalReport(false)} 
            />
          )}
        </div>
      </main>

    </div>
  );
}
