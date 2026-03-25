import { apiRoot, projectKey } from './ct/client';

export type AuditOutcome = 'success' | 'failure';

export interface AuditEntry {
  agentId: string;
  agentEmail: string;
  agentName: string;
  customerId: string | null;
  sessionId: string;
  actionType: string;
  actionDetail: Record<string, unknown>;
  timestamp: string;
  outcome: AuditOutcome;
  failureReason?: string;
}

/**
 * Write an immutable audit log entry to the `agent-audit-log` CT Custom Objects container.
 *
 * Key format: `{sessionId}-{timestamp}-{actionType}` (URL-safe characters only).
 *
 * Per spec: this MUST be called before any mutation is returned. If this write fails,
 * the caller should abort the mutation and return an error.
 */
export async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  const timestamp = entry.timestamp || new Date().toISOString();
  // Build a unique, URL-safe key
  const safeAction = entry.actionType.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeTs = timestamp.replace(/[^0-9T]/g, '');
  const key = `${entry.sessionId}-${safeTs}-${safeAction}`.slice(0, 256);

  await apiRoot
    .customObjects()
    .post({
      body: {
        container: 'agent-audit-log',
        key,
        value: {
          ...entry,
          timestamp,
        },
      },
    })
    .execute();
}

/**
 * Query audit log entries for a given customerId, with optional date range.
 * Returns entries in chronological order (ascending by timestamp).
 */
export async function queryAuditLog(
  customerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AuditEntry[]> {
  // CT Custom Objects don't support filtering on value fields directly via the REST API.
  // We fetch all entries from the container and filter in-memory.
  // For v1 volume this is acceptable; replace with a dedicated store if log volume grows.
  const listResponse = await apiRoot
    .customObjects()
    .get({
      queryArgs: {
        where: `container="agent-audit-log"`,
        limit: 500,
        sort: 'createdAt asc',
      },
    })
    .execute();

  const entries = (listResponse.body.results ?? [])
    .map((obj) => obj.value as AuditEntry)
    .filter((e) => e.customerId === customerId);

  if (dateFrom || dateTo) {
    return entries.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      if (dateFrom && ts < new Date(dateFrom).getTime()) return false;
      if (dateTo && ts > new Date(dateTo).getTime()) return false;
      return true;
    });
  }

  return entries;
}
