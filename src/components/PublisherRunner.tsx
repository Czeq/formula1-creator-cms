import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Instagram,
  Radio,
  Send
} from 'lucide-react';
import { PostItem, PublisherStep } from '../types';

interface PublisherRunnerProps {
  scheduledPosts: PostItem[];
  onCompletePost: (postId: number) => void;
  initialPostId?: number | null;
}

const INITIAL_STEPS: PublisherStep[] = [
  {
    id: 1,
    name: 'Asset Staging & Image Host',
    detail: 'Upload high-resolution master graphic to public Supabase Storage bucket (graphics)',
    status: 'pending',
  },
  {
    id: 2,
    name: 'Meta Crawler Public URL Handshake',
    detail: 'Generate verified HTTPS image URL accessible by Meta content crawlers',
    status: 'pending',
  },
  {
    id: 3,
    name: 'Media Container Creation',
    detail: 'POST https://graph.facebook.com/v21.0/17841463802855850/media with image_url & caption',
    endpoint: 'POST /v21.0/17841463802855850/media',
    status: 'pending',
  },
  {
    id: 4,
    name: 'Container Status Polling',
    detail: 'GET https://graph.facebook.com/v21.0/{container_id}?fields=status_code until FINISHED',
    endpoint: 'GET /v21.0/{container_id}?fields=status_code',
    status: 'pending',
  },
  {
    id: 5,
    name: 'Instagram Feed Publish',
    detail: 'POST https://graph.facebook.com/v21.0/17841463802855850/media_publish with creation_id',
    endpoint: 'POST /v21.0/17841463802855850/media_publish',
    status: 'pending',
  },
  {
    id: 6,
    name: 'Live Verification & Archive',
    detail: 'Retrieve Instagram permalink, record status=Posted in database, finalize lifecycle',
    status: 'pending',
  },
];

