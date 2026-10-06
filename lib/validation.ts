import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const aiAnalyzeSchema = z.object({
  title: z.string().trim().min(3, "제목을 3자 이상 입력해 주세요.").max(160),
  errorMessage: z
    .string()
    .trim()
    .min(3, "오류 메시지를 입력해 주세요.")
    .max(12000),
  description: optionalText(5000),
  technology: z.string().trim().min(1).max(80),
  technologyVersion: optionalText(80),
  code: optionalText(16000),
  solution: optionalText(8000),
});

export const aiAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(6000),
  cause: z.string().trim().min(1).max(6000),
  steps: z.array(z.string().trim().min(1).max(2000)).max(12),
  cautions: z.array(z.string().trim().min(1).max(2000)).max(12),
  keywords: z.array(z.string().trim().min(1).max(80)).max(12),
});

export const createErrorPostSchema = aiAnalyzeSchema.extend({
  solution: z
    .string()
    .trim()
    .min(5, "실제로 해결한 방법을 5자 이상 입력해 주세요.")
    .max(8000),

  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(8)
    .default([]),

  aiAnalysis: aiAnalysisSchema.optional(),
});

export const uuidSchema = z.string().uuid();
