"use client";

import React, {
  useRef,
  useState,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Panel } from "@/components/ui/PrintComponentTwo";

interface RoofPlannerProps {
  panels: Panel[];
  onPanelsChange: (panels: Panel[]) => void;
  onClose?: () => void; // 🔹 pour fermer la popup
}

type CornerId = "p1" | "p2" | "p3" | "p4";

interface CornerPoint {
  id: CornerId;
  cx: number;
  cy: number;
}

const INITIAL_POINTS: CornerPoint[] = [
  { id: "p1", cx: 400, cy: 350 },
  { id: "p2", cx: 650, cy: 340 },
  { id: "p3", cx: 660, cy: 520 },
  { id: "p4", cx: 420, cy: 530 },
];

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

const RoofPlanner: React.FC<RoofPlannerProps> = ({ onPanelsChange, onClose }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [points, setPoints] = useState<CornerPoint[]>(INITIAL_POINTS);
  const [draggingId, setDraggingId] = useState<CornerId | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [validated, setValidated] = useState(false);
  const [locked, setLocked] = useState(false);

  const getSvgCoords = (
    evt: ReactPointerEvent<SVGSVGElement> | PointerEvent
  ) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const pt = svg.createSVGPoint();
    const e = evt as PointerEvent;
    pt.x = e.clientX;
    pt.y = e.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  };

  const polygonPoints = React.useMemo(() => {
    const coords = points.map((p) => ({ ...p }));

    const cx = coords.reduce((s, c) => s + c.cx, 0) / coords.length;
    const cy = coords.reduce((s, c) => s + c.cy, 0) / coords.length;

    coords.forEach((c) => {
      (c as any).angle = Math.atan2(c.cy - cy, c.cx - cx);
    });

    coords.sort(
      (a: any, b: any) => (a.angle as number) - (b.angle as number)
    );

    return coords.map((c) => `${c.cx},${c.cy}`).join(" ");
  }, [points]);

  const handleCornerPointerDown = (
    evt: ReactPointerEvent<SVGCircleElement>,
    id: CornerId
  ) => {
    if (locked) return;
    evt.preventDefault();
    evt.stopPropagation();

    const svgPos = getSvgCoords(evt.nativeEvent);
    const current = points.find((p) => p.id === id);
    if (!current) return;

    setDragOffset({
      x: current.cx - svgPos.x,
      y: current.cy - svgPos.y,
    });
    setDraggingId(id);
  };

  const handleSvgPointerMove = (evt: ReactPointerEvent<SVGSVGElement>) => {
    if (!draggingId || locked) return;

    const svgPos = getSvgCoords(evt.nativeEvent);

    let nx = svgPos.x + dragOffset.x;
    let ny = svgPos.y + dragOffset.y;

    nx = clamp(nx, 0, 1024);
    ny = clamp(ny, 0, 730);

    setPoints((prev) =>
      prev.map((p) =>
        p.id === draggingId
          ? {
              ...p,
              cx: nx,
              cy: ny,
            }
          : p
      )
    );
  };

  const handleSvgPointerUp = () => {
    setDraggingId(null);
  };

  const handleValidate = () => {
    setValidated(true);
    setLocked(true);

    const xs = points.map((p) => p.cx);
    const ys = points.map((p) => p.cy);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const ordered = [...points];
    const cx = ordered.reduce((s, c) => s + c.cx, 0) / ordered.length;
    const cy = ordered.reduce((s, c) => s + c.cy, 0) / ordered.length;
    (ordered as any[]).forEach((c: any) => {
      c.angle = Math.atan2(c.cy - cy, c.cx - cx);
    });
    (ordered as any[]).sort((a: any, b: any) => a.angle - b.angle);

    const corners = ordered.map((p) => ({ x: p.cx, y: p.cy }));

    const newPanel: Panel = {
      id: Date.now(),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      corners,
    };

    onPanelsChange([newPanel]);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-5 space-y-4 bg-white">
      {/* Header popup */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div>
          <h2 className="text-lg font-semibold text-[#0f427c]">
            Calepinage – sélection des panneaux
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Déplacez les <span className="font-semibold">4 points</span> sur les
            coins du champ photovoltaïque, puis validez.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleValidate}
            disabled={validated}
            className={`px-3 py-2 text-sm rounded-lg shadow-sm border ${
              validated
                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-default"
                : "bg-[#344d95] text-white hover:bg-[#d32f2f]"
            }`}
          >
            {validated ? "Panneaux validés ✅" : "Valider les panneaux"}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          )}
        </div>
      </div>

      <div
        className="relative w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100"
        style={{ aspectRatio: "14 / 10" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1024 730"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full select-none touch-none"
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={handleSvgPointerUp}
        >
          {/* Image toit */}
          <image
            href="/toit-maison.jpg"
            x="0"
            y="0"
            width="1024"
            height="730"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Pattern panneaux */}
          <defs>
            <pattern
              id="pvPatternBlack"
              patternUnits="objectBoundingBox"
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <rect x="0" y="0" width="1" height="1" fill="#02030a" />

              <linearGradient id="pvGradBB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1b2738" stopOpacity="0.95" />
                <stop offset="0.45" stopColor="#050812" stopOpacity="0.97" />
                <stop offset="1" stopColor="#000000" stopOpacity="0.99" />
              </linearGradient>
              <rect x="0" y="0" width="1" height="1" fill="url(#pvGradBB)" />

              <path
                d="
                  M0 0 H1
                  M0 0.5 H1
                  M0 1 H1

                  M0 0 V1
                  M0.25 0 V1
                  M0.5 0 V1
                  M0.75 0 V1
                  M1 0 V1
                "
                stroke="#222733"
                strokeWidth={0.006}
              />

              <polygon
                points="-0.2,0 0.35,0 1,1 0.45,1"
                fill="rgba(255,255,255,0.07)"
              />
            </pattern>
          </defs>

          {/* Surface panneau */}
          <polygon
            points={polygonPoints}
            fill={validated ? "url(#pvPatternBlack)" : "rgba(255,141,30,0.15)"}
            stroke={validated ? "none" : "#FF8D1E"}
            strokeWidth={validated ? 0 : 3}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={validated ? undefined : "8 6"}
            opacity={validated ? 1 : 0.9}
          />

          {/* Points de contrôle */}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={p.cx}
              cy={p.cy}
              r={7}
              onPointerDown={(evt) => handleCornerPointerDown(evt, p.id)}
              className={
                locked
                  ? "cursor-default"
                  : "cursor-grab active:cursor-grabbing"
              }
              fill="#FF8D1E"
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default RoofPlanner;
