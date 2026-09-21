"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Check, X, RotateCw } from "lucide-react";

interface AvatarCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export default function AvatarCropperModal({ imageSrc, onClose, onCropComplete }: AvatarCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Move to center
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(position.x, position.y);
    ctx.scale(zoom, zoom);

    // Calculate aspect fit/fill
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [zoom, rotation, position]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageSrc, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-res circular output canvas
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 400;
    outputCanvas.height = 400;
    const outCtx = outputCanvas.getContext("2d");
    if (!outCtx) return;

    // Draw from preview canvas scaled to 400x400
    outCtx.drawImage(canvas, 0, 0, 400, 400);

    const dataUrl = outputCanvas.toDataURL("image/jpeg", 0.92);
    onCropComplete(dataUrl);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-900">Sesuaikan Foto Profil</h3>
            <p className="text-xs text-slate-500">Geser atau perbesar foto agar posisinya pas di lingkaran</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Box */}
        <div 
          className="relative w-[280px] h-[280px] bg-slate-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center select-none shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* Canvas */}
          <canvas ref={canvasRef} className="w-full h-full pointer-events-none" />

          {/* Circular Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[230px] h-[230px] rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]" />
          </div>
        </div>

        {/* Zoom & Rotate Controls */}
        <div className="w-full space-y-3.5 mt-5">
          
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <button 
              type="button"
              onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.05"
              value={zoom} 
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#0868a9] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
            />
            <button 
              type="button"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 text-slate-600 hover:text-[#0868a9] hover:bg-white rounded-lg transition-colors ml-1 border-l border-slate-200 pl-2 cursor-pointer"
              title="Putar 90 Derajat"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="button" 
            onClick={handleCrop}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0868a9] hover:bg-[#084f86] shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Terapkan & Simpan Foto
          </button>
        </div>

      </div>
    </div>
  );
}
