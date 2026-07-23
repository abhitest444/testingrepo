export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export type IssueCategory =
  | 'broken-link'
  | 'dead-end'
  | 'console-error'
  | 'network-failure'
  | 'broken-image'
  | 'layout'
  | 'interactive'
  | 'page-error';

export type ScoutIssue = {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  url: string;
  details?: string;
  selector?: string;
};

export type VisitedPage = {
  url: string;
  title: string;
  status: number | null;
  outboundLinks: number;
  internalLinks: number;
  issues: ScoutIssue[];
  screenshotPath?: string;
};

export type ViewportProfile = {
  name: string;
  width: number;
  height: number;
  isMobile?: boolean;
};

export type ScoutRunOptions = {
  startPath: string;
  maxPages: number;
  sameOriginOnly: boolean;
  /** Paths or substrings to never visit (e.g. logout). */
  excludePathPatterns: RegExp[];
  captureScreenshots: boolean;
  screenshotDir: string;
};

export type ScoutRunResult = {
  startedAt: string;
  finishedAt: string;
  baseURL: string;
  browserName: string;
  viewport: ViewportProfile;
  pagesVisited: VisitedPage[];
  issues: ScoutIssue[];
  summary: {
    pages: number;
    issues: number;
    bySeverity: Record<IssueSeverity, number>;
    byCategory: Partial<Record<IssueCategory, number>>;
  };
};
