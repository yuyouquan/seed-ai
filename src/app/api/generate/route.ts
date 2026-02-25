import { NextResponse } from 'next/server';

const history: Array<{
  id: string;
  type: 'image' | 'video';
  prompt: string;
  result?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}> = [];

export async function POST(req: Request) {
  const { type, prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: '请输入描述' }, { status: 400 });
  }

  const id = Date.now().toString();
  
  history.unshift({
    id,
    type: type as 'image' | 'video',
    prompt,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  try {
    if (type === 'video') {
      return NextResponse.json({ error: '视频功能暂时禁用' }, { status: 400 });
    }

    // Use Pollinations.ai free API
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    
    const historyItem = history.find(h => h.id === id);
    if (historyItem) {
      historyItem.result = imageUrl;
      historyItem.status = 'success';
    }

    return NextResponse.json({ 
      success: true,
      id,
      images: [imageUrl],
      message: '图片生成成功'
    });

  } catch (error) {
    console.error('Generation error:', error);
    const historyItem = history.find(h => h.id === id);
    if (historyItem) historyItem.status = 'failed';
    return NextResponse.json({ error: '生成失败: ' + String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'history') {
    return NextResponse.json({ 
      success: true, 
      history: history.slice(0, 50) 
    });
  }

  return NextResponse.json({ error: '无效请求' }, { status: 400 });
}
