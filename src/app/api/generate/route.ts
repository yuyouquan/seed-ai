import { NextResponse } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || 'sk-cp-RbXjlT3ez_OaSzJ_Sb89ft8reiMhdsQf6stAT-2UkRwLSepi79tpthjpZCUBQN88vT890B72EtsBgkjpZY5V1mGffbjZoIaIVjqw-L2vkZSABVAsEcZJNxI';
const MINIMAX_API_URL = 'https://api.minimaxi.chat/v1/video_generation';

export async function POST(req: Request) {
  const { prompt, duration = 6, resolution = '768P' } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: '请输入视频描述' }, { status: 400 });
  }

  try {
    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Hailuo-2.3',
        prompt: prompt,
        duration: duration,
        resolution: resolution,
        prompt_optimizer: true,
      }),
    });

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json({ 
        error: data.base_resp?.status_msg || 'API错误' 
      }, { status: 500 });
    }

    // Return task info - in production you'd poll for completion
    return NextResponse.json({ 
      success: true,
      task_id: data.task_id,
      message: '视频生成任务已提交，请等待完成',
      estimated_time: '约1-2分钟'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}

// Query task status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('task_id');

  if (!taskId) {
    return NextResponse.json({ error: '缺少task_id' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.minimaxi.chat/v1/query/video_generation?task_id=${taskId}`, {
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