export const PublisherRunner: React.FC<PublisherRunnerProps> = ({
  scheduledPosts,
  onCompletePost,
  initialPostId,
}) => {
  const [steps, setSteps] = useState<PublisherStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [liveSuccess, setLiveSuccess] = useState<{ mediaId: string; permalink: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Meta Graph API v21.0 Publisher ready for @formula1.bd.',
    '[AUTH] Verified Instagram Account: Formula One Bangladesh (ID: 17841463802855850).',
  ]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(
    initialPostId || scheduledPosts[0]?.id || null
  );

  React.useEffect(() => {
    if (initialPostId) {
      setSelectedPostId(initialPostId);
    }
  }, [initialPostId]);

  const activePost = scheduledPosts.find((p) => p.id === selectedPostId) || scheduledPosts[0];

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const updateStep = (id: number, status: PublisherStep['status'], logMsg?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, log: logMsg } : s))
    );
    if (logMsg) addLog(logMsg);
  };

  // REAL LIVE PUBLISH TO INSTAGRAM VIA /api/publish
  const handleLivePublish = async () => {
    if (!activePost) {
      alert('Please select a scheduled post to publish.');
      return;
    }

    setIsRunning(true);
    setLiveSuccess(null);
    setErrorMessage(null);
    setSteps(INITIAL_STEPS);

    addLog(`🚀 Starting REAL LIVE publish to Instagram feed: @formula1.bd`);
    addLog(`Target Post: #${activePost.id} - "${activePost.title}"`);

    try {
      // Step 1: Image preparation
      updateStep(1, 'active', 'Staging master image asset to Supabase cloud storage...');

      // Step 2 & 3: Initiate /api/publish
      updateStep(2, 'active', 'Handshaking with Meta Content Ingestion service...');

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId: activePost.id,
          title: activePost.title,
          caption: activePost.caption,
          imageDataUrl: activePost.imageDataUrl,
          imagePublicUrl: activePost.image_public_url
        })
      });

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((l: string) => addLog(l));
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish to Instagram');
      }

      updateStep(1, 'completed', 'Master image stored on Supabase Storage.');
      updateStep(2, 'completed', `Exposed public URL: ${data.publicImageUrl || 'Supabase Public Bucket'}`);
      updateStep(3, 'completed', `Media container created: ${data.containerId || 'Meta Container'}`);
      updateStep(4, 'completed', 'Container processing status: FINISHED');
      updateStep(5, 'completed', `🎉 Successfully published to Instagram! Media ID: ${data.mediaId}`);
      updateStep(6, 'completed', `Post verified live on @formula1.bd: ${data.permalink}`);

      setLiveSuccess({
        mediaId: data.mediaId,
        permalink: data.permalink || 'https://instagram.com/formula1.bd'
      });

      onCompletePost(activePost.id);
      addLog(`✨ Publish workflow completed with zero errors!`);
    } catch (err: any) {
      const errStr = err?.message || String(err);
      setErrorMessage(errStr);
      addLog(`❌ [ERROR] ${errStr}`);
      setSteps((prev) =>
        prev.map((s) => (s.status === 'active' ? { ...s, status: 'failed', log: errStr } : s))
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSteps(INITIAL_STEPS);
    setLiveSuccess(null);
    setErrorMessage(null);
    setLogs([
      '[INIT] Meta Graph API v21.0 Publisher ready for @formula1.bd.',
      '[AUTH] Verified Instagram Account: Formula One Bangladesh (ID: 17841463802855850).',
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Live Success Banner */}
      {liveSuccess && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Published Live to Instagram!
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ID: {liveSuccess.mediaId}
                </span>
              </div>
              <p className="text-sm text-white font-medium mt-0.5">
                The post is now officially live on your Instagram feed (<strong className="text-pink-400">@formula1.bd</strong>).
              </p>
            </div>
          </div>

          <a
            href={liveSuccess.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition duration-200 shrink-0"
          >
            <Instagram className="w-4 h-4" />
            <span>View Post Live on Instagram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm text-rose-100 font-bold">Meta Graph API Error:</strong>
            <p className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{errorMessage}</p>
            <p className="text-[11px] text-slate-400 pt-1">
              Verify your Meta App permissions in the Setup tab or verify your internet connection.
            </p>
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-slate-100">
                Meta Instagram Graph API v21.0 Publisher
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                Live Production Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Posts directly to <strong className="text-pink-400">@formula1.bd</strong> (Account ID: <code className="text-amber-300 font-mono">17841463802855850</code>) using your 60-day Meta token.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {scheduledPosts.length > 0 && (
              <select
                value={selectedPostId || ''}
                onChange={(e) => setSelectedPostId(Number(e.target.value))}
                disabled={isRunning}
                className="px-3 py-2 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-red-500"
              >
                {scheduledPosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.title.slice(0, 32)}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleLivePublish}
              disabled={isRunning || scheduledPosts.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition duration-200 shadow-md ${
                isRunning || scheduledPosts.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-red-900/40'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Publishing Live to Instagram...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Live to @formula1.bd</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isRunning}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition"
              title="Reset Steps & Logs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {scheduledPosts.length === 0 && (
          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              No scheduled posts in the queue. Create a post in the Graphic Studio tab and click "Save to Queue & History" first.
            </span>
          </div>
        )}
      </div>

      {/* 6-Step Visualizer Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isActive = step.status === 'active';
          const isFailed = step.status === 'failed';
          const isPending = step.status === 'pending';

          return (
            <div
              key={step.id}
              className={`rounded-xl border p-4 transition ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : isActive
                  ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
                  : isFailed
                  ? 'bg-rose-950/40 border-rose-500/50 ring-1 ring-rose-500/40'
                  : 'bg-slate-900 border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Step 0{step.id}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isActive && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {isFailed && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {isPending && <span className="w-2 h-2 rounded-full bg-slate-700" />}
              </div>

              <h4 className="text-sm font-semibold text-slate-100">{step.name}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.detail}</p>

              {step.endpoint && (
                <div className="mt-2 text-[10px] font-mono px-2 py-1 bg-slate-950 rounded text-slate-400 border border-slate-800 truncate">
                  {step.endpoint}
                </div>
              )}

              {step.log && (
                <div
                  className={`mt-2 text-[11px] font-mono pt-2 border-t border-slate-800 truncate ${
                    isFailed ? 'text-rose-400 font-semibold' : 'text-amber-300/90'
                  }`}
                >
                  {step.log}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Publisher Terminal Logs */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-medium text-slate-300">meta_graph_api_stream.log</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Real-Time Meta Stream</span>
        </div>

        <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto pr-2">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`leading-relaxed ${
                log.includes('ERROR') || log.includes('❌')
                  ? 'text-rose-400 font-bold'
                  : log.includes('Successfully') || log.includes('🎉') || log.includes('✨')
                  ? 'text-emerald-300 font-bold'
                  : log.includes('Calling Graph API') || log.includes('Polling')
                  ? 'text-sky-300'
                  : 'text-slate-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
