// Слой отправки заявок. Интерфейс форм зависит только от submitLead(),
// поэтому подключение API сводится к заполнению LEAD_API.endpoint.
import { LEAD_API } from '../config.js';

export const LeadStatus = Object.freeze({
  SENT: 'sent',
  NOT_CONNECTED: 'not-connected',
  FAILED: 'failed',
});

/**
 * @param {{ name: string, phone: string, message?: string, interest?: string, source: string }} lead
 * @returns {Promise<{ status: string, error?: unknown }>}
 */
export async function submitLead(lead) {
  if (!LEAD_API.endpoint) {
    return { status: LeadStatus.NOT_CONNECTED };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEAD_API.timeoutMs);
  try {
    const response = await fetch(LEAD_API.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, page: location.href }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { status: LeadStatus.SENT };
  } catch (error) {
    return { status: LeadStatus.FAILED, error };
  } finally {
    clearTimeout(timer);
  }
}
