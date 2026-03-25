import type {
  AutomationBatchReceipt,
  AutomationPreviewBatch,
  AutomationSettings,
  GeneratedPostHistoryItem,
} from '../data/automationSettings';
import { requestJson } from './client';

function toSettingsPayload(settings: AutomationSettings) {
  return {
    enabled: settings.enabled,
    scheduleMode: settings.scheduleMode,
    postTime: settings.postTime,
    intervalMinutes: settings.intervalMinutes,
    sources: settings.sources,
    trendRangeMode: settings.trendRangeMode,
    customDateRange: settings.customDateRange,
    tone: settings.tone,
    focusPrompt: settings.focusPrompt,
  };
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  return requestJson<AutomationSettings>('/api/automation/settings');
}

export async function updateAutomationSettings(
  settings: AutomationSettings,
): Promise<AutomationSettings> {
  return requestJson<AutomationSettings>('/api/automation/settings', {
    method: 'PUT',
    body: JSON.stringify(toSettingsPayload(settings)),
  });
}

export async function listAutomationHistory(): Promise<GeneratedPostHistoryItem[]> {
  return requestJson<GeneratedPostHistoryItem[]>('/api/automation/history');
}

export async function previewAutomationCandidates(
  settings: AutomationSettings,
): Promise<AutomationPreviewBatch> {
  return requestJson<AutomationPreviewBatch>('/api/automation/preview', {
    method: 'POST',
    body: JSON.stringify(toSettingsPayload(settings)),
  });
}

export async function postAutomationNow(): Promise<AutomationBatchReceipt> {
  return requestJson<AutomationBatchReceipt>('/api/automation/post-now', {
    method: 'POST',
  });
}
