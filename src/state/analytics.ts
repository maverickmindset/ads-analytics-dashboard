import { create } from 'zustand';
import type { BusinessOutcome, MetaAdsRow } from '../models/analytics';
import { demoRows } from '../data/demo';
import { readDataset, saveDataset, removeSavedDataset } from '../lib/datasetStorage';
const saved = readDataset();
interface AnalyticsState {
  rows: MetaAdsRow[];
  outcomes: BusinessOutcome[];
  datasetName: string | null;
  isDemo: boolean;
  dateRange: 'all' | 'last7' | 'last14';
  campaign: string;
  setDateRange: (range: AnalyticsState['dateRange']) => void;
  setCampaign: (campaign: string) => void;
  loadDataset: (rows: MetaAdsRow[], name: string) => void;
  loadDemo: () => void;
  clearDataset: () => void;
}
export const useAnalytics = create<AnalyticsState>(set => ({
  rows: saved?.rows ?? demoRows, outcomes: [], datasetName: saved ? saved.name : 'September 2026 demo', isDemo: !saved, dateRange: 'all', campaign: 'all',
  setDateRange: dateRange => set({ dateRange }), setCampaign: campaign => set({ campaign }),
  loadDataset: (rows, datasetName) => { saveDataset(rows, datasetName); set({ rows, outcomes: [], datasetName, isDemo: false, campaign: 'all', dateRange: 'all' }); },
  loadDemo: () => { removeSavedDataset(); set({ rows: demoRows, datasetName: 'September 2026 demo', isDemo: true, campaign: 'all', dateRange: 'all' }); },
  clearDataset: () => { saveDataset([], null); set({ rows: [], outcomes: [], datasetName: null, isDemo: false, campaign: 'all', dateRange: 'all' }); },
}));
