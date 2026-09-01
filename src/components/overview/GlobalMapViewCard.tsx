import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../state/AppContext';
import { NeonCard } from '../common/NeonCard';
import { Globe } from 'lucide-react';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import * as topojson from 'topojson-client';

export const GlobalMapViewCard: React.FC = () => {
  const { theme } = useApp();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [worldData, setWorldData] = useState<any | null>(null);
  const [activeBeacon, setActiveBeacon] = useState<'us' | 'eu' | 'ap'>('us');

  // Load standard TopoJSON 110m world atlas
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.objects && data.objects.countries) {
          const countries = topojson.feature(data, data.objects.countries as any);
          setWorldData(countries);
        }
      })
      .catch((err) => {
        console.warn('World map atlas fetch error, using fallback geometry', err);
      });
  }, []);

  // Map dimensions
  const width = 460;
  const height = 240;

  // D3 Geo projection (Natural Earth)
  const projection = geoNaturalEarth1()
    .scale(82)
    .translate([width / 2, height / 2 + 10]);

  const pathGenerator = geoPath().projection(projection);
  const graticule = geoGraticule()();

  // Key Global Infrastructure Monitoring Beacons with Exact Geocoordinates
  const beacons = [
    {
      id: 'us' as const,
      label: 'United States (Active Grid)',
      loadPct: 28,
      status: 'HIGH LOAD +33%',
      isTarget: true,
      coords: [-98.5795, 39.8283] as [number, number],
      position: projection([-98.5795, 39.8283]) || [130, 95],
    },
    {
      id: 'eu' as const,
      label: 'Western Europe Interconnect',
      loadPct: 14,
      status: 'STABLE',
      isTarget: false,
      coords: [10.4515, 51.1657] as [number, number],
      position: projection([10.4515, 51.1657]) || [240, 75],
    },
    {
      id: 'ap' as const,
      label: 'Asia-Pacific Core Hub',
      loadPct: 22,
      status: 'OPTIMAL',
      isTarget: false,
      coords: [138.2529, 36.2048] as [number, number],
      position: projection([138.2529, 36.2048]) || [380, 98],
    },
  ];

  return (
    <NeonCard className="h-full min-h-[300px]" accentVariant="grey">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <span>Global Map View</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
          </h3>
          <p className="text-[11px] opacity-60">Global grid infrastructure & telemetry sensors</p>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
            theme === 'dark'
              ? 'bg-[#151622] border-white/10 text-zinc-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <Globe size={13} className="text-red-500" />
          <span>Global Sentinel</span>
        </div>
      </div>

      {/* D3 World Map Visualization Canvas */}
      <div
        className={`relative flex-1 w-full my-2 rounded-xl overflow-hidden flex items-center justify-center border ${
          theme === 'dark'
            ? 'bg-[#080911] border-slate-700/60 ring-1 ring-white/5'
            : 'bg-[#f1f5f9]/80 border-slate-200'
        }`}
      >
        {/* Subtle grid pattern background */}
        <div
          className={`absolute inset-0 pointer-events-none ${
            theme === 'dark' ? 'opacity-20' : 'opacity-[0.05]'
          }`}
          style={{
            backgroundImage: `radial-gradient(${theme === 'dark' ? '#94a3b8' : '#0f172a'} 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }}
        />

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-h-[220px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Sphere/Ocean background */}
          <rect
            width={width}
            height={height}
            fill={theme === 'dark' ? '#090b14' : '#f8fafc'}
          />

          {/* Graticule Latitude / Longitude lines */}
          <path
            d={pathGenerator(graticule) || ''}
            fill="none"
            stroke={theme === 'dark' ? '#222738' : '#e2e8f0'}
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />

          {/* Render Geographic Land Masses from TopoJSON */}
          {worldData && worldData.features ? (
            <g className="countries-layer">
              {worldData.features.map((feature: any, i: number) => {
                const pathStr = pathGenerator(feature);
                if (!pathStr) return null;
                const isUSA = feature.id === '840';

                return (
                  <path
                    key={`country-${i}`}
                    d={pathStr}
                    fill={
                      isUSA
                        ? theme === 'dark'
                          ? '#3b151b'
                          : '#fee2e2'
                        : theme === 'dark'
                        ? '#222638'
                        : '#cbd5e1'
                    }
                    stroke={
                      isUSA
                        ? '#ef4444'
                        : theme === 'dark'
                        ? '#475569'
                        : '#94a3b8'
                    }
                    strokeWidth={isUSA ? '1.4' : '0.8'}
                    className="transition-colors duration-200 hover:opacity-80"
                  />
                );
              })}
            </g>
          ) : (
            /* High-contrast crisp continent geometric silhouette if TopoJSON is loading */
            <g
              fill={theme === 'dark' ? '#222638' : '#cbd5e1'}
              stroke={theme === 'dark' ? '#475569' : '#94a3b8'}
              strokeWidth="1"
            >
              {/* North America */}
              <path
                d="M50 35 L140 30 L180 50 L165 95 L120 115 L95 105 L60 70 Z"
                fill={theme === 'dark' ? '#3b151b' : '#fee2e2'}
                stroke="#ef4444"
                strokeWidth="1.4"
              />
              {/* South America */}
              <path d="M125 115 L165 130 L155 195 L130 185 L118 130 Z" />
              {/* Europe */}
              <path d="M210 35 L265 40 L260 80 L230 80 L210 55 Z" />
              {/* Africa */}
              <path d="M210 85 L270 90 L265 160 L230 170 L205 115 Z" />
              {/* Asia */}
              <path d="M265 30 L400 35 L390 115 L315 105 L265 75 Z" />
              {/* Australia */}
              <path d="M335 135 L395 140 L385 185 L330 175 Z" />
              {/* Antarctica */}
              <path d="M50 220 L410 220 L380 235 L80 235 Z" fill={theme === 'dark' ? '#181b28' : '#e2e8f0'} />
            </g>
          )}

          {/* Flight / Telemetry Interconnect curved arcs */}
          <path
            d={`M ${beacons[0].position[0]} ${beacons[0].position[1]} Q ${(beacons[0].position[0] + beacons[1].position[0]) / 2} 40 ${beacons[1].position[0]} ${beacons[1].position[1]}`}
            fill="none"
            stroke={theme === 'dark' ? '#f43f5e' : '#ef4444'}
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.8"
            className="animate-flow-dash"
          />
          <path
            d={`M ${beacons[1].position[0]} ${beacons[1].position[1]} Q ${(beacons[1].position[0] + beacons[2].position[0]) / 2} 45 ${beacons[2].position[0]} ${beacons[2].position[1]}`}
            fill="none"
            stroke={theme === 'dark' ? '#10b981' : '#059669'}
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.8"
            className="animate-flow-dash"
          />

          {/* Interactive Radar Beacons */}
          {beacons.map((beacon) => {
            const [bx, by] = beacon.position;
            const isUs = beacon.id === 'us';

            return (
              <g
                key={beacon.id}
                transform={`translate(${bx}, ${by})`}
                onClick={() => setActiveBeacon(beacon.id)}
                className="cursor-pointer"
              >
                {/* Outer pinging radar circle */}
                <circle
                  r={isUs ? '15' : '10'}
                  fill="none"
                  stroke={isUs ? '#ef4444' : '#10b981'}
                  strokeWidth="1.5"
                  opacity="0.75"
                  className="animate-ping"
                />

                {/* Inner glowing dot */}
                <circle
                  r={isUs ? '5.5' : '4'}
                  fill={isUs ? '#ef4444' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="drop-shadow-md"
                />

                {/* Pinpoint Label for US grid */}
                {isUs && (
                  <g transform="translate(10, -20)">
                    <rect
                      x="0"
                      y="0"
                      width="96"
                      height="26"
                      rx="6"
                      fill={theme === 'dark' ? '#161926' : '#ffffff'}
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      className="shadow-lg"
                    />
                    <text
                      x="8"
                      y="11"
                      fontSize="8.5"
                      fontWeight="bold"
                      fill={theme === 'dark' ? '#ffffff' : '#0f172a'}
                    >
                      28% United States
                    </text>
                    <text
                      x="8"
                      y="20"
                      fontSize="7.5"
                      fontWeight="bold"
                      fill="#ef4444"
                    >
                      Substation A Overload
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info Row */}
      <div
        className={`flex items-center justify-between pt-2 border-t text-[11px] ${
          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="opacity-70">Focus Grid:</span>
          <span className="font-bold text-red-500">North American East-Central</span>
        </div>
        <div className="font-mono text-emerald-500 font-semibold">100% Sensors Online</div>
      </div>
    </NeonCard>
  );
};
