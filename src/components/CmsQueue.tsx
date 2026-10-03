import React, { useState } from 'react';
import {
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  ExternalLink,
  Download,
  Copy,
  Check,
  Maximize2,
  X,
  FileJson,
  Upload,
  Sparkles,
  Layers
} from 'lucide-react';
import { PostItem } from '../types';

interface CmsQueueProps {
  posts: PostItem[];
  onTriggerPublish: (post: PostItem) => void;
  onDeletePost: (id: number) => void;
  onClearAll?: () => void;
  onNavigateToStudio?: () => void;
}

export const CmsQueue: React.FC<CmsQueueProps> = ({
  posts,
  onTriggerPublish,
  onDeletePost,
  onClearAll,
  onNavigateToStudio,
}) => {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'posted'>('all');
  const [inspectedPost, setInspectedPost] = useState<PostItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const currentEpoch = Math.floor(Date.now() / 1000);
  const scheduledPosts = posts.filter((p) => p.status === 'Scheduled');
  const postedRecords = posts.filter((p) => p.status === 'Posted');

  const filteredPosts =
    filter === 'scheduled'
      ? scheduledPosts
      : filter === 'posted'
      ? postedRecords
      : posts;

  const formatTimestamp = (ts: number): string => {
    try {
      const d = new Date(ts * 1000);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(ts);
    }
  };

  const getRelativeTime = (ts: number): string => {
    const diff = ts - currentEpoch;
    if (diff <= 0) {
      return 'DUE NOW (Ready for daemon pickup)';
    }
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `Due in ${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `Due in ${hours}h ${remMins}m`;
  };

  const handleCopyCaption = (post: PostItem) => {
    navigator.clipboard.writeText(post.caption);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = (post: PostItem) => {
    const src = post.imageDataUrl || post.image_public_url || post.previewUrl;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `formula1bd_${post.id}_${Date.now()}.jpg`;
    a.click();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(posts, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `formula1bd_post_history_backup_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Full-Resolution Image Inspector Modal */}
      {inspectedPost && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-auto">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-red-400">POST #{inspectedPost.id}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {inspectedPost.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedPost(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center max-h-[70vh] overflow-hidden bg-slate-950 rounded-xl border border-slate-800/80 p-2">
              <img
                src={inspectedPost.imageDataUrl || inspectedPost.image_public_url || inspectedPost.previewUrl || ''}
                alt={inspectedPost.title}
                className="max-h-[65vh] w-auto object-contain rounded shadow-2xl"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap">
              {inspectedPost.caption}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Target: {formatTimestamp(inspectedPost.post_timestamp)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCaption(inspectedPost)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5"
                >
                  {copiedId === inspectedPost.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === inspectedPost.id ? 'Copied!' : 'Copy Caption'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadImage(inspectedPost)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ultra-Res</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
            Total Post History
          </span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">
            {posts.length}
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Saved on Vercel & Cloud
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-amber-400 font-medium uppercase tracking-wider block">
            Scheduled Queue
          </span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {scheduledPosts.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting publisher cycle</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider block">
            Historical Posted
          </span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">
            {postedRecords.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">status == 'Posted'</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
            Persistence Engine
          </span>
          <span className="text-sm font-mono font-bold text-sky-400 mt-2 block">
            IndexedDB + Supabase
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">100% Retained on Reload</span>
        </div>
      </div>

      {/* Filter and Backup Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-red-950/70 text-red-300 border border-red-800'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            All History ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'scheduled'
                ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            Scheduled Queue ({scheduledPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('posted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'posted'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            Posted Archive ({postedRecords.length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {posts.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 transition border border-rose-800/60"
              title="Clear all saved posts from history"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear History</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/80"
            title="Download full post history backup JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-sky-400" />
            <span>Export History JSON</span>
          </button>
        </div>
      </div>

      {/* Main Post History Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-slate-100">
              {filter === 'scheduled'
                ? 'Scheduled Posts Queue'
                : filter === 'posted'
                ? 'Historical Posted Archive'
                : 'Complete Post History & Queue'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {filteredPosts.length} items recorded
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 mx-auto flex items-center justify-center text-slate-400 shadow-inner">
              <Sparkles className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No Post History Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                You haven't created any graphics yet. Go to the Graphic Studio, compose your image with headlines and hashtags, and click <strong className="text-red-400">"Save to Queue & History"</strong> to save your real posts here.
              </p>
            </div>
            {onNavigateToStudio && (
              <button
                type="button"
                onClick={onNavigateToStudio}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg transition duration-200 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Open Graphic Studio</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-800/80">
            {filteredPosts.map((post) => {
              const isDue = post.post_timestamp <= currentEpoch && post.status === 'Scheduled';
              const imageSrc = post.imageDataUrl || post.image_public_url || post.previewUrl;

              return (
                <div
                  key={post.id}
                  className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:bg-slate-850/40 px-2 rounded-xl transition"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Thumbnail with full inspect trigger */}
                    <div
                      className="relative w-20 h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0 cursor-pointer group/img"
                      onClick={() => setInspectedPost(post)}
                      title="Click to view full resolution"
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
                          NO IMG
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          #{post.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100 truncate">
                          {post.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            post.status === 'Posted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isDue
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {post.status === 'Posted'
                            ? 'POSTED'
                            : isDue
                            ? 'DUE NOW'
                            : getRelativeTime(post.post_timestamp)}
                        </span>
                        {post.image_public_url && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                            Cloud Synced
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap line-clamp-2 max-w-3xl">
                        {post.caption}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>Target: {formatTimestamp(post.post_timestamp)}</span>
                        <span>•</span>
                        <span>Staged: {post.image_path}</span>
                        {post.created_at && (
                          <>
                            <span>•</span>
                            <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this post */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(post)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                      title="Copy caption and hashtags to clipboard"
                    >
                      {copiedId === post.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Caption</span>
                        </>
                      )}
                    </button>

                    {imageSrc && (
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(post)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition border border-slate-700"
                        title="Download high-resolution image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {post.status === 'Scheduled' && (
                      <button
                        type="button"
                        onClick={() => onTriggerPublish(post)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
