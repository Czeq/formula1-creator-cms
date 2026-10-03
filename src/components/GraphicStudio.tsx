import React, { useState, useRef, useEffect } from 'react';
import defaultTemplateOverlayUrl from '../balshitemplate.png';
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
  LayoutGrid
} from 'lucide-react';
import { PostItem } from '../types';

interface GraphicStudioProps {
  onSchedulePost: (post: Omit<PostItem, 'id' | 'status'>) => void;
  templateOverlayUrl?: string;
  templateError?: string | null;
}

const DEFAULT_BOUNDS = {
  boxX: 60,
  boxY: 1190,
  maxWidth: 1040,
  maxHeight: 240,
  initialFontSize: 45,
  tracking: -50,
  lineSpacing: 12,
};

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
  templateOverlayUrl,
  templateError: externalTemplateError,
}) => {
  // Brand Mode & Formula 1 BD Customizations
  const [brandMode, setBrandMode] = useState<'formula1' | 'balshi'>('formula1');
  const [f1LogoVersion, setF1LogoVersion] = useState<'white_transparent' | 'black_transparent' | 'white_solid'>('white_transparent');
  const [f1AspectRatio, setF1AspectRatio] = useState<'1:1' | '4:5' | 'balshi_4:5'>('1:1');
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

  // Photo Transforms: Zoom, Pan X, Pan Y, Rotation
  const [transforms, setTransforms] = useState(DEFAULT_TRANSFORMS);

  // Bounding Box & Typography customization
  const [bounds, setBounds] = useState(F1_DEFAULT_BOUNDS_SQUARE);
  const [showBoundingBoxGuide, setShowBoundingBoxGuide] = useState(false);

  // Master Collapsible Visual Adjusters Drawer
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

  // Switch Brand Presets
  const handleSelectBrand = (mode: 'formula1' | 'balshi') => {
    setBrandMode(mode);
    if (mode === 'formula1') {
      setHeadlineText('FIRST BANGLADESHI ORIGIN RACER DEBUTS');
      setPhotoUrl('/sample_f1_post.jpg');
      setPhotoFileName('sample_f1_post.jpg');
      setBounds(f1AspectRatio === '1:1' ? F1_DEFAULT_BOUNDS_SQUARE : F1_DEFAULT_BOUNDS_PORTRAIT);
      showToast('Switched to Formula 1 BD preset');
    } else {
      setHeadlineText('MARKETS SURGE AS TECH LEADERS RATIFY HISTORIC PROTOCOL ACCORD');
      setPhotoUrl('https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop');
      setPhotoFileName('market_floor.jpg');
      setBounds(DEFAULT_BOUNDS);
      showToast('Switched to Balshi Breaking preset');
    }
  };

  // Switch Aspect Ratio
  const handleSelectAspectRatio = (ratio: '1:1' | '4:5' | 'balshi_4:5') => {
    setF1AspectRatio(ratio);
    if (brandMode === 'formula1') {
      if (ratio === '1:1') {
        setBounds(F1_DEFAULT_BOUNDS_SQUARE);
      } else {
        setBounds(F1_DEFAULT_BOUNDS_PORTRAIT);
      }
    }
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          showToast(`Uploaded ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Internal template error state
  const [internalTemplateError, setInternalTemplateError] = useState<string | null>(null);
  const effectiveTemplateError = externalTemplateError || internalTemplateError;

  // Resolve overlay URL
  const effectiveTemplateUrl = brandMode === 'formula1'
    ? (f1LogoVersion === 'black_transparent'
        ? '/logos/f1bd_black_transparent_tight.png'
        : (f1LogoVersion === 'white_solid'
            ? '/logos/f1bd_white_solid.png'
            : '/logos/f1bd_white_transparent_tight.png'))
    : (templateOverlayUrl || defaultTemplateOverlayUrl || '/balshitemplate.png');

  // Dynamic canvas dimensions
  const canvasWidth = brandMode === 'formula1'
    ? (f1AspectRatio === '1:1' ? 1080 : (f1AspectRatio === '4:5' ? 1080 : 1170))
    : 1170;
  const canvasHeight = brandMode === 'formula1'
    ? (f1AspectRatio === '1:1' ? 1080 : (f1AspectRatio === '4:5' ? 1350 : 1463))
    : 1463;

  // Render Canvas with Strict Composite Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let isCancelled = false;
    let photoLoaded = false;
    let templateLoaded = false;

    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';

    const templateImg = new Image();
    templateImg.crossOrigin = 'anonymous';

    const drawPipeline = () => {
      if (isCancelled || !photoLoaded || !templateLoaded) return;

      const cW = canvasWidth;
      const cH = canvasHeight;
      const imgW = photoImg.naturalWidth || photoImg.width;
      const imgH = photoImg.naturalHeight || photoImg.height;

      // Clear previous frame
      ctx.clearRect(0, 0, cW, cH);

      // =====================================================================
      // LAYER 1: Draw the uploaded user photo (scaled to cover, applying pan, zoom, rotation)
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
      // LAYER 1b: Dynamic Contrast Scrim (For Formula 1 BD)
      // =====================================================================
      if (brandMode === 'formula1' && enableScrim) {
        // Top scrim for logo contrast
        const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, cW, 160);

        // Bottom scrim for headline legibility
        const scrimStartY = Math.max(0, bounds.boxY - 70);
        const botGrad = ctx.createLinearGradient(0, scrimStartY, 0, cH);
        botGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
        botGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
        botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, scrimStartY, cW, cH - scrimStartY);
      }

      // =====================================================================
      // LAYER 2: Overlay / Logo Selection
      // =====================================================================
      if (brandMode === 'formula1') {
        const lw = f1LogoWidth;
        const aspect = (templateImg.naturalHeight || templateImg.height) / (templateImg.naturalWidth || templateImg.width || 1);
        const lh = lw * aspect;

        let lx = (cW - lw) / 2;
        if (f1LogoPos === 'left') lx = bounds.boxX;
        if (f1LogoPos === 'right') lx = cW - lw - bounds.boxX;

        const ly = f1LogoY;
        ctx.drawImage(templateImg, lx, ly, lw, lh);
      } else {
        // Balshi authentic master template overlay
        ctx.drawImage(templateImg, 0, 0, cW, cH);
      }

      // =====================================================================
      // LAYER 3: Render Headline Text with Roboto Black & Photoshop -50 tracking
      // =====================================================================
      if (headlineText && headlineText.trim()) {
        const words = headlineText.trim().split(/\s+/);
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

          const lineH = fontSize * 1.12;
          const totalHeight = (wrappedLines.length * lineH) + Math.max(0, wrappedLines.length - 1) * bounds.lineSpacing;

          if (totalHeight <= bounds.maxHeight) {
            break;
          }
          fontSize -= 1;
        }

        ctx.font = `900 ${fontSize}px "Roboto Black", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif`;
        const lineH = fontSize * 1.12;
        let curY = bounds.boxY;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        wrappedLines.forEach((line) => {
          let cursorX = bounds.boxX;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const charW = ctx.measureText(char).width;

            // Subtle drop shadow for legibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
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

    templateImg.onload = () => {
      if (isCancelled) return;
      templateLoaded = true;
      setInternalTemplateError(null);
      drawPipeline();
    };

    templateImg.onerror = () => {
      if (isCancelled) return;
      templateLoaded = false;
      setInternalTemplateError("Error: Failed to load overlay asset");
    };

    photoImg.src = photoUrl;
    templateImg.src = effectiveTemplateUrl;

    return () => {
      isCancelled = true;
    };
  }, [photoUrl, effectiveTemplateUrl, headlineText, bounds, transforms, brandMode, f1LogoPos, f1LogoWidth, f1LogoY, enableScrim, canvasWidth, canvasHeight]);

  // Handle Export JPG
  const handleExportJpg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `${brandMode === 'formula1' ? 'formula1bd' : 'balshi'}_${Date.now()}_${canvasWidth}x${canvasHeight}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast(`Downloaded high-res ${canvasWidth}×${canvasHeight} JPEG!`);
    } catch {
      showToast('Direct download blocked by cross-origin. Use Schedule Post.');
    }
  };

  // Handle Schedule Post to Local Queue
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
        imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      } catch {
        imageDataUrl = undefined;
      }
    }

    const targetDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
    const epoch = Math.floor(targetDate.getTime() / 1000);

    onSchedulePost({
      title: headlineText.trim(),
      image_path: `ready/${brandMode}_${epoch}_${Date.now()}.jpg`,
      caption: caption.trim(),
      post_timestamp: epoch,
      imageDataUrl: imageDataUrl,
      previewUrl: photoUrl
    });

    setScheduledSuccess(true);
    showToast('Post scheduled successfully into SQLite queue!');
    setTimeout(() => setScheduledSuccess(false), 4000);
  };

  // Handle Direct Supabase Cloud Sync
  const handlePushToSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const targetDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
      const canvas = canvasRef.current;
      const dataUrl = canvas ? canvas.toDataURL('image/jpeg', 0.9) : photoUrl;

      const res = await fetch("https://bnhbebhffosechglrlhf.supabase.co/rest/v1/posts", {
        method: "POST",
        headers: {
          "apikey": "sb_publishable_JhM4SPWE04fbv2jMVNjD0A_RebSTPKe",
          "Authorization": "Bearer sb_publishable_JhM4SPWE04fbv2jMVNjD0A_RebSTPKe",
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          title: headlineText.trim(),
          caption: caption.trim(),
          image_storage_path: `f1bd_${Date.now()}.jpg`,
          image_public_url: dataUrl.length < 500 ? dataUrl : 'f1bd_local_preview.jpg',
          scheduled_at: targetDate.toISOString(),
          status: 'scheduled',
          target_platforms: ['instagram']
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      showToast("☁️ Post synced directly to Supabase cloud database!");
    } catch (err: any) {
      showToast(`Supabase Sync: ${err?.message || err}`);
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

      {/* Top Banner with Brand Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Creator Graphics Studio</h1>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
              brandMode === 'formula1'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {brandMode === 'formula1' ? '🏎️ FORMULA 1 BD' : '📰 BALSHI BREAKING'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {brandMode === 'formula1'
              ? 'Multi-Version Transparent Logo Overlay • 1:1 & 4:5 Formats • Track Contrast Scrim'
              : 'Strict 3-Layer Pipeline • balshitemplate.png Overlay • Left-Aligned Roboto Black'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            {canvasWidth}×{canvasHeight} ({brandMode === 'formula1' ? (f1AspectRatio === '1:1' ? '1:1' : '4:5') : '4:5'})
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
            Supabase: Live
          </div>
        </div>
      </div>

      {/* Brand Selection Toggle */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleSelectBrand('formula1')}
          className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            brandMode === 'formula1'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/25 ring-1 ring-red-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>Formula 1 BD Studio</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectBrand('balshi')}
          className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            brandMode === 'balshi'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-300" />
          <span>Balshi Studio</span>
        </button>
      </div>

      {/* Error Banner */}
      {effectiveTemplateError && (
        <div id="template-error-banner" className="p-4 rounded-xl bg-red-950/90 border-2 border-red-500 text-red-200 flex items-center gap-3 text-sm font-bold shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{effectiveTemplateError}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Form */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-5">
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            {/* Formula 1 BD Customization Card */}
            {brandMode === 'formula1' && (
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
                      <span className="text-[10px] font-bold text-white">Black (Transparent)</span>
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
                        f1AspectRatio === '1:1'
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
                        f1AspectRatio === '4:5'
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
            )}

            {/* Section 1: Headline & Imagery */}
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
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 text-sm text-white font-medium focus:outline-none focus:border-red-500 transition-colors resize-none"
                  placeholder="Enter headline text..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Background Photo
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Choose Photo File...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                    {photoFileName}
                  </span>
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
                          className="w-full accent-emerald-400 cursor-pointer"
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
                            className="w-full accent-emerald-400 cursor-pointer"
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
                            className="w-full accent-emerald-400 cursor-pointer"
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
                          className="w-full accent-emerald-400 cursor-pointer"
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
                        onClick={() => setBounds(brandMode === 'formula1' ? (f1AspectRatio === '1:1' ? F1_DEFAULT_BOUNDS_SQUARE : F1_DEFAULT_BOUNDS_PORTRAIT) : DEFAULT_BOUNDS)}
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
                          onChange={(e) => setBounds({ ...bounds, initialFontSize: parseInt(e.target.value) || 45 })}
                          className="w-full accent-emerald-400 cursor-pointer"
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
                            className="w-full accent-emerald-400 cursor-pointer"
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
                            className="w-full accent-emerald-400 cursor-pointer"
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
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Target Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions: Save Local & Cloud Sync */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  id="btn-schedule-post"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save to Queue</span>
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

        {/* RIGHT COLUMN: Live Canvas Preview */}
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
                  onClick={handleExportJpg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download JPEG</span>
                </button>
              </div>
            </div>

            {/* Canvas Display */}
            <div className={`relative w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner group ${
              canvasWidth === canvasHeight ? 'aspect-square' : 'aspect-[1080/1350]'
            }`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />

              {/* Resolution badge */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-slate-300 border border-white/10 pointer-events-none">
                {canvasWidth} × {canvasHeight} ({canvasWidth === canvasHeight ? '1:1' : '4:5'})
              </div>

              {/* Active Logo Variant Indicator */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-emerald-300 border border-emerald-500/20 pointer-events-none flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                <span>
                  {brandMode === 'formula1'
                    ? (f1LogoVersion === 'black_transparent' ? 'Black (Transparent)' : (f1LogoVersion === 'white_solid' ? 'Solid White' : 'White (Transparent)'))
                    : 'balshitemplate.png'}
                </span>
              </div>
            </div>

            {/* Metadata strip */}
            <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Active Brand Pipeline:</span>
                <span className="font-mono text-slate-300 font-bold">
                  {brandMode === 'formula1' ? 'Formula 1 BD (formula1.bd relaunch)' : 'Balshi Breaking'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Logo Watermark:</span>
                <span className="font-mono text-emerald-400">
                  {brandMode === 'formula1' ? `${f1LogoVersion} @ ${f1LogoWidth}px (${f1LogoPos})` : 'balshitemplate.png (alpha mask)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Supabase Cloud Integration:</span>
                <span className="font-mono text-sky-400">https://bnhbebhffosechglrlhf.supabase.co</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
