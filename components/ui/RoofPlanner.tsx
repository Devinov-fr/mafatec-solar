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
  onClose?: () => void;
}

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

const PANEL_WIDTH = 90;
const PANEL_HEIGHT = 160;
const GAP = 4;

type BlockTranslateDragState = {
  blockId: number;
  startPointerX: number;
  startPointerY: number;
  panelsSnapshot: { id: number; x: number; y: number }[];
};

type BlockRotationDragState = {
  blockId: number;
  startRotation: number;
  startAngle: number;
};

type Ghost = { id: string; x: number; y: number; blockId: number };

const RoofPlanner: React.FC<RoofPlannerProps> = ({
  panels,
  onPanelsChange,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(
    () => panels[0]?.imageUrl ?? null
  );

  const [selectedPanelId, setSelectedPanelId] = useState<number | null>(null);
  const [targetCount, setTargetCount] = useState<string>("");
  const [validated, setValidated] = useState(false);

  // drag d'un BLOC (translation)
  const [blockTranslateState, setBlockTranslateState] =
    useState<BlockTranslateDragState | null>(null);

  // rotation par bloc : blockId → angle
  const [blockRotations, setBlockRotations] = useState<Record<number, number>>(
    {}
  );
  const [blockRotationState, setBlockRotationState] =
    useState<BlockRotationDragState | null>(null);

  // mode "nouveau bloc"
  const [pendingNewBlock, setPendingNewBlock] = useState<boolean>(true);

  const getSvgCoords = (
    evt:
      | ReactPointerEvent<
          SVGSVGElement | SVGRectElement | SVGCircleElement | SVGGElement
        >
      | PointerEvent
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

  const maxPanels =
    targetCount.trim() === "" ? undefined : Number.parseInt(targetCount, 10);

  const canAddMore =
    maxPanels === undefined || !Number.isFinite(maxPanels)
      ? true
      : panels.length < maxPanels;

  const getBlockId = (panel: Panel): number => {
    // @ts-ignore
    return typeof panel.blockId === "number" ? panel.blockId : 0;
  };

  const getBlockRotation = (blockId: number): number =>
    blockRotations[blockId] ?? 0;

  const setBlockRotation = (blockId: number, angle: number) => {
    setBlockRotations((prev) => ({ ...prev, [blockId]: angle }));
  };

  const createPanelAt = (x: number, y: number, blockId: number): Panel => {
    const topLeftX = clamp(x - PANEL_WIDTH / 2, 0, 1024 - PANEL_WIDTH);
    const topLeftY = clamp(y - PANEL_HEIGHT / 2, 0, 730 - PANEL_HEIGHT);

    const newPanel: Panel = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      x: topLeftX,
      y: topLeftY,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      imageUrl,
      // @ts-ignore
      blockId,
      // @ts-ignore
      corners: [],
    };

    return newPanel;
  };

  const updatePanels = (updater: (p: Panel) => Panel) => {
    onPanelsChange(panels.map(updater));
  };

  // ---------- création NOUVEAU BLOC (clic sur fond) ----------
  const handleSvgPointerDown = (evt: ReactPointerEvent<SVGSVGElement>) => {
    if (!canAddMore) return;
    if (!pendingNewBlock) return; // on ne crée un bloc que si demandé

    const { x, y } = getSvgCoords(evt.nativeEvent);

    const newBlockId = Date.now() + Math.floor(Math.random() * 1000);

    const newPanel = createPanelAt(x, y, newBlockId);

    onPanelsChange([...panels, newPanel]);
    setSelectedPanelId(newPanel.id);
    setPendingNewBlock(false);
  };

  // ---------- drag d'un BLOC (déplacement) ----------
  const handlePanelPointerDown = (
    panelId: number,
    evt: ReactPointerEvent<SVGRectElement>
  ) => {
    evt.stopPropagation();
    setSelectedPanelId(panelId);

    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return;

    const blockId = getBlockId(panel);
    const blockPanels = panels.filter((p) => getBlockId(p) === blockId);
    if (!blockPanels.length) return;

    const { x, y } = getSvgCoords(evt.nativeEvent);

    const snapshot = blockPanels.map((bp) => ({
      id: bp.id as number,
      x: bp.x,
      y: bp.y,
    }));

    setBlockTranslateState({
      blockId,
      startPointerX: x,
      startPointerY: y,
      panelsSnapshot: snapshot,
    });

    setBlockRotationState(null); // pas de rotation en même temps
  };

  // ---------- rotation d’un BLOC complet : début ----------
  const handleBlockRotationHandleDown = (
    evt: ReactPointerEvent<SVGCircleElement>,
    blockId: number,
    blockCx: number,
    blockCy: number
  ) => {
    evt.stopPropagation();
    const blockPanels = panels.filter((p) => getBlockId(p) === blockId);
    if (!blockPanels.length) return;

    const { x, y } = getSvgCoords(evt.nativeEvent);
    const angle = Math.atan2(y - blockCy, x - blockCx); // radians

    const currentRotation = getBlockRotation(blockId);

    setBlockRotationState({
      blockId,
      startRotation: currentRotation,
      startAngle: angle,
    });

    setBlockTranslateState(null); // on ne translate pas pendant la rotation
  };

  // ---------- mouvement : rotation bloc OU déplacement bloc ----------
  const handleSvgPointerMove = (evt: ReactPointerEvent<SVGSVGElement>) => {
    // rotation d’un bloc
    if (blockRotationState) {
      const { blockId, startRotation, startAngle } = blockRotationState;
      const blockPanels = panels.filter((p) => getBlockId(p) === blockId);
      if (!blockPanels.length) return;

      const { cx: blockCx, cy: blockCy } =
        computeBlockBoundsForPanels(blockPanels);

      const { x, y } = getSvgCoords(evt.nativeEvent);
      const currentAngle = Math.atan2(y - blockCy, x - blockCx);
      const deltaRad = currentAngle - startAngle;
      const deltaDeg = (deltaRad * 180) / Math.PI;

      let newRotation = startRotation + deltaDeg;
      newRotation = ((newRotation % 360) + 360) % 360;

      setBlockRotation(blockId, newRotation);
      return;
    }

    // translation d’un bloc
    if (blockTranslateState) {
      const { blockId, startPointerX, startPointerY, panelsSnapshot } =
        blockTranslateState;

      const { x, y } = getSvgCoords(evt.nativeEvent);
      const dx = x - startPointerX;
      const dy = y - startPointerY;

      const snapshotById = new Map(
        panelsSnapshot.map((s) => [s.id, s])
      );

      updatePanels((p) => {
        const bid = getBlockId(p);
        if (bid !== blockId) return p;

        const snap = snapshotById.get(p.id as number);
        if (!snap) return p;

        return {
          ...p,
          x: snap.x + dx,
          y: snap.y + dy,
        };
      });
    }
  };

  const stopInteractions = () => {
    setBlockTranslateState(null);
    setBlockRotationState(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    if (panels.length > 0) {
      const updated = panels.map((p) => ({ ...p, imageUrl: url }));
      onPanelsChange(updated);
    }
  };

  const handleValidateClick = () => {
    setValidated(true);
    onClose && onClose();
  };

  const mainButtonLabel = validated
    ? "Calepinage validé"
    : "Valider le calepinage";

  const selectedPanel =
    panels.find((p) => p.id === selectedPanelId) || panels[0];

  // ---------- GHOSTS (voisins) pour le bloc du panneau sélectionné ----------
  let ghosts: Ghost[] = [];
  if (selectedPanel && canAddMore) {
    const selectedBlockId = getBlockId(selectedPanel);

    const existingKeys = new Set(
      panels
        .filter((p) => getBlockId(p) === selectedBlockId)
        .map((p) => `${Math.round(p.x)}-${Math.round(p.y)}`)
    );

    const candidates: Ghost[] = [
      {
        id: "top",
        x: selectedPanel.x,
        y: selectedPanel.y - PANEL_HEIGHT - GAP,
        blockId: selectedBlockId,
      },
      {
        id: "bottom",
        x: selectedPanel.x,
        y: selectedPanel.y + PANEL_HEIGHT + GAP,
        blockId: selectedBlockId,
      },
      {
        id: "left",
        x: selectedPanel.x - PANEL_WIDTH - GAP,
        y: selectedPanel.y,
        blockId: selectedBlockId,
      },
      {
        id: "right",
        x: selectedPanel.x + PANEL_WIDTH + GAP,
        y: selectedPanel.y,
        blockId: selectedBlockId,
      },
    ];

    ghosts = candidates
      .map((g) => ({
        ...g,
        x: clamp(g.x, 0, 1024 - PANEL_WIDTH),
        y: clamp(g.y, 0, 730 - PANEL_HEIGHT),
      }))
      .filter((g) => {
        const key = `${Math.round(g.x)}-${Math.round(g.y)}`;
        return !existingKeys.has(key);
      });
  }

  const handleGhostClick = (
    x: number,
    y: number,
    evt: ReactPointerEvent<SVGRectElement>,
    blockId: number
  ) => {
    evt.stopPropagation();
    if (!canAddMore || !selectedPanel) return;

    const newPanel: Panel = {
      ...selectedPanel,
      id: Date.now() + Math.floor(Math.random() * 1000),
      x,
      y,
      // @ts-ignore
      blockId,
    };

    onPanelsChange([...panels, newPanel]);
    setSelectedPanelId(newPanel.id);
  };

  // ---------- BOUNDS pour un set de panneaux ----------
  function computeBlockBoundsForPanels(blockPanels: Panel[]) {
    if (blockPanels.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, cx: 0, cy: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of blockPanels) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.width);
      maxY = Math.max(maxY, p.y + p.height);
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return { minX, minY, maxX, maxY, cx, cy };
  }

  // Liste des IDs de blocs existants
  const blockIds = Array.from(
    new Set(panels.map((p) => getBlockId(p)))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="pr-4">
          <h2 className="text-lg font-semibold text-[#0f427c]">
            Calepinage – blocs de panneaux
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Créez plusieurs blocs (ex :{" "}
            <span className="font-semibold">6 + 6</span>), puis{" "}
            <span className="font-semibold">
              déplacez et faites pivoter chaque bloc
            </span>{" "}
            avec le curseur.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-1 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        )}
      </div>

      {/* Top controls */}
      <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Nombre de panneaux
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f427c]"
              placeholder="Ex : 12"
            />
            <span className="text-[11px] text-slate-500">
              (optionnel – limite la pose)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setPendingNewBlock(true);
              setSelectedPanelId(null);
            }}
            className="inline-flex items-center mt-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-[12px] text-slate-700 hover:border-[#0f427c] hover:text-[#0f427c]"
          >
            Nouveau bloc de panneaux
          </button>
          {pendingNewBlock && (
            <p className="text-[11px] text-emerald-600 mt-1">
              Cliquez sur la toiture pour placer le 1er panneau du bloc.
            </p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Photo de toiture
          </p>
          <p className="text-xs text-slate-500">
            Formats : JPG ou PNG, vue de la toiture.
          </p>
          {imageUrl && (
            <p className="mt-1 text-[11px] text-[#008f31] font-semibold">
              Photo importée ✔
            </p>
          )}

          <label className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer">
            Importer une photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      {/* Image + calepinage */}
      <div
        className="relative w-full rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-100"
        style={{ aspectRatio: "4 / 3" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1024 730"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full select-none touch-none cursor-crosshair"
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={stopInteractions}
          onPointerLeave={stopInteractions}
        >
          {/* image de fond */}
          <image
            href={imageUrl || "/toit-maison.jpg"}
            x="0"
            y="0"
            width="1024"
            height="730"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* pattern panneaux */}
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

          {/* un <g> par BLOC */}
          {(() => {
            const blockIds = Array.from(
              new Set(panels.map((p) => getBlockId(p)))
            );

            return blockIds.map((blockId) => {
              const blockPanels = panels.filter(
                (p) => getBlockId(p) === blockId
              );
              if (!blockPanels.length) return null;

              const bounds = computeBlockBoundsForPanels(blockPanels);
              const rotation = getBlockRotation(blockId);

              const blockGhosts = ghosts.filter(
                (g) => g.blockId === blockId
              );

              const handleOffset = 24;
              const handleRadius = 7;
              const handleCx = bounds.cx;
              const handleCy = bounds.minY - handleOffset;

              return (
                <g
                  key={blockId}
                  transform={`rotate(${rotation} ${bounds.cx} ${bounds.cy})`}
                >
                  {/* panneaux du bloc */}
                  {blockPanels.map((panel) => {
                    const isSelected =
                      selectedPanelId !== null &&
                      selectedPanelId === panel.id;

                    return (
                      <rect
                        key={panel.id}
                        x={panel.x}
                        y={panel.y}
                        width={panel.width}
                        height={panel.height}
                        fill="url(#pvPatternBlack)"
                        stroke={isSelected ? "#f97316" : "#181a1f"}
                        strokeWidth={isSelected ? 3 : 2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        onPointerDown={(evt) =>
                          handlePanelPointerDown(panel.id, evt)
                        }
                      />
                    );
                  })}

                  {/* ghosts pour ce bloc */}
                  {blockGhosts.map((g) => (
                    <rect
                      key={g.id}
                      x={g.x}
                      y={g.y}
                      width={PANEL_WIDTH}
                      height={PANEL_HEIGHT}
                      fill="rgba(52,79,149,0.15)"
                      stroke="#344d95"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      onPointerDown={(evt) =>
                        handleGhostClick(g.x, g.y, evt, g.blockId)
                      }
                    />
                  ))}

                  {/* poignée de rotation du bloc */}
                  <line
                    x1={bounds.cx}
                    y1={bounds.minY}
                    x2={handleCx}
                    y2={handleCy}
                    stroke="rgba(249,115,22,0.7)"
                    strokeWidth={1.8}
                  />
                  <circle
                    cx={handleCx}
                    cy={handleCy}
                    r={handleRadius}
                    fill="#ffffff"
                    stroke="#f97316"
                    strokeWidth={2}
                    onPointerDown={(evt) =>
                      handleBlockRotationHandleDown(
                        evt,
                        blockId,
                        bounds.cx,
                        bounds.cy
                      )
                    }
                    style={{ cursor: "grab" }}
                  />
                </g>
              );
            });
          })()}
        </svg>
      </div>

      {/* Bottom buttons */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {panels.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onPanelsChange([]);
              setSelectedPanelId(null);
              setValidated(false);
              setBlockTranslateState(null);
              setBlockRotations({});
              setBlockRotationState(null);
              setPendingNewBlock(true);
            }}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-[12px] text-slate-700 hover:border-[#0f427c] hover:text-[#0f427c]"
          >
            Réinitialiser le calepinage
          </button>
        )}

        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={handleValidateClick}
            className={`px-4 py-2 text-sm rounded-lg shadow-sm border text-white ${
              validated
                ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
                : "bg-[#344d95] hover:bg-[#d32f2f] border-[#344d95]"
            }`}
          >
            {mainButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoofPlanner;
