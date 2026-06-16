import OpenAI from 'openai';

export async function POST(request) {
  try {
    const { records, dateFrom, dateTo, aircraftFilter } = await request.json();

    if (!records || records.length === 0) {
      return Response.json({ error: '작업 이력이 없습니다' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

    const recordsText = records.map((r, i) =>
      `[${i + 1}] 날짜: ${r.date} | 항공기: ${r.aircraftType} | 작업: ${r.taskType} | 상태: ${{ completed: '완료', in_progress: '진행중', deferred: '연기' }[r.status] ?? r.status} | 담당: ${r.technician || '미기재'} | 내용: ${r.description || '없음'}`
    ).join('\n');

    const filterDesc = [
      dateFrom && dateTo ? `기간: ${dateFrom} ~ ${dateTo}` : dateFrom ? `${dateFrom} 이후` : dateTo ? `${dateTo} 이전` : '전체 기간',
      aircraftFilter ? `항공기: ${aircraftFilter}` : '전체 항공기',
    ].join(' / ');

    const prompt = `다음 항공기 정비 작업 이력을 분석하여 공식 정비 보고서를 작성하세요.

필터 조건: ${filterDesc}
총 작업 수: ${records.length}건

작업 이력:
${recordsText}

다음 마크다운 형식으로 전문적인 정비 보고서를 작성하세요:

# 항공기 정비 작업 보고서

## 1. 보고서 개요
- 보고 기간, 대상 항공기, 총 작업 건수 등 요약

## 2. 작업 현황 요약
- 상태별 (완료/진행중/연기) 통계
- 항공기별 작업 건수

## 3. 항목별 작업 내역
각 작업을 항공기별로 그룹화하여 상세 기술

## 4. 주요 발견사항 및 특이사항
작업 중 발견된 문제, 반복 결함, 주의 필요 사항

## 5. 권고사항
향후 정비 일정, 우선 처리 항목, 예방 정비 권고

## 6. 결론

항공 정비 표준 문서 형식을 따르고, 기술적으로 정확하게 작성하세요. 한국어로 작성하되 기술 용어는 영문 병기하세요.`;

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 3000,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return Response.json({ error: '보고서 생성에 실패했습니다' }, { status: 500 });
  }
}
