import { getSupabaseAdmin } from "@/lib/supabase";
import type { AiAnalysis, ErrorPost, ErrorPostCard } from "@/types/error-post";

type DbRow = Record<string, unknown>;

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function toCard(row: DbRow): ErrorPostCard {
  return {
    id: String(row.id),
    title: String(row.title),
    errorMessage: String(row.error_message),
    technology: String(row.technology),
    technologyVersion: row.technology_version ? String(row.technology_version) : null,
    tags: textArray(row.tags),
    helpfulCount: Number(row.helpful_count ?? 0),
    viewCount: Number(row.view_count ?? 0),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function toPost(row: DbRow): ErrorPost {
  return {
    ...toCard(row),
    description: row.description ? String(row.description) : null,
    code: row.code ? String(row.code) : null,
    solution: String(row.solution),
    aiSummary: row.ai_summary ? String(row.ai_summary) : null,
    aiCause: row.ai_cause ? String(row.ai_cause) : null,
    aiSteps: textArray(row.ai_steps),
    aiCautions: textArray(row.ai_cautions),
    aiKeywords: textArray(row.ai_keywords),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function throwDbError(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function getHomeData() {
  const supabase = getSupabaseAdmin();
  const [recentResult, statsResult, technologyResult] = await Promise.all([
    supabase
      .from("error_posts")
      .select("id,title,error_message,technology,technology_version,tags,helpful_count,view_count,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("get_fixlog_stats"),
    supabase.rpc("get_technology_counts", { p_limit: 8 }),
  ]);

  throwDbError(recentResult.error, "최근 오류 기록 조회 실패");
  throwDbError(statsResult.error, "통계 조회 실패");
  throwDbError(technologyResult.error, "기술 통계 조회 실패");

  const stats = ((statsResult.data as DbRow[] | null)?.[0] ?? {}) as DbRow;

  return {
    recent: ((recentResult.data ?? []) as DbRow[]).map(toCard),
    stats: {
      totalPosts: Number(stats.total_posts ?? 0),
      totalHelpful: Number(stats.total_helpful ?? 0),
      technologies: Number(stats.technologies ?? 0),
    },
    technologies: ((technologyResult.data ?? []) as DbRow[]).map((row) => ({
      name: String(row.technology),
      count: Number(row.count ?? 0),
    })),
  };
}

export async function searchPosts({
  query,
  technology,
  sort,
}: {
  query: string;
  technology?: string;
  sort: "recent" | "helpful";
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("search_error_posts", {
    p_query: query,
    p_technology: technology || null,
    p_sort: sort,
    p_limit: 50,
  });

  throwDbError(error, "오류 기록 검색 실패");
  return ((data ?? []) as DbRow[]).map(toCard);
}

export async function getTechnologyOptions() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("get_technology_counts", { p_limit: 100 });
  throwDbError(error, "기술 목록 조회 실패");

  return ((data ?? []) as DbRow[]).map((row) => ({
    name: String(row.technology),
    count: Number(row.count ?? 0),
  }));
}

export async function getPostById(id: string): Promise<ErrorPost | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("error_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwDbError(error, "오류 기록 상세 조회 실패");
  if (!data) return null;
  return toPost(data as DbRow);
}

export async function incrementView(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("increment_error_post_view", { p_id: id });
  throwDbError(error, "조회수 증가 실패");
}

export async function createErrorPost(input: {
  title: string;
  errorMessage: string;
  description?: string;
  technology: string;
  technologyVersion?: string;
  code?: string;
  solution: string;
  tags: string[];
  aiAnalysis?: AiAnalysis;
}) {
  const supabase = getSupabaseAdmin();
  const ai = input.aiAnalysis;
  const { data, error } = await supabase
    .from("error_posts")
    .insert({
      title: input.title,
      error_message: input.errorMessage,
      description: input.description ?? null,
      technology: input.technology,
      technology_version: input.technologyVersion ?? null,
      code: input.code ?? null,
      solution: input.solution,
      tags: input.tags,
      ai_summary: ai?.summary ?? null,
      ai_cause: ai?.cause ?? null,
      ai_steps: ai?.steps ?? [],
      ai_cautions: ai?.cautions ?? [],
      ai_keywords: ai?.keywords ?? [],
    })
    .select("id")
    .single();

  throwDbError(error, "해결 기록 저장 실패");
  if (!data?.id) throw new Error("해결 기록 저장 후 ID를 받지 못했습니다.");
  return String(data.id);
}

export async function saveAiAnalysis(id: string, ai: AiAnalysis) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("error_posts")
    .update({
      ai_summary: ai.summary,
      ai_cause: ai.cause,
      ai_steps: ai.steps,
      ai_cautions: ai.cautions,
      ai_keywords: ai.keywords,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  throwDbError(error, "AI 분석 저장 실패");
}

export async function incrementHelpful(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("increment_error_post_helpful", { p_id: id });
  throwDbError(error, "도움됨 수 증가 실패");
  if (data === null || data === undefined) return null;
  return Number(data);
}

export async function checkDatabaseConnection() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("error_posts")
    .select("id", { head: true, count: "exact" });
  return !error;
}

export async function consumeRateLimit({
  clientHash,
  action,
  windowSeconds,
}: {
  clientHash: string;
  action: string;
  windowSeconds: number;
}) {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_client_hash: clientHash,
    p_action: action,
    p_window_start: windowStart,
  });

  throwDbError(error, "요청 제한 처리 실패");
  return Number(data ?? 1);
}
