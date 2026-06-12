import OpenAI from 'openai';
import { searchDocuments } from '@/lib/documentStore';

const SYSTEM_PROMPT = `당신은 항공정비 전문 AI 비서입니다.
항공기 정비 매뉴얼(AMM), 컴포넌트 정비 매뉴얼(CMM), 고장분리 매뉴얼(FIM/FRM), 배선도(WDM) 등에 관한 전문 지식을 갖추고 있습니다.

다음 지침을 따르세요:
- 항공 산업 표준 용어와 절차를 사용하세요
- 안전이 최우선입니다. WARNING(경고), CAUTION(주의), NOTE(참고)를 명확히 구분해서 표기하세요
- 구체적인 수치, 토크값, 제한값은 반드시 해당 항공기의 공식 매뉴얼을 확인하도록 안내하세요
- ICAO, FAA, EASA, KCAB 규정을 준수하는 답변을 제공하세요
- 한국어로 답변하되, 기술 용어는 영문 약어와 함께 표기하세요 (예: 착륙장치(Landing Gear))
- 단계별 절차가 필요한 경우 번호를 붙여 명확히 설명하세요`;

export async function POST(request) {
  try {
    const { messages, useDocuments } = await request.json();

    let systemPrompt = SYSTEM_PROMPT;

    if (useDocuments) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        const chunks = await searchDocuments(lastUserMessage.content);
        if (chunks.length > 0) {
          systemPrompt += `\n\n--- 업로드된 문서에서 찾은 관련 내용 ---\n${chunks.join('\n\n---\n')}\n---\n위 내용을 참조하여 답변하세요. 문서에 관련 내용이 있으면 "업로드된 문서에 따르면"이라고 명시하세요.`;
        }
      }
    }

    const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 2000,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return Response.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
