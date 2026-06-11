export interface CollegeData {
  name: string; // UI Display Name
  dbName: string; // Database Name
  departments: { name: string; dbName: string }[];
}

export const COLLEGE_MAPPING: CollegeData[] = [
  {
    name: "기초교육원",
    dbName: "교양",
    departments: [{ name: "교양", dbName: "교양" }]
  },
  {
    name: "인문대학",
    dbName: "인문대학",
    departments: [
      { name: "국어국문학과", dbName: "국어국문학과" },
      { name: "독어독문학과", dbName: "독어독문학과" },
      { name: "불어불문학과", dbName: "불어불문학과" },
      { name: "영어영문학과", dbName: "영어영문학과" },
      { name: "일본지역문화학과", dbName: "일본지역문화학과" },
      { name: "중어중국학과", dbName: "중어중국학과" }
    ]
  },
  {
    name: "자연과학대학",
    dbName: "자연과학대학",
    departments: [
      { name: "물리학과", dbName: "물리학과" },
      { name: "수학과", dbName: "수학과" },
      { name: "패션산업학과", dbName: "패션산업학과" },
      { name: "해양학과", dbName: "해양학과" },
      { name: "화학과", dbName: "화학과" }
    ]
  },
  {
    name: "사회과학대학",
    dbName: "사회과학대학",
    departments: [
      { name: "문헌정보학과", dbName: "문헌정보학과" },
      { name: "미디어커뮤니케이션학과", dbName: "미디어커뮤니케이션학과" },
      { name: "사회복지학과", dbName: "사회복지학과" },
      { name: "창의인재개발학과", dbName: "창의인재개발학과" }
    ]
  },
  {
    name: "글로벌정경대학",
    dbName: "글로벌정경대학",
    departments: [
      { name: "Global Trade & Service학부", dbName: "Global Trade & Service학부" },
      { name: "경제학과", dbName: "경제학과" },
      { name: "경제학과(야)", dbName: "경제학과(야)" },
      { name: "무역학부(야)", dbName: "무역학부(야)" },
      { name: "소비자학과", dbName: "소비자학과" },
      { name: "정치외교학과", dbName: "정치외교학과" },
      { name: "행정학과", dbName: "행정학과" }
    ]
  },
  {
    name: "공과대학",
    dbName: "공과대학",
    departments: [
      { name: "기계공학과", dbName: "기계공학과" },
      { name: "바이오-로봇시스템공학과", dbName: "바이오-로봇시스템공학과" },
      { name: "반도체융합전공", dbName: "반도체융합전공" },
      { name: "산업경영공학과", dbName: "산업경영공학과" },
      { name: "신소재공학과", dbName: "신소재공학과" },
      { name: "안전공학과", dbName: "안전공학과" },
      { name: "에너지화학공학과", dbName: "에너지화학공학과" },
      { name: "전기공학과", dbName: "전기공학과" },
      { name: "전자공학과", dbName: "전자공학과" },
      { name: "전자공학부", dbName: "전자공학부" },
      { name: "전자공학전공", dbName: "전자공학전공" }
    ]
  },
  {
    name: "정보기술대학",
    dbName: "정보기술대학",
    departments: [
      { name: "임베디드시스템공학과", dbName: "임베디드시스템공학과" },
      { name: "정보통신공학과", dbName: "정보통신공학과" },
      { name: "컴퓨터공학부", dbName: "컴퓨터공학부" }
    ]
  },
  {
    name: "경영대학",
    dbName: "경영대학",
    departments: [
      { name: "경영학부", dbName: "경영학부" },
      { name: "데이터과학과", dbName: "데이터과학과" },
      { name: "세무회계학과", dbName: "세무회계학과" }
    ]
  },
  {
    name: "예술체육대학",
    dbName: "예술체육대학",
    departments: [
      { name: "공연예술학과", dbName: "공연예술학과" },
      { name: "디자인학부", dbName: "디자인학부" },
      { name: "서양화전공", dbName: "서양화전공" },
      { name: "스포츠과학부", dbName: "스포츠과학부" },
      { name: "운동건강학부", dbName: "운동건강학부" },
      { name: "조형예술학부", dbName: "조형예술학부" },
      { name: "한국화전공", dbName: "한국화전공" }
    ]
  },
  {
    name: "사범대학",
    dbName: "사범대학",
    departments: [
      { name: "국어교육과", dbName: "국어교육과" },
      { name: "수학교육과", dbName: "수학교육과" },
      { name: "역사교육과", dbName: "역사교육과" },
      { name: "영어교육과", dbName: "영어교육과" },
      { name: "유아교육과", dbName: "유아교육과" },
      { name: "윤리교육과", dbName: "윤리교육과" },
      { name: "일어교육과", dbName: "일어교육과" },
      { name: "체육교육과", dbName: "체육교육과" }
    ]
  },
  {
    name: "도시과학대학",
    dbName: "도시과학대학",
    departments: [
      { name: "건설환경공학전공", dbName: "건설환경공학전공" },
      { name: "건축공학전공", dbName: "건축공학전공" },
      { name: "도시건축학부", dbName: "도시건축학부" },
      { name: "도시건축학전공", dbName: "도시건축학전공" },
      { name: "도시공학과", dbName: "도시공학과" },
      { name: "도시행정학과", dbName: "도시행정학과" },
      { name: "도시환경공학부", dbName: "도시환경공학부" },
      { name: "환경공학전공", dbName: "환경공학전공" }
    ]
  },
  {
    name: "생명과학기술대학",
    dbName: "생명과학기술대학",
    departments: [
      { name: "나노바이오공학전공", dbName: "나노바이오공학전공" },
      { name: "분자의생명전공", dbName: "분자의생명전공" },
      { name: "생명공학부", dbName: "생명공학부" },
      { name: "생명공학전공", dbName: "생명공학전공" },
      { name: "생명과학부", dbName: "생명과학부" },
      { name: "생명과학전공", dbName: "생명과학전공" }
    ]
  },
  {
    name: "융합자유전공대학",
    dbName: "융합자유전공대학",
    departments: [
      { name: "자유전공학부", dbName: "자유전공학부" }
    ]
  },
  {
    name: "동북아국제통상물류학부",
    dbName: "단과대구분없음",
    departments: [
      { name: "IBE전공", dbName: "IBE전공" },
      { name: "동북아국제통상전공", dbName: "동북아국제통상전공" },
      { name: "스마트물류공학전공", dbName: "스마트물류공학전공" }
    ]
  },
  {
    name: "법학부",
    dbName: "단과대구분없음(법학)",
    departments: [
      { name: "법학부", dbName: "법학부" }
    ]
  }
];
