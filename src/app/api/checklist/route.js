import OpenAI from 'openai';

export async function POST(request) {
  try {
    const { aircraftType, taskType } = await request.json();

    const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

    const prompt = `항공기 ${aircraftType}의 "${taskType}" 작업에 대한 정비 체크리스트를 작성하세요.

다음 JSON 형식으로만 반환하세요:
{
  "title": "체크리스트 제목",
  "items": [
    "첫 번째 체크 항목",
    "두 번째 체크 항목"
  ]
}

요구사항:
- 15~25개의 구체적인 항목을 포함하세요
- 항공 정비 표준 절차(ATA 챕터 기준)를 따르세요
- 안전 관련 항목 앞에 "⚠️ [경고]" 또는 "⚡ [주의]" 접두어를 사용하세요
- 작업 전 준비 → 작업 수행 → 작업 후 확인 순서로 구성하세요
- 한국어로 작성하되 기술 용어는 영문 병기하세요
- JSON만 반환하고 다른 텍스트는 포함하지 마세요`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content ?? '{}';
    const data = JSON.parse(content);

    return Response.json(data);
  } catch {
    return Response.json({ error: 'Failed to generate checklist' }, { status: 500 });
  }
}
