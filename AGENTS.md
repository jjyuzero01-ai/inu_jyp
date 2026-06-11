# Supabase Table & Security Guidelines

앞으로 Supabase 테이블을 설계, 생성 또는 관리할 때는 다음 보안 및 권한 설정 지침을 반드시 준수해야 합니다.

## 1. 명시적인 역할 권한 부여 (GRANT)
PostgREST API를 통해 테이블에 접근할 수 있도록 `anon` 및 `authenticated` 역할에 대한 명시적인 권한 부여(GRANT) SQL 문을 필수로 작성합니다.

```sql
-- 예시: 테이블 생성 후 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 테이블명 TO anon, authenticated;
```

## 2. 행 레벨 보안 (Row Level Security, RLS) 활성화 및 정책(Policy) 정의
데이터 보호를 위해 모든 테이블에 RLS를 활성화하고, 특히 사용자 소유의 데이터(예: 일기 등)는 인증된 사용자(`authenticated`) 본인만 읽고 쓸 수 있도록 보안 정책을 엄격히 정의합니다.

```sql
-- 1. RLS 활성화
ALTER TABLE 테이블명 ENABLE ROW LEVEL SECURITY;

-- 2. 인증된 사용자 본인 데이터 조회/수정 정책 예시
CREATE POLICY "Users can manage their own data" 
ON 테이블명 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
```
