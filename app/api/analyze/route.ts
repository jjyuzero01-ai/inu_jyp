import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { college, department, courses } = await req.json();

    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json({ error: "No courses provided" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // User requested Gemini 3.1 Flash-Lite
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // Prepare context
    // Limit to top 50 courses by enrollment to avoid token overflow
    const topCourses = [...courses].sort((a, b) => (parseInt(b["수강"]) || 0) - (parseInt(a["수강"]) || 0)).slice(0, 50);

    let prompt = `당신은 대학 수강 데이터 분석 AI입니다. 현재 선택된 기준은 '${college || "전체 대학"}'${department ? `의 '${department}'` : ""}입니다.\n\n`;
    prompt += `다음은 해당 범주에 속한 주요 개설 강좌 목록(수강인원 순 상위 50개)입니다:\n`;
    
    topCourses.forEach((c: any) => {
      prompt += `- [${c["이수구분"] || "미분류"}] ${c["교과목명"]} (수강인원: ${c["수강"] || 0}명, 학점: ${c["학점"] || "-"}, 요일/시간: ${c["시간표(교시)"] || "미정"})\n`;
    });
    
    prompt += `\n이 데이터를 바탕으로 다음 구조에 맞춰 깔끔한 마크다운 양식으로 분석 보고서를 작성해 주세요:
1. **학과별(또는 대학별) 강좌 특징**: 해당 소속에 개설된 강좌들의 전반적인 특성과 주력 이수구분 분석
2. **수강 인원 트렌드**: 수강 인원이 많은 인기 강좌들의 특징과 학생들의 수강 패턴 파악
3. **개선 제언**: 데이터 기반으로 도출할 수 있는 시사점 또는 향후 커리큘럼 개선을 위한 제언

대시보드 리포트로 활용될 예정이니, 각 섹션마다 적절한 제목(Header)과 불릿 포인트(-)를 사용하여 가독성 높고 전문적이며 친절한 한국어로 답변해 주세요.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ analysis: responseText });
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze data" }, { status: 500 });
  }
}
