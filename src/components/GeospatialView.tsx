import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup
} from "react-simple-maps";
import { motion, AnimatePresence } from "motion/react";
import { Map, Navigation, Compass, AlertCircle, Info, Wind, Clock, CloudRain, Zap, CloudLightning } from "lucide-react";

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const weatherEvents = [
  { id: 'weather-1', type: 'storm', coords: [-40, 15] as [number, number], intensity: 'High', description: 'Tropical Depression "Nexus"' },
  { id: 'weather-2', type: 'wind', coords: [35, 45] as [number, number], intensity: 'Moderate', description: 'Gale Force Winds > 50kts' },
  { id: 'weather-3', type: 'lightning', coords: [-15, -10] as [number, number], intensity: 'Severe', description: 'Atmospheric Discharge Zone' }
];

interface GeospatialViewProps {
  redirection?: {
    from: [number, number]; // [lon, lat]
    to: [number, number];
    alternative?: [number, number][];
  };
  isScanning?: boolean;
}

const GeospatialView: React.FC<GeospatialViewProps> = ({ redirection, isScanning }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="w-full h-96 bg-white rounded-3xl overflow-hidden relative border border-gray-200 shadow-2xl group font-mono">
      {isScanning && (
         <motion.div 
            initial={{ y: -100 }}
            animate={{ y: [0, 384, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-brand-500/50 shadow-[0_0_20px_rgba(59,130,246,1)] z-20"
         />
      )}
      
      {/* Header UI */}
      <div className="absolute top-6 left-6 z-10 space-y-2">
        <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
           <Map className="w-3 h-3" />
           Live Geospatial Grounding
        </h3>
        <div className="flex gap-1 sm:gap-2">
           <span className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-widest bg-white/80 backdrop-blur-md px-2 py-1 rounded border border-gray-100 shadow-sm hidden sm:block">Satellite Redirect Overlay v2.1</span>
           <span className="text-[7px] sm:text-[8px] text-brand-500 font-bold uppercase tracking-widest bg-brand-50/80 backdrop-blur-md px-2 py-1 rounded border border-brand-100 shadow-sm animate-pulse">Neural Link Active</span>
        </div>
      </div>
      
      {/* Legend & Controls */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end font-mono">
          <div className="flex gap-2">
             <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-red-500 uppercase">Blocked</span>
             </div>
             <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 backdrop-blur-xl">
                <Navigation className="w-2.5 h-2.5 text-brand-500" />
                <span className="text-[8px] font-black text-brand-500 uppercase">Redirecting</span>
             </div>
             <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl">
                <CloudLightning className="w-2.5 h-2.5 text-amber-500" />
                <span className="text-[8px] font-black text-amber-500 uppercase">Hazards</span>
             </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-3 rounded-2xl flex flex-col gap-2 w-48 shadow-sm">
             <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-400">ZOOM LEVEL</span>
                <span className="text-brand-600 font-bold">1.4x</span>
             </div>
             <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-brand-500" />
             </div>
             <div className="flex justify-between items-center text-[9px] mt-1">
                <span className="text-gray-400">SIGNAL</span>
                <div className="flex gap-0.5">
                   {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-2 rounded-sm ${i < 4 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}
                </div>
             </div>
          </div>
      </div>

      {/* Map Content */}
      <ComposableMap
        projectionConfig={{
          scale: 160,
          rotate: [-10, 0, 0]
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} center={[0, 20]} maxZoom={5}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#F1F5F9"
                  stroke="#E2E8F0"
                  strokeWidth={0.8}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#E2E8F0", outline: "none" },
                    pressed: { outline: "none" }
                  }}
                />
              ))
            }
          </Geographies>

          {redirection && (
            <>
              {/* Blocked Path with Animation */}
              <Line
                from={redirection.from}
                to={redirection.to}
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeOpacity={0.4}
              />
              <Marker coordinates={[(redirection.from[0] + redirection.to[0])/2, (redirection.from[1] + redirection.to[1])/2]}>
                 <AlertCircle className="w-5 h-5 text-red-500/40 -translate-x-1/2 -translate-y-1/2" />
              </Marker>

              {/* Redirect Path */}
              {redirection.alternative && redirection.alternative.length > 0 && (
                 <>
                    <Line
                       coordinates={[redirection.from, ...redirection.alternative, redirection.to]}
                       stroke="#3B82F6"
                       strokeWidth={2.5}
                       strokeLinecap="round"
                    />
                    {redirection.alternative.map((point, index) => (
                       <Marker 
                          key={`marker-${point[0]}-${point[1]}-${index}`} 
                          coordinates={point}
                          onMouseEnter={() => setHoveredNode(`waypoint-${index}`)}
                          onMouseLeave={() => setHoveredNode(null)}
                       >
                          <circle r={3} fill="white" stroke="#3B82F6" strokeWidth={2} className="cursor-pointer hover:fill-brand-500 transition-all shadow-sm" />
                          <circle r={8} fill="#3B82F6" className="opacity-0 group-hover:opacity-20 transition-opacity" />
                       </Marker>
                    ))}
                 </>
              )}

              {/* Endpoints */}
              <Marker 
                coordinates={redirection.from}
                onMouseEnter={() => setHoveredNode('origin')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle r={hoveredNode === 'origin' ? 8 : 5} fill="#EF4444" className="animate-pulse duration-[2000ms] cursor-help transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <circle r={hoveredNode === 'origin' ? 12 : 8} fill="none" stroke="#EF4444" strokeWidth={1} strokeOpacity={0.3} className="animate-ping" />
              </Marker>

              <Marker 
                coordinates={redirection.to}
                onMouseEnter={() => setHoveredNode('destination')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle r={hoveredNode === 'destination' ? 8 : 5} fill="#10B981" className="cursor-help transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <circle r={hoveredNode === 'destination' ? 12 : 8} fill="none" stroke="#10B981" strokeWidth={1} strokeOpacity={0.3} className="animate-ping" />
              </Marker>
            </>
          )}

          {/* Weather Layers */}
          {weatherEvents.map((event) => (
             <Marker 
                key={event.id} 
                coordinates={event.coords}
                onMouseEnter={() => setHoveredNode(event.id)}
                onMouseLeave={() => setHoveredNode(null)}
             >
                <g className="cursor-help transition-transform hover:scale-125">
                   <circle r={10} fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
                   {event.type === 'storm' && <CloudRain className="w-3 h-3 text-blue-500 -translate-x-1/2 -translate-y-1/2" />}
                   {event.type === 'lightning' && <CloudLightning className="w-3 h-3 text-amber-500 -translate-x-1/2 -translate-y-1/2 animate-pulse" />}
                   {event.type === 'wind' && <Wind className="w-3 h-3 text-cyan-600 -translate-x-1/2 -translate-y-1/2" />}
                </g>
             </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip Overlay */}
      <AnimatePresence>
         {hoveredNode && (
            <motion.div
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            >
               <div className="bg-white/95 backdrop-blur-xl border border-gray-200 p-4 rounded-2xl shadow-xl flex items-center gap-4 min-w-[240px]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                     hoveredNode === 'origin' ? 'bg-red-50 text-red-500' : 
                     hoveredNode === 'destination' ? 'bg-emerald-50 text-emerald-500' : 
                     hoveredNode.startsWith('weather-') ? 'bg-amber-50 text-amber-500' :
                     'bg-brand-50 text-brand-500'
                  }`}>
                     {hoveredNode === 'origin' ? <Compass className="w-5 h-5" /> : 
                      hoveredNode === 'destination' ? <Navigation className="w-5 h-5" /> : 
                      hoveredNode.startsWith('weather-') ? <Wind className="w-5 h-5" /> :
                      <Navigation className="w-5 h-5" />}
                  </div>
                  <div>
                     <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                        {hoveredNode.startsWith('weather-') ? 'Atmospheric Hazard' : 'Geospatial Entity'}
                     </p>
                     <p className="text-xs font-bold text-gray-900 capitalize">
                        {hoveredNode === 'origin' ? 'Disrupted Port Node' : 
                         hoveredNode === 'destination' ? 'Neural Link Destination' : 
                         hoveredNode.startsWith('weather-') ? weatherEvents.find(e => e.id === hoveredNode)?.description :
                         'Transit Waypoint 01'}
                     </p>
                     <div className="flex gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                           <Clock className="w-3 h-3 text-brand-400" />
                           <span className="text-[9px] text-gray-400">
                              {hoveredNode.startsWith('weather-') ? 'Now Casting' : '+14.2h Delay'}
                           </span>
                        </div>
                        <div className="flex items-center gap-1">
                           <Info className="w-3 h-3 text-brand-400" />
                           <span className="text-[9px] text-gray-400">
                              {hoveredNode.startsWith('weather-') ? `Intensity: ${weatherEvents.find(e => e.id === hoveredNode)?.intensity}` : '92% Reliable'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Footer Info Box */}
      {redirection && (
         <div className="absolute bottom-6 right-6 z-10 bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm p-4 rounded-2xl flex gap-6">
            <div className="space-y-1">
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Displacement</p>
               <p className="text-sm font-black text-gray-900">4,210nm</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="space-y-1">
               <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Est. Divergence</p>
               <p className="text-sm font-black text-brand-600">+12% Cost</p>
            </div>
         </div>
      )}

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:20px_20px]" />
    </div>
  );
};

export default GeospatialView;
