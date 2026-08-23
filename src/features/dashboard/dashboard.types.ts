export interface DashboardGreeting {
  name: string;
  quote: string;
}

export type DashboardStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface DashboardState {
  greeting: DashboardGreeting | null;
  status: DashboardStatus;
}
