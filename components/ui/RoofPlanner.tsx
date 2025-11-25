"use client";

import React, { useRef, useState, MouseEvent } from "react";
import type { Panel } from "@/components/ui/PrintComponentTwo"; // 🔹 on réutilise le même type

const PANEL_WIDTH = 30;  // largeur panneau en px
const PANEL_HEIGHT = 50; // hauteur panneau en px

interface RoofPlannerProps {
  panels: Panel[];
  onPanelsChange: (panels: Panel[]) => void;
}

const RoofPlanner: React.FC<RoofPlannerProps> = ({ panels, onPanelsChange }) => {
  const [isPlacing, setIsPlacing] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 🔹 Ajouter un panneau : on clique sur le bouton, puis on clique sur le toit
  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPlacing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = clickX - PANEL_WIDTH / 2;
    const y = clickY - PANEL_HEIGHT / 2;

    onPanelsChange([
      ...panels,
      {
        id: Date.now(),
        x,
        y,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
      },
    ]);

    setIsPlacing(false);
  };

  // 🔹 Lancement du drag sur un panneau
  const handlePanelMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number
  ) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const panel = panels.find((p) => p.id === id);
    if (!panel) return;

    dragOffsetRef.current = {
      x: mouseX - panel.x,
      y: mouseY - panel.y,
    };

    setDraggingId(id);
  };

  // 🔹 Déplacement pendant le drag
  const handleContainerMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (draggingId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x: offsetX, y: offsetY } = dragOffsetRef.current;

    let newX = mouseX - offsetX;
    let newY = mouseY - offsetY;

    // Empêche de sortir complètement du toit
    const maxX = rect.width - PANEL_WIDTH;
    const maxY = rect.height - PANEL_HEIGHT;

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX > maxX) newX = maxX;
    if (newY > maxY) newY = maxY;

    onPanelsChange(
      panels.map((p) =>
        p.id === draggingId ? { ...p, x: newX, y: newY } : p
      )
    );
  };

  // 🔹 Fin du drag
  const stopDragging = () => {
    setDraggingId(null);
  };

  // 🔹 Supprimer un panneau
  const removePanel = (id: number) => {
    onPanelsChange(panels.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0f427c]">
            Positionnement des panneaux sur le toit
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cliquez sur <span className="font-semibold">« Ajouter un panneau »</span>,{" "}
            puis cliquez sur le toit pour le placer. Vous pouvez ensuite le déplacer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPlacing(true)}
          className="px-3 py-2 text-sm rounded-lg bg-[#008f31] text-white hover:bg-[#007326] shadow-md"
        >
          + Ajouter un panneau
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100 cursor-crosshair"
        style={{ aspectRatio: "14 / 10" }}
        onClick={handleContainerClick}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {/* Image du toit */}
        <img
          src="/toit-maison.jpg"
          alt="Toit de la maison"
          className="w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Info mode placement */}
        {isPlacing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 text-xs text-slate-700 px-3 py-1 rounded-full shadow">
            Cliquez sur le toit pour placer le panneau
          </div>
        )}

        {/* Panneaux */}
        {panels.map((panel) => (
          <div
            key={panel.id}
            className="absolute cursor-grab active:cursor-grabbing group"
            style={{
              width: panel.width,
              height: panel.height,
              left: panel.x,
              top: panel.y,
            }}
            onMouseDown={(e) => handlePanelMouseDown(e, panel.id)}
          >
            {/* Panneau "full black" */}
            <div
              className="relative w-full h-full rounded-[3px] border border-black/70 shadow-[0_4px_10px_rgba(0,0,0,0.8)] overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, #020308 0%, #050910 40%, #020308 100%)",
              }}
            >
              {/* Grille */}
              <div
                className="absolute inset-[1px] rounded-[2px]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px)," +
                    "linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "4px 4px",
                  backgroundColor: "#020308",
                  opacity: 0.7,
                }}
              />
              {/* Reflet */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.2) 30%, transparent 55%)",
                  mixBlendMode: "screen",
                }}
              />
              {/* Ombres */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 10% 0%, rgba(0,0,0,0.7) 0, transparent 40%)," +
                    "radial-gradient(circle at 90% 100%, rgba(0,0,0,0.9) 0, transparent 60%)",
                  opacity: 0.9,
                }}
              />
            </div>

            {/* Label flottant */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-[10px] px-2 py-0.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition">
              Panneau #{panel.id}
            </div>

            {/* Bouton supprimer */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removePanel(panel.id);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-[11px] rounded-full bg-white text-red-500 shadow opacity-0 group-hover:opacity-100 transition"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoofPlanner;
