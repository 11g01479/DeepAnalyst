
export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ResearchReport {
  id: string;
  query: string;
  content: string;
  sources: GroundingSource[];
  timestamp: number;
}

export interface AppState {
  reports: ResearchReport[];
  currentReport: ResearchReport | null;
  loading: boolean;
  error: string | null;
}
