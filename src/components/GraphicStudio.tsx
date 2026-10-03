import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Calendar,
  Clock,
  Download,
  Send,
  Sliders,
  RotateCcw,
  Eye,
  CheckCircle,
  AlertCircle,
  FileText,
  Type,
  Maximize2,
  Sparkles,
  Layers,
  Check,
  Trash2,
  ZoomIn,
  Move,
  RotateCw,
  Image as ImageIcon,
  Cloud,
  Flame,
  LayoutGrid,
  X,
  FileUp
} from 'lucide-react';
import { PostItem } from '../types';

interface GraphicStudioProps {
  onSchedulePost: (post: Omit<PostItem, 'id' | 'status'>) => void;
}

const F1_DEFAULT_BOUNDS_SQUARE = {
  boxX: 60,
  boxY: 880,
  maxWidth: 960,
  maxHeight: 180,
  initialFontSize: 52,
  tracking: -50,
  lineSpacing: 10,
};

const F1_DEFAULT_BOUNDS_PORTRAIT = {
  boxX: 60,
  boxY: 1120,
  maxWidth: 960,
  maxHeight: 200,
  initialFontSize: 50,
  tracking: -50,
  lineSpacing: 10,
};

const DEFAULT_TRANSFORMS = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
  rotation: 0,
};

