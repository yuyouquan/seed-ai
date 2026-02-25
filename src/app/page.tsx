'use client';

import { useState, useEffect } from 'react';

interface HistoryItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  result?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ images?: string[]; id?: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/generate?action=history');
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (e) {
      console.error('Load history error:', e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const aspectRatios = [
    { id: '1:1', name: '1:1 (方形)' },
    { id: '16:9', name: '16:9 (横版)' },
    { id: '9:16', name: '9:16 (竖版)' },
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setProgress(20);
    setStatus('正在生成...');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'image',
          prompt, 
          aspect_ratio: aspectRatio,
        }),
      });

      const data = await res.json();
      console.log('Generate response:', data);

      if (data.error) {
        setError(data.error);
        setStatus('生成失败');
        setGenerating(false);
        loadHistory();
        return;
      }

      setProgress(100);
      setStatus('完成！');
      setResult({ images: data.images, id: data.id });
      setGenerating(false);
      loadHistory();

    } catch (e) {
      setError('请求失败: ' + String(e));
      setStatus('生成失败');
      setGenerating(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">🎨 SeedAI</h1>
          <button 
            onClick={() => { loadHistory(); setShowHistory(!showHistory); }}
            className="text-sm text-purple-300 hover:text-white"
          >
            📜 历史 ({history.length})
          </button>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-lg overflow-y-auto z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">历史记录</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-500">✕</button>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>🎨</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.status === 'success' ? 'bg-green-100 text-green-700' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'success' ? '成功' : item.status === 'pending' ? '处理中' : '失败'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{item.prompt}</p>
                    <p className="text-xs text-gray-400">{formatTime(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">预览</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-500">✕</button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-2">描述: {selectedItem.prompt}</p>
              <p className="text-xs text-gray-400 mb-4">时间: {formatTime(selectedItem.createdAt)}</p>
              
              {selectedItem.status === 'success' && selectedItem.result && selectedItem.result.startsWith('data:') && (
                <div className="space-y-3">
                  <img src={selectedItem.result} alt="Preview" className="w-full rounded" />
                  <div className="flex gap-2">
                    <a 
                      href={selectedItem.result} 
                      target="_blank"
                      className="flex-1 text-center py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      🔗 在新窗口打开
                    </a>
                    <a 
                      href={selectedItem.result} 
                      download={`seedai-${selectedItem.id}.png`}
                      className="flex-1 text-center py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ⬇️ 下载
                    </a>
                  </div>
                </div>
              )}
              
              {selectedItem.status === 'pending' && <p className="text-center py-8 text-yellow-600">处理中...</p>}
              {selectedItem.status === 'failed' && <p className="text-center py-8 text-red-600">生成失败</p>}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">AI 绘画生成器</h2>
          <p className="text-purple-200 text-lg">输入描述，AI 帮你生成精美图片</p>
        </div>

        {/* Type Card */}
        <div className="bg-white rounded-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold text-gray-800">AI 绘画</h3>
            <p className="text-gray-500">基于 Google Gemini 模型</p>
          </div>

          {/* Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要的图片，例如：一只可爱的橘猫，萌萌的大眼睛，软软的毛茸茸，阳光照在身上"
            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
          />

          {/* Options */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-sm text-gray-600">比例：</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="p-2 border border-gray-200 rounded-lg"
            >
              {aspectRatios.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <span className="text-sm text-gray-400 ml-auto">🎬 视频功能暂时禁用</span>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? `⏳ ${status} ${progress}%` : '🚀 生成图片'}
          </button>

          {generating && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        {result?.images && result.images.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">🖼️ 生成的图片</h3>
            <div className="space-y-4">
              {result.images.map((url, i) => (
                <div key={i} className="rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt={`Generated ${i}`} className="w-full h-auto max-h-96 object-contain" />
                  <div className="p-3 flex gap-2">
                    <a href={url} target="_blank" className="flex-1 text-center py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                      🔗 在新窗口打开
                    </a>
                    <a href={url} download={`seedai-${Date.now()}.png`} className="flex-1 text-center py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      ⬇️ 下载
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">🔗</div>
            <h4 className="text-white font-medium">Google Gemini</h4>
            <p className="text-purple-300 text-sm">先进 AI 模型</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="text-white font-medium">快速生成</h4>
            <p className="text-purple-300 text-sm">几秒钟完成</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🖥️</div>
            <h4 className="text-white font-medium">高清输出</h4>
            <p className="text-purple-300 text-sm">多种比例可选</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-purple-400 text-sm">
        <p>© 2026 SeedAI - AI 绘画生成平台</p>
      </footer>
    </div>
  );
}
