import OpenAI from 'openai';
import { searchDocuments } from '@/lib/documentStore';

const SYSTEM_PROMPT_KO = `당신은 항공정비 전문 AI 비서입니다.
항공기 정비 매뉴얼(AMM), 컴포넌트 정비 매뉴얼(CMM), 고장분리 매뉴얼(FIM/FRM), 배선도(WDM) 등에 관한 전문 지식을 갖추고 있습니다.

다음 지침을 따르세요:
- 항공 산업 표준 용어와 절차를 사용하세요
- 안전이 최우선입니다. WARNING(경고), CAUTION(주의), NOTE(참고)를 명확히 구분해서 표기하세요
- 구체적인 수치, 토크값, 제한값은 반드시 해당 항공기의 공식 매뉴얼을 확인하도록 안내하세요
- ICAO, FAA, EASA, KCAB 규정을 준수하는 답변을 제공하세요
- 사용자가 어떤 언어로 질문하더라도 반드시 한국어로 답변하세요
- 기술 용어는 영문 약어와 함께 표기하세요 (예: 착륙장치(Landing Gear))
- 단계별 절차가 필요한 경우 번호를 붙여 명확히 설명하세요`;

const SYSTEM_PROMPT_EN = `You are an expert aviation maintenance AI assistant.
You have deep expertise in Aircraft Maintenance Manuals (AMM), Component Maintenance Manuals (CMM), Fault Isolation Manuals (FIM/FRM), and Wiring Diagram Manuals (WDM).

Follow these guidelines:
- Use standard aviation industry terminology and procedures
- Safety is the top priority. Clearly distinguish WARNING, CAUTION, and NOTE
- For specific values such as torque limits or tolerances, always advise the technician to verify with the official aircraft manual
- Provide answers in compliance with ICAO, FAA, EASA, and KCAB regulations
- Always respond in English regardless of what language the user writes in
- Include Korean translations for key technical terms when helpful (e.g., Landing Gear (착륙장치))
- For step-by-step procedures, number each step clearly`;

export async function POST(request) {
  try {
    const { messages, useDocuments, locale } = await request.json();

    let systemPrompt = locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_KO;

    if (useDocuments) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        const chunks = await searchDocuments(lastUserMessage.content);
        if (chunks.length > 0) {
          if (locale === 'en') {
            systemPrompt += `\n\n--- Relevant content from uploaded documents ---\n${chunks.join('\n\n---\n')}\n---\nRefer to the above content in your answer. If the document contains relevant information, indicate "According to the uploaded document".`;
          } else {
            systemPrompt += `\n\n--- 업로드된 문서에서 찾은 관련 내용 ---\n${chunks.join('\n\n---\n')}\n---\n위 내용을 참조하여 답변하세요. 문서에 관련 내용이 있으면 "업로드된 문서에 따르면"이라고 명시하세요.`;
          }
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
  } catch (err) {
    console.error('[chat API error]', err?.status, err?.message, err?.error);
    return Response.json({ error: err?.message ?? 'Failed to process request' }, { status: 500 });
  }
}
