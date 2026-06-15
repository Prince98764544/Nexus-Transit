import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Terminal, ShieldCheck, Activity, Database, Server, Box, Cpu } from 'lucide-react';
import { mcpBridge, MCPTool } from '../lib/mcp';

const MCPControlPlane: React.FC = () => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED'>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    connectToMCPServers();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const connectToMCPServers = async () => {
    setStatus('CONNECTING');
    addLog("Initiating MCP Handshake with Remote Gateway...");
    
    const discovered = await mcpBridge.discoverTools();
    
    setTimeout(() => {
      setTools(discovered);
      setStatus('CONNECTED');
      addLog(`Discovered ${discovered.length} remote tool(s) via MCP.`);
    }, 1500);
  };

  return (
    <section className="bg-[#0A0A0C] border border-brand-500/20 rounded-3xl overflow-hidden shadow-2xl relative group">
      {/* HUD Header */}
      <div className="bg-brand-500/10 border-b border-brand-500/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Network className={`w-5 h-5 ${status === 'CONNECTED' ? 'text-brand-400' : 'text-gray-500'}`} />
             {status === 'CONNECTED' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">MCP Control Plane</h3>
            <p className="text-[8px] font-bold text-brand-500/60 uppercase">Model Context Protocol v1.0.4</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${status === 'CONNECTED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
          {status}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Remote Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-brand-500/30 transition-all cursor-crosshair group/tool"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center group-hover/tool:bg-brand-500/20 transition-colors">
                  {tool.name.includes('congestion') ? <Activity className="w-5 h-5 text-brand-400" /> : <ShieldCheck className="w-5 h-5 text-brand-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Tool Endpoint</p>
                  <h4 className="text-[11px] font-bold text-white mb-2">{tool.name}</h4>
                  <p className="text-[9px] text-gray-400 leading-relaxed font-medium">{tool.description}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-1">
                  {Object.keys(tool.inputSchema.properties).map(p => (
                    <span key={p} className="text-[7px] font-mono text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded">{p}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 opacity-40">
                  <Cpu className="w-3 h-3 text-white" />
                  <span className="text-[8px] font-black text-white uppercase">Ready</span>
                </div>
              </div>
            </motion.div>
          ))}
          {status === 'CONNECTING' && [1, 2].map(i => (
             <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 h-32 animate-pulse" />
          ))}
        </div>

        {/* Live MCP Bus Logs */}
        <div className="bg-black border border-white/10 rounded-2xl p-4 font-mono">
          <div className="flex items-center gap-2 mb-3">
             <Terminal className="w-3 h-3 text-brand-500" />
             <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">MCP Event Bus</span>
          </div>
          <div className="space-y-1.5 h-20 overflow-y-auto scrollbar-hide">
             {logs.map((log, i) => (
                <p key={i} className="text-[9px] text-brand-400/80 leading-tight">
                  <span className="opacity-40">{new Date().toLocaleTimeString()}</span> {log}
                </p>
             ))}
             {status === 'IDLE' && <p className="text-[9px] text-white/20 italic">Awaiting neural link initialization...</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MCPControlPlane;
