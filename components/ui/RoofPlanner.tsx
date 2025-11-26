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

const RoofPlanner: React.FC<RoofPlannerProps> = ({ onPanelsChange }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [points, setPoints] = useState<CornerPoint[]>(INITIAL_POINTS);
  const [draggingId, setDraggingId] = useState<CornerId | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [validated, setValidated] = useState(false);
  const [locked, setLocked] = useState(false);

  // clientX/Y -> coords SVG
  const getSvgCoords = (
    evt: ReactPointerEvent<SVGSVGElement> | PointerEvent
  ) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  };

  // ordre des points pour le polygone affiché
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

  // pointer down sur un coin
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

  // pointer move global
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

  // ✅ Validation : on fixe le panneau + on stocke aussi les 4 coins dans corners
  const handleValidate = () => {
    setValidated(true);
    setLocked(true);

    const xs = points.map((p) => p.cx);
    const ys = points.map((p) => p.cy);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // on re-ordonne les points comme pour polygonPoints
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
      corners, // 🔥 les coins exacts, utilisés dans le PDF
    };

    onPanelsChange([newPanel]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0f427c]">
            Calepinage – sélection des panneaux
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Déplacez les <span className="font-semibold">4 points</span> sur les
            coins du champ photovoltaïque, puis cliquez sur{" "}
            <span className="font-semibold">« Valider les panneaux »</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleValidate}
          disabled={validated}
          className={`px-3 py-2 text-sm rounded-lg shadow-md ${
            validated
              ? "bg-slate-300 text-slate-600 cursor-default"
              : "bg-[#008f31] text-white hover:bg-[#007326]"
          }`}
        >
          {validated ? "Panneaux validés ✅" : "Valider les panneaux"}
        </button>
      </div>

      <div
        className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100"
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
          <image
            href="/toit-maison.jpg"
            x="0"
            y="0"
            width="1024"
            height="730"
            preserveAspectRatio="xMidYMid slice"
          />

          <defs>
            <pattern
              id="pvPatternBlack"
              patternUnits="userSpaceOnUse"
              width="90"
              height="60"
            >
              <rect width="90" height="60" fill="#020307" />
              <linearGradient
                id="pvGradBlack"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#18191f" stopOpacity={1} />
                <stop offset="40%" stopColor="#07080c" stopOpacity={1} />
                <stop offset="100%" stopColor="#000000" stopOpacity={1} />
              </linearGradient>
              <rect width="90" height="60" fill="url(#pvGradBlack)" />
              <path
                d="
                  M0 0 H90
                  M0 20 H90
                  M0 40 H90
                  M0 60 H90

                  M0 0 V60
                  M22.5 0 V60
                  M45 0 V60
                  M67.5 0 V60
                  M90 0 V60
                "
                stroke="#33373f"
                strokeWidth={0.8}
                opacity={0.75}
              />
              <rect
                x={1.5}
                y={1.5}
                width={87}
                height={57}
                fill="none"
                stroke="#14161b"
                strokeWidth={2}
                opacity={0.9}
              />
              <polygon
                points="-10,0 40,0 95,60 45,60"
                fill="rgba(255,255,255,0.04)"
              />
            </pattern>
          </defs>

          {/* cadre externe (visible après validation) */}
          <polygon
            points={polygonPoints}
            className={
              validated
                ? "opacity-100 transition-opacity duration-200"
                : "opacity-0 transition-opacity duration-200"
            }
            fill="none"
            stroke="#050608"
            strokeWidth={5}
            strokeLinejoin="round"
          />

          {/* surface panneau */}
          <polygon
            points={polygonPoints}
            fill={validated ? "url(#pvPatternBlack)" : "rgba(255,141,30,0.15)"}
            stroke={validated ? "#181a1f" : "#FF8D1E"}
            strokeWidth={validated ? 2.2 : 3}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={validated ? undefined : "8 6"}
            opacity={validated ? 1 : 0.9}
          />

          {/* points de contrôle */}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={p.cx}
              cy={p.cy}
              r={8}
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
