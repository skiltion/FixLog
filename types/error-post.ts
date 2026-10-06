export type AiAnalysis = {
  summary: string;
  cause: string;
  steps: string[];
  cautions: string[];
  keywords: string[];
};

export type ErrorPost = {
  id: string;
  title: string;
  errorMessage: string;
  description: string | null;
  technology: string;
  technologyVersion: string | null;
  code: string | null;
  solution: string;
  tags: string[];
  aiSummary: string | null;
  aiCause: string | null;
  aiSteps: string[];
  aiCautions: string[];
  aiKeywords: string[];
  helpfulCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ErrorPostCard = Pick<
  ErrorPost,
  | "id"
  | "title"
  | "errorMessage"
  | "technology"
  | "technologyVersion"
  | "tags"
  | "helpfulCount"
  | "viewCount"
  | "createdAt"
>;
