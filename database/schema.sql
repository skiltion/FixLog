-- FixLog / Supabase PostgreSQL schema
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 한 번 실행하세요.
-- FixLog은 로그인 기능을 사용하지 않으며 Next.js 서버가 SUPABASE_SECRET_KEY로 DB에 접근합니다.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.error_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  error_message TEXT NOT NULL CHECK (char_length(error_message) BETWEEN 3 AND 12000),
  description TEXT,
  technology VARCHAR(80) NOT NULL,
  technology_version VARCHAR(80),
  code TEXT,
  solution TEXT NOT NULL CHECK (char_length(solution) BETWEEN 5 AND 8000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  ai_summary TEXT,
  ai_cause TEXT,
  ai_steps TEXT[] NOT NULL DEFAULT '{}',
  ai_cautions TEXT[] NOT NULL DEFAULT '{}',
  ai_keywords TEXT[] NOT NULL DEFAULT '{}',
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS error_posts_created_at_idx
  ON public.error_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS error_posts_technology_idx
  ON public.error_posts (technology);

CREATE INDEX IF NOT EXISTS error_posts_helpful_count_idx
  ON public.error_posts (helpful_count DESC);

CREATE INDEX IF NOT EXISTS error_posts_tags_gin_idx
  ON public.error_posts USING GIN (tags);

CREATE INDEX IF NOT EXISTS error_posts_ai_keywords_gin_idx
  ON public.error_posts USING GIN (ai_keywords);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  client_hash TEXT NOT NULL,
  action VARCHAR(50) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 1),
  PRIMARY KEY (client_hash, action, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx
  ON public.rate_limits (window_start);

-- 브라우저에서 테이블을 직접 읽거나 쓰지 못하게 RLS를 활성화합니다.
-- 별도의 anon/authenticated 정책은 만들지 않습니다.
ALTER TABLE public.error_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 서버 Secret Key(service_role 권한)만 테이블을 사용합니다.
REVOKE ALL ON TABLE public.error_posts FROM anon, authenticated;
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE public.error_posts TO service_role;
GRANT ALL ON TABLE public.rate_limits TO service_role;

-- 홈 화면 통계
CREATE OR REPLACE FUNCTION public.get_fixlog_stats()
RETURNS TABLE (
  total_posts BIGINT,
  total_helpful BIGINT,
  technologies BIGINT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*) AS total_posts,
    COALESCE(SUM(helpful_count), 0)::BIGINT AS total_helpful,
    COUNT(DISTINCT technology) AS technologies
  FROM public.error_posts;
$$;

-- 기술별 등록 수
CREATE OR REPLACE FUNCTION public.get_technology_counts(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  technology VARCHAR,
  count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ep.technology, COUNT(*) AS count
  FROM public.error_posts ep
  GROUP BY ep.technology
  ORDER BY count DESC, ep.technology ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

-- 제목/오류 메시지/해결 방법/태그/AI 키워드를 한 번에 검색합니다.
CREATE OR REPLACE FUNCTION public.search_error_posts(
  p_query TEXT DEFAULT '',
  p_technology TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'recent',
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF public.error_posts
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_sort = 'helpful' THEN
    RETURN QUERY
    SELECT ep.*
    FROM public.error_posts ep
    WHERE
      (p_technology IS NULL OR ep.technology = p_technology)
      AND (
        COALESCE(p_query, '') = ''
        OR ep.title ILIKE '%' || p_query || '%'
        OR ep.error_message ILIKE '%' || p_query || '%'
        OR ep.solution ILIKE '%' || p_query || '%'
        OR array_to_string(ep.tags, ' ') ILIKE '%' || p_query || '%'
        OR array_to_string(ep.ai_keywords, ' ') ILIKE '%' || p_query || '%'
      )
    ORDER BY ep.helpful_count DESC, ep.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 100));
  ELSE
    RETURN QUERY
    SELECT ep.*
    FROM public.error_posts ep
    WHERE
      (p_technology IS NULL OR ep.technology = p_technology)
      AND (
        COALESCE(p_query, '') = ''
        OR ep.title ILIKE '%' || p_query || '%'
        OR ep.error_message ILIKE '%' || p_query || '%'
        OR ep.solution ILIKE '%' || p_query || '%'
        OR array_to_string(ep.tags, ' ') ILIKE '%' || p_query || '%'
        OR array_to_string(ep.ai_keywords, ' ') ILIKE '%' || p_query || '%'
      )
    ORDER BY ep.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 100));
  END IF;
END;
$$;

-- 조회수 증가
CREATE OR REPLACE FUNCTION public.increment_error_post_view(p_id UUID)
RETURNS VOID
LANGUAGE SQL
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.error_posts
  SET view_count = view_count + 1
  WHERE id = p_id;
$$;

-- 도움됨 증가 후 현재 값을 반환
CREATE OR REPLACE FUNCTION public.increment_error_post_helpful(p_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.error_posts
  SET helpful_count = helpful_count + 1
  WHERE id = p_id
  RETURNING helpful_count INTO new_count;

  RETURN new_count;
END;
$$;

-- 익명 요청 횟수 제한을 원자적으로 증가시킵니다.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_client_hash TEXT,
  p_action TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.rate_limits (client_hash, action, window_start, request_count)
  VALUES (p_client_hash, p_action, p_window_start, 1)
  ON CONFLICT (client_hash, action, window_start)
  DO UPDATE SET request_count = public.rate_limits.request_count + 1
  RETURNING request_count INTO new_count;

  RETURN new_count;
END;
$$;

-- RPC 함수 역시 서버 권한에서만 호출합니다.
REVOKE ALL ON FUNCTION public.get_fixlog_stats() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_technology_counts(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_error_posts(TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_error_post_view(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_error_post_helpful(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_fixlog_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_technology_counts(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_error_posts(TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_error_post_view(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_error_post_helpful(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, TIMESTAMPTZ) TO service_role;

-- 오래된 rate limit 행은 필요할 때 SQL Editor에서 정리할 수 있습니다.
-- DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '7 days';
