import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Terminal,
  FileCode2,
  Key,
  Instagram,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Flag,
  History
} from 'lucide-react';
import { GraphicStudio } from './components/GraphicStudio';
import { CmsQueue } from './components/CmsQueue';
import { PublisherRunner } from './components/PublisherRunner';
import { CodeExplorer } from './components/CodeExplorer';
import { SetupGuide } from './components/SetupGuide';
import { PostItem } from './types';
import {
  getInitialPosts,
  loadPersistentPosts,
  savePostsPersistent,
  deletePostPersistent,
  fetchCloudPosts,
  syncPostToCloud
} from './utils/postStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'queue' | 'publisher' | 'code' | 'setup'>('studio');
  const [selectedPublishPostId, setSelectedPublishPostId] = useState<number | null>(null);

  // Synchronously initialize posts from localStorage for instant, zero-flicker render
  const [posts, setPosts] = useState<PostItem[]>(getInitialPosts);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // 1. On Mount: Load full high-res data from IndexedDB and sync from Supabase Cloud
  useEffect(() => {
    let isMounted = true;

    // Load from IndexedDB (restores ultra-res images without localStorage quota limits)
    loadPersistentPosts().then((persistent) => {
      if (isMounted && persistent && persistent.length > 0) {
        setPosts((current) => {
          // Merge keeping any newly scheduled posts
          const map = new Map<number, PostItem>();
          persistent.forEach((p) => map.set(p.id, p));
          current.forEach((c) => {
            if (!map.has(c.id)) {
              map.set(c.id, c);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.post_timestamp - a.post_timestamp);
        });
      }
    });

    // Check Supabase Cloud via /api/posts for cross-device history
    fetchCloudPosts().then((cloudPosts) => {
      if (isMounted && cloudPosts && cloudPosts.length > 0) {
        setPosts((prev) => {
          const map = new Map<number, PostItem>();
          prev.forEach((p) => map.set(p.id, p));
          cloudPosts.forEach((cp) => {
            // Avoid duplicate by title or id
            const exists = Array.from(map.values()).some(
              (x) => x.title === cp.title || (cp.cloud_id && x.cloud_id === cp.cloud_id)
            );
            if (!exists) {
              map.set(cp.id, cp);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.post_timestamp - a.post_timestamp);
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Persist to localStorage & IndexedDB whenever posts state changes
  useEffect(() => {
    savePostsPersistent(posts);
  }, [posts]);

  // Handle scheduling / saving a new graphic to history & queue
  const handleSchedulePost = (newPostData: Omit<PostItem, 'id' | 'status'>) => {
    const newId = posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1;
    const newPost: PostItem = {
      ...newPostData,
      id: newId,
      status: 'Scheduled',
      created_at: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);

    // Sync to Supabase in background
    setIsCloudSynced(false);
    syncPostToCloud(newPost).then((res) => {
      setIsCloudSynced(true);
      if (res.success && res.publicUrl) {
        setPosts((prev) =>
          prev.map((p) => (p.id === newId ? { ...p, image_public_url: res.publicUrl } : p))
        );
      }
    });
  };

  const handleCompletePost = (postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, status: 'Posted', image_path: `published/${p.image_path.split('/').pop()}` }
          : p
      )
    );
  };

  const handleDeletePost = (postId: number) => {
    const target = posts.find((p) => p.id === postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    deletePostPersistent(postId);

    if (target?.cloud_id) {
      fetch(`/api/posts?id=${target.cloud_id}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const scheduledCount = posts.filter((p) => p.status === 'Scheduled').length;
  const postedCount = posts.filter((p) => p.status === 'Posted').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black shadow-md shadow-red-600/30 tracking-tighter text-sm">
              F1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">FORMULA 1 BD</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/80">
                  Creator Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400">@formula1.bd • Supabase Cloud • Meta Graph API v21.0</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Post History: <strong className="text-white">{posts.length}</strong> saved
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Vercel + Supabase Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300">
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>@formula1.bd</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar space-x-1 border-t border-slate-800/60 pt-1 pb-1">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-red-950/60 text-red-300 border border-red-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Layers className="w-4 h-4 text-red-400" />
            <span>F1 BD Graphic Studio (1:1 & 4:5)</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'queue'
                ? 'bg-red-950/60 text-red-300 border border-red-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400" />
            <span>Queue & Post History</span>
            <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
              {posts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('publisher')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'publisher'
                ? 'bg-red-950/60 text-red-300 border border-red-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Graph API Publisher Daemon</span>
            {scheduledCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono border border-amber-500/30">
                {scheduledCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-red-950/60 text-red-300 border border-red-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-purple-400" />
            <span>Codebase Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'setup'
                ? 'bg-red-950/60 text-red-300 border border-red-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Supabase & Meta API Setup</span>
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'studio' && (
          <GraphicStudio
            onSchedulePost={handleSchedulePost}
          />
        )}

        {activeTab === 'queue' && (
          <CmsQueue
            posts={posts}
            onTriggerPublish={(post) => {
              setSelectedPublishPostId(post.id);
              setActiveTab('publisher');
            }}
            onDeletePost={handleDeletePost}
          />
        )}

        {activeTab === 'publisher' && (
          <PublisherRunner
            scheduledPosts={posts.filter((p) => p.status === 'Scheduled')}
            onCompletePost={handleCompletePost}
            initialPostId={selectedPublishPostId}
          />
        )}

        {activeTab === 'code' && <CodeExplorer />}

        {activeTab === 'setup' && <SetupGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Formula 1 BD Creator CMS</span>
            <span>—</span>
            <span>High-definition graphics & automated Instagram publisher for @formula1.bd</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>app.py</span>
            <span>•</span>
            <span>graphics.py</span>
            <span>•</span>
            <span>database.py</span>
            <span>•</span>
            <span>publisher.py</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
