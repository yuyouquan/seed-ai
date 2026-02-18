import { NextResponse } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || 'sk-cp-RbXjlT3ez_OaSzJ_Sb89ft8reiMhdsQf6stAT-2UkRwLSepi79tpthjpZCUBQN88vT890B72EtsBgkjpZY5V1mGffbjZoIaIVjqw-L2vkZSABVAsEcZJNxI';

// In-memory storage for demo (in production use Redis/DB)
const history: Array<{
  id: string;
  type: 'image' | 'video';
  prompt: string;
  result?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}> = [];

export async function POST(req: Request) {
  const { type, prompt, model, aspect_ratio, n } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: '请输入描述' }, { status: 400 });
  }

  const id = Date.now().toString();
  
  // Add to history
  history.unshift({
    id,
    type: type as 'image' | 'video',
    prompt,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  try {
    let endpoint = '';
    let body = {};

    if (type === 'image') {
      endpoint = 'https://api.minimax.chat/v1/image_generation';
      body = {
        model: model || 'image-01',
        prompt: prompt,
        aspect_ratio: aspect_ratio || '1:1',
        response_format: 'url',
        n: n || 1,
        prompt_optimizer: true,
      };
    } else if (type === 'video') {
      endpoint = 'https://api.minimax.chat/v1/video_generation';
      body = {
        model: 'MiniMax-Hailuo-2.3',
        prompt: prompt,
        duration: 6,
        resolution: '768P',
        prompt_optimizer: true,
      };
    } else {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 });
    }

    console.log('Calling MiniMax API:', endpoint);
    console.log('Body:', JSON.stringify(body));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('MiniMax response:', data);

    // Update history
    const historyItem = history.find(h => h.id === id);
    
    if (data.base_resp?.status_code !== 0) {
      const errorMsg = data.base_resp?.status_msg || 'API错误';
      if (historyItem) {
        historyItem.status = 'failed';
      }
      return NextResponse.json({ 
        error: errorMsg,
        details: data 
      }, { status: 500 });
    }

    if (type === 'image') {
      const images = (data.data as Array<{ url: string }>)?.map((img) => img.url) || [];
      if (historyItem) {
        historyItem.result = images[0];
        historyItem.status = 'success';
      }
      return NextResponse.json({ 
        success: true,
        id,
        images,
        message: '图片生成成功'
      });
    } else {
      if (historyItem) {
        historyItem.result = data.task_id;
      }
      return NextResponse.json({ 
        success: true,
        id,
        task_id: data.task_id,
        message: '视频生成任务已提交'
      });
    }

  } catch (error) {
    console.error('Generation error:', error);
    const historyItem = history.find(h => h.id === id);
    if (historyItem) {
      historyItem.status = 'failed';
    }
    return NextResponse.json({ error: '生成失败: ' + String(error) }, { status: 500 });
  }
}

// Get history
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('task_id');
  const type = searchParams.get('type');
  const action = searchParams.get('action');

  // Return history list
  if (action === 'history') {
    return NextResponse.json({ 
      success: true, 
      history: history.slice(0, 50) 
    });
  }

  if (!taskId) {
    return NextResponse.json({ error: '缺少task_id' }, { status: 400 });
  }

  try {
    const endpoint = type === 'image' 
      ? `https://api.minimax.chat/v1/query/image_generation?task_id=${taskId}`
      : `https://api.minimax.chat/v1/query/video_generation?task_id=${taskId}`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
