'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text-to-video');
  const [duration, setDuration] = useState('6');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const modes = [
    { id: 'text-to-video', name: '文字生视频', emoji: '✍️', desc: '输入文字描述，AI 生成视频' },
    { id: 'image-to-video', name: '图片生视频', emoji: '🖼️', desc: '上传图片，AI 让它动起来' },
    { id: 'lip-sync', name: '嘴型同步', emoji: '🎤', desc: '上传图片+音频，让人物说话' },
    { id: 'video-edit', name: '视频编辑', emoji: '✂️', desc: 'AI 智能剪辑和特效' },
  ];

  const checkStatus = async (taskId: string) => {
    try {
      const res = await fetch(`/api/generate?task_id=${taskId}`);
      const data = await res.json();
      
      if (data.task_status === 'success') {
        setProgress(100);
        setStatus('完成！');
        setVideoUrl(data.file_id);
        return true;
      } else if (data.task_status === 'failed') {
        setStatus('生成失败');
        setGenerating(false);
        return true;
      }
      return false;
    } catch {
      console.error('Check status error');
      return false;
    }
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setProgress(10);
    setStatus('提交任务...');
    setVideoUrl('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          duration: parseInt(duration),
          resolution: '768P'
        }),
      });

      const data = await res.json();

      if (data.error) {
        setStatus('错误: ' + data.error);
        setGenerating(false);
        return;
      }

      setTaskId(data.task_id);
      setStatus('生成中...');
      setProgress(30);

      // Poll for status
      const pollInterval = setInterval(async () => {
        const done = await checkStatus(data.task_id);
        if (done) {
          clearInterval(pollInterval);
          setGenerating(false);
        } else {
          setProgress(prev => Math.min(prev + 10, 90));
        }
      }, 5000);

    } catch {
      setStatus('生成失败');
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            🎬 SeedAI
          </h1>
          <span className="text-sm text-purple-300">MiniMax Hailuo 2.3 驱动</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            用 AI 生成你的专属视频
          </h2>
          <p className="text-purple-200 text-lg">
            基于 MiniMax Hailuo 2.3 模型，输入描述即可生成精彩视频
          </p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                mode === m.id
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <div className="text-2xl mb-2">{m.emoji}</div>
              <div className="font-medium text-sm">{m.name}</div>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要的视频内容，例如：一只可爱的小猫在草地上奔跑，阳光明媚，微风吹过"
            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
          />

          {/* Duration */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-600">视频时长：</span>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="p-2 border border-gray-200 rounded-lg"
            >
              <option value="6">6 秒</option>
              <option value="10">10 秒</option>
            </select>
            <span className="text-sm text-gray-600">分辨率：768P</span>
          </div>

          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? `🎬 ${status} ${progress}%` : '🚀 开始生成视频'}
          </button>

          {/* Progress */}
          {generating && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {status} - 预计需要 1-2 分钟
              </p>
            </div>
          )}
        </div>

        {/* Result */}
        {videoUrl && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">📺 生成结果</h3>
            <div className="bg-gray-900 rounded-xl h-64 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <p>视频生成完成！</p>
                <p className="text-sm text-gray-400 mt-2">Task ID: {taskId}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium">
                ⬇️ 下载视频
              </button>
              <button className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-medium">
                📱 发布到抖音
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="text-white font-medium">MiniMax 2.3</h4>
            <p className="text-purple-300 text-sm">最新视频生成模型</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🎬</div>
            <h4 className="text-white font-medium">最长10秒</h4>
            <p className="text-purple-300 text-sm">支持 6s / 10s</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🖥️</div>
            <h4 className="text-white font-medium">768P 高清</h4>
            <p className="text-purple-300 text-sm">清晰画质</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-purple-400 text-sm">
        <p>© 2026 SeedAI - AI 视频生成平台</p>
      </footer>
    </div>
  );
}
