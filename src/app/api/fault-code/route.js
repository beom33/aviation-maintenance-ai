import OpenAI from 'openai';

export async function POST(request) {
  try {
    const { code, aircraftType } = await request.json();

    const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

    const prompt = `항공기${aircraftType ? ` ${aircraftType}` : ''}의 결함 코드 "${code}"를 분석하세요.

다음 JSON 형식으로만 반환하세요:
{
  "code": "${code}",
  "description": "결함 코드에 대한 명확한 설명",
  "severity": "high" 또는 "medium" 또는 "low",
  "possibleCauses": ["원인1", "원인2", "원인3"],
  "correctiveActions": ["단계1", "단계2", "단계3", "단계4"],
  "references": ["AMM XX-XX-XX", "FIM XX-XX"],
  "notes": "추가 안전 경고나 중요 참고사항"
}

severity 기준:
- high: 즉시 비행 중단 및 조치 필요 (Go-No Go 항목)
- medium: 다음 정기 점검 전 조치 필요
- low: 모니터링 후 일반 정비 주기에 처리 가능

요구사항:
- possibleCauses: 3~5개
- correctiveActions: 3~6개, 순차적 절차로 작성
- references: ATA 챕터 번호 포함
- 한국어로 작성하되 기술 용어는 영문 병기
- JSON만 반환하고 다른 텍스트 없이`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content ?? '{}';
    const data = JSON.parse(content);

    return Response.json(data);
  } catch {
    return Response.json({ error: 'Failed to analyze fault code' }, { status: 500 });
  }
}