export const GraphicStudio: React.FC<GraphicStudioProps> = ({
  onSchedulePost,
}) => {
  // Logo & Aspect Ratio Configuration
  const [f1LogoVersion, setF1LogoVersion] = useState<'white_transparent' | 'black_transparent' | 'white_solid'>('white_transparent');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5'>('1:1');
  const [f1LogoPos, setF1LogoPos] = useState<'center' | 'left' | 'right'>('center');
  const [f1LogoWidth, setF1LogoWidth] = useState<number>(330);
  const [f1LogoY, setF1LogoY] = useState<number>(65);
  const [enableScrim, setEnableScrim] = useState<boolean>(true);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);

  // Form fields
  const [headlineText, setHeadlineText] = useState('FIRST BANGLADESHI ORIGIN RACER DEBUTS');
  const [caption, setCaption] = useState(
    "Historic moment for Bangladesh motorsports as Formula 1 driver debuts on the international circuit.\n\nRead our comprehensive breakdown in bio.\n\n#formula1bd #f1 #motorsport #bangladesh #racing"
  );
  const [scheduleDate, setScheduleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('14:30');

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string>('/sample_f1_post.jpg');
  const [photoFileName, setPhotoFileName] = useState<string>('sample_f1_post.jpg');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);

  // Photo Transforms: Zoom, Pan X, Pan Y, Rotation
  const [transforms, setTransforms] = useState(DEFAULT_TRANSFORMS);

  // Bounding Box & Typography customization
  const [bounds, setBounds] = useState(F1_DEFAULT_BOUNDS_SQUARE);

  // Collapsible Visual Adjusters Drawer
  const [showVisualAdjusters, setShowVisualAdjusters] = useState(false);

  // Status & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch Aspect Ratio
  const handleSelectAspectRatio = (ratio: '1:1' | '4:5') => {
    setAspectRatio(ratio);
    if (ratio === '1:1') {
      setBounds(F1_DEFAULT_BOUNDS_SQUARE);
    } else {
      setBounds(F1_DEFAULT_BOUNDS_PORTRAIT);
    }
  };

  // Process File Object (from FileInput, Drag & Drop, or Clipboard Paste)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, WEBP, AVIF)');
      return;
    }
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
        showToast(`Loaded ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Photo File Upload Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Global Clipboard Paste Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            showToast('Pasted image from clipboard');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Resolve overlay logo URL
  const effectiveTemplateUrl =
    f1LogoVersion === 'black_transparent'
      ? '/logos/f1bd_black_transparent_tight.png'
      : f1LogoVersion === 'white_solid'
      ? '/logos/f1bd_white_solid.png'
      : '/logos/f1bd_white_transparent_tight.png';

  // Dynamic canvas dimensions
  const canvasWidth = 1080;
  const canvasHeight = aspectRatio === '1:1' ? 1080 : 1350;

  // Render Canvas with High-Definition Composite Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let isCancelled = false;
    let photoLoaded = false;
    let logoLoaded = false;

    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';

    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    const drawPipeline = () => {
      if (isCancelled || !photoLoaded || !logoLoaded) return;

      const cW = canvasWidth;
      const cH = canvasHeight;
      const imgW = photoImg.naturalWidth || photoImg.width;
      const imgH = photoImg.naturalHeight || photoImg.height;

      // Enable high-quality bicubic image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear previous frame with dark matte background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cW, cH);

      // =====================================================================
      // LAYER 1: Draw user photo with high-quality smoothing & transforms
      // =====================================================================
      const baseScale = Math.max(cW / Math.max(1, imgW), cH / Math.max(1, imgH));
      const effectiveScale = baseScale * transforms.zoom;
      const renderW = imgW * effectiveScale;
      const renderH = imgH * effectiveScale;

      ctx.save();
      if (transforms.rotation !== 0) {
        ctx.translate(cW / 2 + transforms.panX, cH / 2 + transforms.panY);
        ctx.rotate((transforms.rotation * Math.PI) / 180);
        ctx.drawImage(photoImg, -renderW / 2, -renderH / 2, renderW, renderH);
      } else {
        const offsetX = (cW - renderW) / 2 + transforms.panX;
        const offsetY = (cH - renderH) / 2 + transforms.panY;
        ctx.drawImage(photoImg, offsetX, offsetY, renderW, renderH);
      }
      ctx.restore();

      // =====================================================================
      // LAYER 1b: Dynamic Contrast Scrim
      // =====================================================================
      if (enableScrim) {
        // Top scrim for logo watermark contrast
        const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, cW, 160);

        // Bottom scrim for headline text legibility
        const scrimStartY = Math.max(0, bounds.boxY - 70);
        const botGrad = ctx.createLinearGradient(0, scrimStartY, 0, cH);
        botGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
        botGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
        botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, scrimStartY, cW, cH - scrimStartY);
      }

      // =====================================================================
      // LAYER 2: Formula 1 BD Watermark Logo (High Quality Resampling)
      // =====================================================================
      const lw = f1LogoWidth;
      const aspect = (logoImg.naturalHeight || logoImg.height) / (logoImg.naturalWidth || logoImg.width || 1);
      const lh = lw * aspect;

      let lx = (cW - lw) / 2;
      if (f1LogoPos === 'left') lx = bounds.boxX;
      if (f1LogoPos === 'right') lx = cW - lw - bounds.boxX;

      const ly = f1LogoY;
      ctx.drawImage(logoImg, lx, ly, lw, lh);

      // =====================================================================
      // LAYER 3: Headline Text in Roboto Black & Photoshop -50 tracking
      // =====================================================================
      if (headlineText && headlineText.trim()) {
        const words = headlineText.trim().toUpperCase().split(/\s+/);
        let fontSize = bounds.initialFontSize;
        const minFontSize = 18;
        let wrappedLines: string[] = [];
        let finalSpacingOffset = (bounds.tracking / 1000) * fontSize;

        // Auto-decrement loop to fit text within bounding dimensions
        while (fontSize >= minFontSize) {
          ctx.font = `900 ${fontSize}px "Roboto Black", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif`;
          const spacingOffset = (bounds.tracking / 1000) * fontSize;
          finalSpacingOffset = spacingOffset;

          wrappedLines = [];
          let currentWords: string[] = [];

          const measureTrackedWidth = (lineStr: string) => {
            let w = 0;
            for (let i = 0; i < lineStr.length; i++) {
              w += ctx.measureText(lineStr[i]).width;
              if (i < lineStr.length - 1) {
                w += spacingOffset;
              }
            }
            return w;
          };

          for (const word of words) {
            const testLine = currentWords.length > 0 ? `${currentWords.join(' ')} ${word}` : word;
            const lineW = measureTrackedWidth(testLine);
            if (lineW <= bounds.maxWidth || currentWords.length === 0) {
              currentWords.push(word);
            } else {
              wrappedLines.push(currentWords.join(' '));
              currentWords = [word];
            }
          }
          if (currentWords.length > 0) {
            wrappedLines.push(currentWords.join(' '));
          }

          const approxLineH = fontSize * 1.05;
          const totalTextH = wrappedLines.length * approxLineH + (wrappedLines.length - 1) * bounds.lineSpacing;

          if (totalTextH <= bounds.maxHeight) {
            break;
          }
          fontSize -= 2;
        }

        // Draw the text lines strictly left-aligned with drop shadow
        let curY = bounds.boxY;
        const lineH = fontSize * 1.05;

        wrappedLines.forEach((line) => {
          let cursorX = bounds.boxX;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const charW = ctx.measureText(char).width;

            // Subtle drop shadow for legibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.90)';
            ctx.fillText(char, cursorX + 2, curY + 2);

            // Crisp headline text in Roboto Black
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(char, cursorX, curY);

            cursorX += charW + finalSpacingOffset;
          }

          curY += lineH + bounds.lineSpacing;
        });
      }
    };

    photoImg.onload = () => {
      if (isCancelled) return;
      photoLoaded = true;
      drawPipeline();
    };

    photoImg.onerror = () => {
      if (isCancelled) return;
    };

    logoImg.onload = () => {
      if (isCancelled) return;
      logoLoaded = true;
      drawPipeline();
    };

    logoImg.onerror = () => {
      if (isCancelled) return;
      logoLoaded = false;
    };

    photoImg.src = photoUrl;
    logoImg.src = effectiveTemplateUrl;

    return () => {
      isCancelled = true;
    };
  }, [photoUrl, effectiveTemplateUrl, headlineText, bounds, transforms, f1LogoPos, f1LogoWidth, f1LogoY, enableScrim, canvasWidth, canvasHeight]);

  // Handle Export JPG (Maximum 98% Fidelity + Auto-Save to Post History)
  const handleExportJpg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const link = document.createElement('a');
      link.download = `formula1bd_${Date.now()}_${canvasWidth}x${canvasHeight}.jpg`;
      link.href = dataUrl;
      link.click();

      // Automatically preserve generated graphic in post history
      if (headlineText.trim()) {
        const targetDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
        const epoch = Math.floor(targetDate.getTime() / 1000);
        onSchedulePost({
          title: headlineText.trim().toUpperCase(),
          image_path: `ready/f1bd_${epoch}_${Date.now()}.jpg`,
          caption: caption.trim(),
          post_timestamp: epoch,
          imageDataUrl: dataUrl,
          previewUrl: photoUrl
        });
        showToast(`Downloaded JPEG and saved to Post History!`);
      } else {
        showToast(`Downloaded ultra-crisp ${canvasWidth}×${canvasHeight} JPEG!`);
      }
    } catch {
      showToast('Direct download blocked by cross-origin. Use Save to Queue & History.');
    }
  };

  // Handle Schedule Post to Local Queue & History
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headlineText.trim()) {
      showToast('Please enter a headline');
      return;
    }

    const canvas = canvasRef.current;
    let imageDataUrl: string | undefined = undefined;
    if (canvas) {
      try {
        imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } catch {
        imageDataUrl = undefined;
      }
    }

    const targetDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
    const epoch = Math.floor(targetDate.getTime() / 1000);

    onSchedulePost({
      title: headlineText.trim().toUpperCase(),
      image_path: `ready/f1bd_${epoch}_${Date.now()}.jpg`,
      caption: caption.trim(),
      post_timestamp: epoch,
      imageDataUrl: imageDataUrl,
      previewUrl: photoUrl
    });

    setScheduledSuccess(true);
    showToast('Graphic saved to Queue & Post History!');
    setTimeout(() => setScheduledSuccess(false), 4000);
  };

  // Handle Direct Supabase Cloud Sync
  const handlePushToSupabase = async () => {
    if (!headlineText.trim()) {
      showToast('Please enter a headline');
      return;
    }
    setIsSyncingSupabase(true);
    try {
      const targetDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const canvas = canvasRef.current;
      const dataUrl = canvas ? canvas.toDataURL('image/jpeg', 0.95) : photoUrl;

      // Always save locally to queue & history first
      const epoch = Math.floor(targetDate.getTime() / 1000);
      onSchedulePost({
        title: headlineText.trim().toUpperCase(),
        image_path: `ready/f1bd_${epoch}_${Date.now()}.jpg`,
        caption: caption.trim(),
        post_timestamp: epoch,
        imageDataUrl: dataUrl,
        previewUrl: photoUrl
      });

      // Then sync to Vercel Serverless Function & Supabase
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: headlineText.trim().toUpperCase(),
          caption: caption.trim(),
          imageDataUrl: dataUrl,
          scheduled_at: targetDate.toISOString(),
          status: 'scheduled',
          target_platforms: ['instagram']
        })
      });

      if (!res.ok) {
        showToast("Saved to Post History! (Local & IndexedDB active)");
      } else {
        showToast("☁️ Synced to Supabase Cloud & Post History!");
      }
    } catch (err: any) {
      showToast(`Saved to Post History! (${err?.message || 'Local active'})`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  return (
    <div id="graphic-studio-container" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg shadow-2xl animate-fade-in text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Full-Resolution Modal Inspector */}
      {showInspectModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-auto">
          <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Full 100% True Resolution Inspector ({canvasWidth}×{canvasHeight})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center overflow-auto max-h-[75vh] p-2 bg-slate-950 rounded-xl border border-slate-800/80">
              <img
                src={canvasRef.current ? canvasRef.current.toDataURL('image/png') : photoUrl}
                alt="Full resolution inspector"
                className="max-w-none shadow-2xl rounded"
                style={{
                  width: `${Math.min(canvasWidth, 900)}px`,
                  imageRendering: 'auto'
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Lossless 1080px Master Pipeline • Roboto Black Typography</span>
              <button
                type="button"
                onClick={handleExportJpg}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Ultra-Res JPEG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Formula 1 BD Studio</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-red-500/10 border-red-500/30 text-red-400">
              🏎️ @formula1.bd
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ultra-Res Canvas • Drag & Drop Imagery • Transparent Logos • Track Contrast Scrim
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            {canvasWidth}×{canvasHeight} ({aspectRatio})
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
            Supabase: Live
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Form */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-5">
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            {/* Formula 1 BD Customization Card */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  Formula 1 BD Logo & Template Options
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">formula1.bd relaunch</span>
              </div>

              {/* Transparent Logo Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Transparent Logo Version:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setF1LogoVersion('white_transparent')}
                    className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-between text-center gap-1.5 transition ${
                      f1LogoVersion === 'white_transparent'
                        ? 'bg-slate-800 border-red-500 shadow-md ring-1 ring-red-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full h-8 bg-slate-900 rounded flex items-center justify-center px-1">
                      <img src="/logos/f1bd_white_transparent_tight.png" alt="White Logo" className="max-h-6 object-contain" />
                    </div>
                    <span className="text-[10px] font-bold text-white">White (Transparent)</span>
                    <span className="text-[9px] text-slate-400">For dark / track photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setF1LogoVersion('black_transparent')}
                    className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-between text-center gap-1.5 transition ${
                      f1LogoVersion === 'black_transparent'
                        ? 'bg-slate-800 border-red-500 shadow-md ring-1 ring-red-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full h-8 bg-slate-200 rounded flex items-center justify-center px-1">
                      <img src="/logos/f1bd_black_transparent_tight.png" alt="Black Logo" className="max-h-6 object-contain" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-900">Black (Transparent)</span>
                    <span className="text-[9px] text-slate-400">For bright daylight photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setF1LogoVersion('white_solid')}
                    className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-between text-center gap-1.5 transition ${
                      f1LogoVersion === 'white_solid'
                        ? 'bg-slate-800 border-red-500 shadow-md ring-1 ring-red-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full h-8 bg-white rounded flex items-center justify-center px-1">
                      <img src="/logos/f1bd_white_solid.png" alt="Solid Logo" className="max-h-6 object-contain" />
                    </div>
                    <span className="text-[10px] font-bold text-white">Solid White Box</span>
                    <span className="text-[9px] text-slate-400">Framed badge emblem</span>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Canvas Aspect Ratio:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAspectRatio('1:1')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      aspectRatio === '1:1'
                        ? 'bg-red-500/20 border-red-500 text-red-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>1:1 Square (1080×1080)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAspectRatio('4:5')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      aspectRatio === '4:5'
                        ? 'bg-red-500/20 border-red-500 text-red-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>4:5 Portrait (1080×1350)</span>
                  </button>
                </div>
              </div>

              {/* Logo Placement & Scaling */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Logo Placement
                  </label>
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                    {(['center', 'left', 'right'] as const).map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setF1LogoPos(pos)}
                        className={`flex-1 py-1 text-[11px] font-medium capitalize rounded transition ${
                          f1LogoPos === pos ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Logo Width</span>
                    <span className="font-mono text-slate-400">{f1LogoWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={550}
                    step={10}
                    value={f1LogoWidth}
                    onChange={(e) => setF1LogoWidth(parseInt(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Scrim Gradient Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-300 font-medium">Dynamic Contrast Scrim:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableScrim}
                    onChange={(e) => setEnableScrim(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            {/* Section 1: Headline & Imagery with Drag & Drop */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                1. Headline & Imagery
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Headline (Renders on Graphic & Saves to Database)
                </label>
                <textarea
                  value={headlineText}
                  onChange={(e) => setHeadlineText(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 text-sm text-white font-medium focus:outline-none focus:border-red-500 transition-colors resize-none uppercase"
                  placeholder="Enter headline text..."
                  required
                />
              </div>

              {/* Enhanced Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Background Photo</span>
                  <span className="text-[10px] text-slate-400 font-normal">Supports Drag & Drop or Ctrl+V</span>
                </label>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-red-500 bg-red-950/30 scale-[1.01] shadow-lg shadow-red-500/20'
                      : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/60'
                  }`}
                >
                  <label className="cursor-pointer block space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-red-400">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        Drag and drop image here, or click to browse
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        PNG, JPG, WEBP • Max quality preserved
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-slate-800/80 text-[11px] font-mono text-slate-300 border border-slate-700 truncate max-w-[220px]">
                        {photoFileName}
                      </span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instagram Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  placeholder="Enter caption and hashtags..."
                />
              </div>
            </div>

            {/* Master Toggle Button for Visual Adjusters */}
            <div className="space-y-3">
              <button
                type="button"
                id="btn-toggle-visual-adjusters"
                onClick={() => setShowVisualAdjusters(!showVisualAdjusters)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.98] shadow-md border cursor-pointer ${
                  showVisualAdjusters
                    ? 'bg-slate-800 text-slate-100 border-slate-600'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>{showVisualAdjusters ? 'Hide Photo & Font Controls' : 'Fine-Tune Framing & Typography'}</span>
              </button>

              {/* Collapsible Panel */}
              {showVisualAdjusters && (
                <div id="visual-adjusters-container" className="space-y-4 pt-1 animate-fade-in">
                  {/* Photo Transforms */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                        Photo Framing (Zoom, Pan, Rotate)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setTransforms(DEFAULT_TRANSFORMS)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Zoom Multiplier</span>
                          <span className="font-mono text-slate-300">{transforms.zoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min={1.0}
                          max={3.0}
                          step={0.05}
                          value={transforms.zoom}
                          onChange={(e) => setTransforms({ ...transforms, zoom: parseFloat(e.target.value) || 1.0 })}
                          className="w-full accent-red-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Pan X</span>
                            <span className="font-mono text-slate-300">{transforms.panX}px</span>
                          </div>
                          <input
                            type="range"
                            min={-500}
                            max={500}
                            step={5}
                            value={transforms.panX}
                            onChange={(e) => setTransforms({ ...transforms, panX: parseInt(e.target.value) || 0 })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Pan Y</span>
                            <span className="font-mono text-slate-300">{transforms.panY}px</span>
                          </div>
                          <input
                            type="range"
                            min={-500}
                            max={500}
                            step={5}
                            value={transforms.panY}
                            onChange={(e) => setTransforms({ ...transforms, panY: parseInt(e.target.value) || 0 })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Rotation</span>
                          <span className="font-mono text-slate-300">{transforms.rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          step={1}
                          value={transforms.rotation}
                          onChange={(e) => setTransforms({ ...transforms, rotation: parseInt(e.target.value) || 0 })}
                          className="w-full accent-red-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Typography Coordinates */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-purple-400" />
                        Headline Typography & Coordinates
                      </h3>
                      <button
                        type="button"
                        onClick={() => setBounds(aspectRatio === '1:1' ? F1_DEFAULT_BOUNDS_SQUARE : F1_DEFAULT_BOUNDS_PORTRAIT)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Base Font Size</span>
                          <span className="font-mono text-slate-300">{bounds.initialFontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={24}
                          max={70}
                          step={1}
                          value={bounds.initialFontSize}
                          onChange={(e) => setBounds({ ...bounds, initialFontSize: parseInt(e.target.value) || 50 })}
                          className="w-full accent-red-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Start X (Left Margin)</span>
                            <span className="font-mono text-slate-300">{bounds.boxX}px</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={300}
                            step={5}
                            value={bounds.boxX}
                            onChange={(e) => setBounds({ ...bounds, boxX: parseInt(e.target.value) || 60 })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Start Y (Top Margin)</span>
                            <span className="font-mono text-slate-300">{bounds.boxY}px</span>
                          </div>
                          <input
                            type="range"
                            min={600}
                            max={canvasHeight - 100}
                            step={5}
                            value={bounds.boxY}
                            onChange={(e) => setBounds({ ...bounds, boxY: parseInt(e.target.value) || 880 })}
                            className="w-full accent-red-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Publishing Schedule */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                2. Publication Schedule
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Target Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions: Save Queue & Cloud Sync */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  id="btn-schedule-post"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save to Queue & History</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushToSupabase}
                  disabled={isSyncingSupabase}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isSyncingSupabase ? 'Syncing...' : 'Sync to Supabase'}</span>
                </button>
              </div>

              {scheduledSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Post successfully added to schedule!</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Canvas Preview with Drag & Drop & Full-Res Inspect */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  WYSIWYG Feed Preview ({canvasWidth}×{canvasHeight})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInspectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700 shadow-sm"
                  title="View full 100% pixel scale without scaling"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Full Res Inspect</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJpg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download JPEG</span>
                </button>
              </div>
            </div>

            {/* Canvas Display with Direct Drag & Drop Support */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner group transition-all ${
                aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[1080/1350]'
              } ${isDragging ? 'ring-4 ring-red-500/80 border-red-500' : ''}`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{
                  imageRendering: 'auto',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              />

              {/* Dragging Overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white border-2 border-dashed border-red-400 animate-pulse pointer-events-none">
                  <Upload className="w-12 h-12 text-red-400" />
                  <span className="font-bold text-sm tracking-wide">Drop Motorsport Photo to Load</span>
                </div>
              )}

              {/* Resolution badge */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/75 backdrop-blur text-[10px] font-mono text-slate-300 border border-white/10 pointer-events-none">
                {canvasWidth} × {canvasHeight} ({aspectRatio})
              </div>

              {/* Active Logo Variant Indicator */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/75 backdrop-blur text-[10px] font-mono text-emerald-300 border border-emerald-500/20 pointer-events-none flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                <span>
                  {f1LogoVersion === 'black_transparent' ? 'Black (Transparent)' : (f1LogoVersion === 'white_solid' ? 'Solid White' : 'White (Transparent)')}
                </span>
              </div>
            </div>

            {/* Metadata strip */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Active Brand Pipeline:</span>
                <span className="font-mono text-red-400 font-bold">
                  Formula 1 BD (@formula1.bd)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Logo Watermark:</span>
                <span className="font-mono text-emerald-400">
                  {f1LogoVersion} @ {f1LogoWidth}px ({f1LogoPos})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Direct Drag & Drop:</span>
                <span className="font-mono text-sky-400">Active (Drop on canvas or paste with Ctrl+V)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
