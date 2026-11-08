import { getAuthToken, setAuthToken } from '../context/AuthContext';
import { localizeApiError } from '../i18n/api-errors';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export type PublicLocation = { id: string; name: string };
export type DataQaStatus = {
  status: 'idle' | 'starting' | 'running' | 'completed' | 'failed' | 'offline';
  processed_rows?: number;
  total_rows?: number;
  candidate_pairs?: number;
  created_at?: string;
  heartbeat_at?: string;
  completed_at?: string | null;
  error_code?: string | null;
};

async function request<T>(
  method: string,
  path: string,
  data?: any,
  options?: { useAuth?: boolean; noJsonParse?: boolean; retryOnUnauthorized?: boolean }
): Promise<T> {
  const token = options?.useAuth !== false ? getAuthToken() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_BASE}${path}`;
  const config: RequestInit = {
    method,
    headers,
  };

  if (method === 'GET' && data?.params) {
    const params = new URLSearchParams();
    Object.entries(data.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    if (query) url += `${url.includes('?') ? '&' : '?'}${query}`;
  } else if (data !== undefined && !(data instanceof FormData)) {
    config.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    // Don't set Content-Type for FormData, let browser set it
    delete headers['Content-Type'];
    config.body = data;
  }

  let response = await fetch(url, { ...config, credentials: 'include' });

  if (response.status === 401 && token && options?.retryOnUnauthorized !== false && !path.startsWith('/auth/')) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshResponse.ok) {
      const refreshPayload = await refreshResponse.json();
      const refreshed = refreshPayload.data || refreshPayload;
      setAuthToken(refreshed.accessToken || null);
      if (refreshed.accessToken) {
        headers['Authorization'] = `Bearer ${refreshed.accessToken}`;
        response = await fetch(url, { ...config, credentials: 'include' });
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error || `HTTP ${response.status}`;
    throw new Error(localizeApiError(response.status, message));
  }

  if (options?.noJsonParse) {
    return response as unknown as T;
  }

  if (response.status === 204) {
    return {} as unknown as T;
  }

  const payload = await response.json();
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T;
}

const api = {
  getPublicHealth: () => request<{ status: string; database: string }>('GET', '/public/health', undefined, { useAuth: false }),
  getPublicLocations: (country: string, level: 'provinces' | 'cities' | 'zones', parentId?: string, search?: string) =>
    request<{ locations: PublicLocation[] }>('GET', '/public/locations', { params: { country, level, parentId, search } }, { useAuth: false }),
  getMarketingOverview: () => request<MarketingOverview>('GET', '/marketing/overview'),
  getMarketingContacts: (params: { page: number; limit: number; search?: string; country?: string }) => request<{ contacts: MarketingContact[]; total: number; page: number; limit: number }>('GET', '/marketing/contacts', { params }),
  createMarketingContact: async (contact: Omit<MarketingContact, 'id' | 'locale' | 'unsubscribed_at' | 'created_at'>) =>
    (await request<{ contact: MarketingContact }>('POST', '/marketing/contacts', contact)).contact,
  unsubscribeMarketingContact: (id: string) => request<{ id: string }>('POST', `/marketing/contacts/${id}/unsubscribe`),
  getMarketingCampaigns: (params: { page: number; limit: number; search?: string; country?: string }) => request<{ campaigns: MarketingCampaign[]; total: number; page: number; limit: number }>('GET', '/marketing/campaigns', { params }),
  createMarketingCampaign: async (campaign: Pick<MarketingCampaign, 'name' | 'subject' | 'body' | 'country'>) =>
    (await request<{ campaign: MarketingCampaign }>('POST', '/marketing/campaigns', campaign)).campaign,
  updateMarketingCampaign: async (id: string, campaign: Partial<Pick<MarketingCampaign, 'name' | 'subject' | 'body' | 'country' | 'status'>>) =>
    (await request<{ campaign: MarketingCampaign }>('PATCH', `/marketing/campaigns/${id}`, campaign)).campaign,
  getMarketingCampaignDeliveries: (id: string) => request<{ deliveries: MarketingDelivery[] }>('GET', `/marketing/campaigns/${id}/deliveries`),
  queueMarketingCampaignDeliveries: (id: string, contactIds: string[]) =>
    request<{ deliveries: MarketingDelivery[]; limits: { hourly: number; daily: number }; sending_enabled: boolean }>('POST', `/marketing/campaigns/${id}/deliveries`, { contact_ids: contactIds }),
  cancelMarketingDelivery: (id: string) => request<{ delivery: Pick<MarketingDelivery, 'id' | 'status'> }>('POST', `/marketing/deliveries/${id}/cancel`),
  // Staff work
  getStaffTasks: async (params?: Record<string, string>) => (await request<{ tasks: StaffTask[] }>('GET', '/staff-tasks', params ? { params } : undefined)).tasks,
  getStaffAssignees: async () => (await request<{ assignees: StaffAssignee[] }>('GET', '/staff-tasks/assignees')).assignees,
  getStaffCalendar: async (params: { from: string; to: string; assigned_to?: string }) =>
    (await request<{ events: StaffCalendarEvent[] }>('GET', '/staff-calendar', { params })).events,
  createStaffTask: async (data: StaffTaskInput) => (await request<{ task: StaffTask }>('POST', '/staff-tasks', data)).task,
  updateStaffTask: async (id: string, data: Partial<StaffTaskInput> & { status?: StaffTaskStatus; progress_notes?: string }) =>
    (await request<{ task: StaffTask }>('PATCH', `/staff-tasks/${id}`, data)).task,

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ user: any; accessToken: string; refreshToken: string }>('POST', '/auth/login', credentials),
  me: () => request<{ user: any }>('GET', '/auth/me'),
  logout: () => request<{ message: string }>('POST', '/auth/logout'),

  // Users
  getUser: (id: string) => request<{ id: string; name: string; email: string; role: string }>(`GET`, `/users/${id}`),
  getUsers: () => request<{ id: string; name: string; email: string; role: string }[]>('GET', '/users'),

  // Profile
  getProfile: () => request<{ user: any }>('GET', '/auth/me'),
  updateProfile: (data: Partial<{ address: string; city: string; province: string; zone: string; postal_code: string; avatar_url: string }>) =>
    request<{ user: any }>('PATCH', '/auth/profile', data),

  // Services
  getServices: async () => (await request<{ services: Service[] }>('GET', '/services')).services,
  getAdminServices: async () => (await request<{ services: Service[] }>('GET', '/services/admin/all')).services,
  getService: async (id: string) => (await request<{ service: Service }>(`GET`, `/services/${id}`)).service,
  createService: async (data: Omit<Service, 'id'>) => (await request<{ service: Service }>('POST', '/services', data)).service,
  updateService: async (id: string, data: Partial<Service>) => (await request<{ service: Service }>(`PATCH`, `/services/${id}`, data)).service,
  deleteService: (id: string) => request<{ message: string }>('DELETE', `/services/${id}`),

  // Providers
  getProviders: async (params?: Record<string, string>) => {
    const data = await request<any>('GET', '/providers', { params });
    return data.providers || data;
  },
  getProvider: (id: string) => request<Provider>(`GET`, `/providers/${id}`),
  createProvider: (data: Omit<Provider, 'id'>) => request<Provider>('POST', '/providers', data),
  updateProvider: (id: string, data: Partial<Provider>) => request<Provider>(`PUT`, `/providers/${id}`, data),
  deleteProvider: (id: string) => request<{ message: string }>('DELETE', `/providers/${id}`),

  // Inventory
  getInventory: async (params?: Record<string, string>) => {
    const data = await request<any>('GET', '/inventory', { params });
    return data.products || data;
  },
  getInventoryItem: (id: string) => request<InventoryItem>(`GET`, `/inventory/${id}`),
  createInventoryItem: (data: Omit<InventoryItem, 'id'>) => request<InventoryItem>('POST', '/inventory', data),
  updateInventoryItem: async (id: string, data: Partial<InventoryItem> & Record<string, any>) =>
    (await request<{ product: InventoryItem }>(`PUT`, `/inventory/${id}`, data)).product,
  adjustInventoryStock: async (id: string, change: number, reason?: string) =>
    (await request<{ product: InventoryItem }>('POST', `/inventory/${id}/adjust-stock`, { change, reason })).product,
  deleteInventory: (id: string) => request<{ message: string }>('DELETE', `/inventory/${id}`),

  // Invoices
  getInvoices: async (params?: Record<string, string>) => {
    const data = await request<any>('GET', '/invoices', { params });
    return data.invoices || data;
  },
  getInvoice: (id: string) => request<Invoice>(`GET`, `/invoices/${id}`),
  createInvoice: (data: Omit<Invoice, 'id'>) => request<Invoice>('POST', '/invoices', data),
  updateInvoice: (id: string, data: Partial<Invoice> & Record<string, any>) => request<Invoice>(`PUT`, `/invoices/${id}`, data),

  // Payments
  getPayments: async (params?: Record<string, string>) => {
    const data = await request<any>('GET', '/payments', { params });
    return data.payments || data;
  },
  getPayment: (id: string) => request<Payment>(`GET`, `/payments/${id}`),
  createPayment: (data: Omit<Payment, 'id'>) => request<Payment>('POST', '/payments', data),
  updatePayment: (id: string, data: Partial<Payment> & Record<string, any>) => request<Payment>(`PUT`, `/payments/${id}`, data),

  // Clients
  getClients: (params?: Record<string, string>) => request<Client[]>('GET', '/clients', { params }),
  getClient: (id: string) => request<Client>(`GET`, `/clients/${id}`),
  createClient: (data: Omit<Client, 'id'>) => request<Client>('POST', '/clients', data),
  updateClient: (id: string, data: Partial<Client>) => request<Client>(`PUT`, `/clients/${id}`, data),
  deleteClient: (id: string) => request<{ message: string }>('DELETE', `/clients/${id}`),

  // Enterprises
  getEnterprises: async (params?: Record<string, string>) => {
    const data = await request<any>('GET', '/enterprises', { params });
    return data.enterprises || data;
  },
  getEnterprise: (id: string) => request<Enterprise>(`GET`, `/enterprises/${id}`),
  createEnterprise: (data: Omit<Enterprise, 'id'>) => request<Enterprise>('POST', '/enterprises', data),
  updateEnterprise: (id: string, data: Partial<Enterprise>) => request<Enterprise>(`PUT`, `/enterprises/${id}`, data),
  deleteEnterprise: (id: string) => request<{ message: string }>('DELETE', `/enterprises/${id}`),

  // Dashboard
  getDashboard: () => request<any>('GET', '/dashboard'),
  getDataQaStatus: () => request<DataQaStatus>('GET', '/data-quality/status'),
  getInstallMetrics: () => request<{ total: number; last_30_days: number; by_device: Array<{ device_type: string; installations: number }>; by_country: Array<{ country_code: string; locale: string; installations: number }>; daily: Array<{ day: string; installations: number }> }>('GET', '/dashboard/install-metrics'),
  getAdminRecent: () => request<AdminRecent>('GET', '/dashboard/recent'),

  // Tickets
  getTickets: (params?: { status?: string; client_id?: string; enterprise_id?: string; page?: number | string; limit?: number | string; search?: string; assigned?: string }) =>
    request<{ tickets: Ticket[]; total: number; page: number; limit: number }>('GET', '/tickets', { params }),
  getTicket: async (id: string) => (await request<{ ticket: Ticket }>(`GET`, `/tickets/${id}`)).ticket,
  getStaffInbox: async () => (await request<{ tickets: InboxTicket[] }>('GET', '/tickets/inbox')).tickets,
  markTicketRead: (id: string, seen_at: string) => request<{ recorded: boolean }>('POST', `/tickets/${id}/read`, { seen_at }),
  sendTicketMessage: async (id: string, message: string) =>
    (await request<{ message: TicketMessage }>('POST', `/tickets/${id}/messages`, { message, is_internal: false })).message,
  getRemoteSessions: async (id: string) => (await request<{ sessions: RemoteSupportSession[] }>('GET', `/tickets/${id}/remote-support`)).sessions,
  requestRemoteSupport: async (id: string) => (await request<{ session: RemoteSupportSession }>('POST', `/tickets/${id}/remote-support`)).session,
  updateRemoteSupport: async (ticketId: string, sessionId: string, action: 'consent' | 'start' | 'finish') =>
    (await request<{ session: RemoteSupportSession }>('POST', `/tickets/${ticketId}/remote-support/${sessionId}/${action}`)).session,
  createTicket: async (data: Partial<Ticket> & Record<string, any>) => (await request<{ ticket: Ticket }>('POST', '/tickets', data)).ticket,
  updateTicket: async (id: string, data: Partial<Ticket>) => (await request<{ ticket: Ticket }>(`PUT`, `/tickets/${id}`, data)).ticket,

  // Visits
  getVisits: (params?: { ticket_id?: string; date_from?: string; date_to?: string; status?: string; page?: string; limit?: string }) =>
    request<{ visits: Visit[] }>('GET', '/visits', { params }).then((data) => data.visits),
  getVisit: async (id: string) => (await request<{ visit: Visit }>(`GET`, `/visits/${id}`)).visit,
  createVisit: async (data: Omit<Visit, 'id'>) => (await request<{ visit: Visit }>('POST', '/visits', data)).visit,
  updateVisit: async (id: string, data: Partial<Visit>) => (await request<{ visit: Visit }>(`PUT`, `/visits/${id}`, data)).visit,

  // Repairs
  getRepairs: async (params?: { status?: string; device_type?: string; search?: string }) =>
    (await request<{ repairs: Repair[] }>('GET', '/repairs', { params })).repairs,
  getRepair: async (id: string) => (await request<{ repair: Repair }>('GET', `/repairs/${id}`)).repair,
  updateRepair: async (id: string, data: Partial<Repair>) =>
    (await request<{ repair: Repair }>('PUT', `/repairs/${id}`, data)).repair,
  updateRepairStatus: async (id: string, status: Repair['status']) =>
    (await request<{ repair: Repair }>('POST', `/repairs/${id}/status`, { status })).repair,

  // Prospects
  getProspects: async (params?: {
    search?: string;
    status?: string;
    contact_status?: string;
    country?: string;
    province?: string;
    city?: string;
    zone?: string;
    business_type?: string;
    category?: string;
    min_rating?: string;
    min_reviews?: string;
    min_confidence?: string;
    has_email?: string;
    has_phone?: string;
    has_whatsapp?: string;
    has_social?: string;
    page?: string;
    limit?: string;
  }) =>
    request<{ prospects: Prospect[]; total: number; page: number; limit: number; pages: number }>('GET', '/prospects', { params }),
  getProspectInteractions: (id: string) => request<{ interactions: CrmInteraction[]; channel_status: Partial<Record<CrmChannel, CrmInteraction>> }>('GET', `/crm/prospects/${id}/interactions`),
  createProspectInteraction: (id: string, data: Pick<CrmInteraction, 'channel' | 'direction' | 'outcome'> & Partial<Pick<CrmInteraction, 'occurred_at' | 'notes' | 'follow_up_at'>>) =>
    request<{ interaction: CrmInteraction }>('POST', `/crm/prospects/${id}/interactions`, data),
  getRecordInteractions: (type: 'client' | 'enterprise', id: string) => request<{ interactions: CrmInteraction[]; channel_status: Partial<Record<CrmChannel, CrmInteraction>> }>('GET', `/crm/records/${type}/${id}/interactions`),
  createRecordInteraction: (type: 'client' | 'enterprise', id: string, data: Pick<CrmInteraction, 'channel' | 'direction' | 'outcome'> & Partial<Pick<CrmInteraction, 'occurred_at' | 'notes' | 'follow_up_at'>>) =>
    request<{ interaction: CrmInteraction }>('POST', `/crm/records/${type}/${id}/interactions`, data),
  getProspectMatches: (id: string) => request<{ matches: CrmMatch[] }>('GET', `/crm/prospects/${id}/matches`),
  decideProspectMatch: (id: string, match: Pick<CrmMatch, 'type' | 'id'>, decision: 'confirmed' | 'rejected') =>
    request<{ decision: unknown }>('POST', `/crm/prospects/${id}/matches/${match.type}/${match.id}`, { decision }),
  getCrmAnalytics: (window: '7d' | '30d' | 'all' = '30d') => request<CrmAnalytics>('GET', '/crm/analytics', { params: { window } }),
  getProspectCatalog: () => request<{ countries: Array<{ code: string; name: string }>; categories: string[]; locations: Array<{ country: string; province: string | null; city: string | null; zone: string | null }> }>('GET', '/prospects/catalog'),
  addProspectCategory: (name: string) => request<{ category: { name: string } }>('POST', '/prospects/categories', { name }),
  getManagedProspectCategories: () => request<{ categories: ProspectCategory[] }>('GET', '/prospects/categories/manage'),
  updateProspectCategory: (id: string, data: Partial<Pick<ProspectCategory, 'name' | 'active' | 'approved'>>) =>
    request<{ category: ProspectCategory }>('PATCH', `/prospects/categories/${id}`, data),
  mergeProspectCategories: (sourceId: string, targetId: string) =>
    request<{ merged: boolean }>('POST', '/prospects/categories/merge', { sourceId, targetId }),
  getProspectExportStatus: () => request<{ exists: boolean; generated_at: string | null; expires_at: string | null; refreshing: boolean; error: string | null }>('GET', '/prospects/export/status'),
  requestProspectsWorkbook: () => request<{ exists: boolean; generated_at: string | null; expires_at: string | null; refreshing: boolean; error: string | null }>('POST', '/prospects/export/request'),
  downloadProspectsWorkbook: () => request<Response>('GET', '/prospects/export/download', undefined, { noJsonParse: true }),
  getProspectJobs: () => request<{ jobs: ProspectJob[] }>('GET', '/prospects/jobs'),
  createProspectJob: (data: { name: string; category: string; business_type: string; country: string; province: string; city: string; zone: string; verification_mode: string; local_time: string }) => request<{ job: ProspectJob }>('POST', '/prospects/jobs', data),
  updateProspectJob: (id: string, data: Partial<{ name: string; category: string; business_type: string; country: string; province: string; city: string; zone: string; verification_mode: string; local_time: string }>) => request<{ job: ProspectJob }>('PATCH', `/prospects/jobs/${id}`, data),
  setProspectJobActive: (id: string, active: boolean) => request<{ job: ProspectJob }>('PATCH', `/prospects/jobs/${id}`, { active }),
  deleteProspectJob: (id: string) => request<{ deleted: boolean }>('DELETE', `/prospects/jobs/${id}`),
  runProspectJob: (id: string) => request<{ counts: { found: number; created: number; updated: number } }>('POST', `/prospects/jobs/${id}/run`),
  getProspectCampaigns: () => request<{ campaigns: ProspectCampaign[] }>('GET', '/prospects/campaigns'),
  getProspectWorkerStatus: () => request<ProspectWorkerMonitor>('GET', '/prospects/worker/status'),
  getProspectScrapeMetrics: async () => {
    const payload = await request<{ metrics: ProspectScrapeMetrics; generated_at: string }>('GET', '/prospects/scrape-metrics');
    const metrics = payload?.metrics;
    const windows = [metrics?.last_10_minutes, metrics?.last_hour, metrics?.last_day,
      metrics?.global_search?.last_10_minutes, metrics?.global_search?.last_hour, metrics?.global_search?.last_day];
    if (!metrics || !Array.isArray(metrics.workers) || !Array.isArray(metrics.active_workers)
      || !metrics.known_backlog || !metrics.stored_additions
      || ['last_10_minutes', 'last_hour', 'last_day'].some((key) =>
        typeof metrics.stored_additions[key as keyof typeof metrics.stored_additions] !== 'number')
      || windows.some((window) => !window || typeof window.reviewed !== 'number')) {
      throw new Error('Invalid scrape metrics response');
    }
    return payload;
  },
  getProspectCampaignStatus: (id: string) =>
    request<{ progress: ProspectCampaignProgress; latest_task: ProspectCampaignLatestTask | null }>('GET', `/prospects/campaigns/${id}/status`),
  getProspectCampaignCoverage: (id: string) =>
    request<ProspectCampaignCoverage>('GET', `/prospects/campaigns/${id}/coverage`),
  createProspectCampaign: (data: { name: string; countries?: string[] }) =>
    request<{ campaign: ProspectCampaign }>('POST', '/prospects/campaigns', data),
  expandProspectCampaign: (id: string) =>
    request<{ campaign: ProspectCampaign; addedCountries: string[] }>('POST', `/prospects/campaigns/${id}/expand-global`),
  updateProspectCampaign: (id: string, status: 'paused' | 'running' | 'cancelled') =>
    request<{ campaign: ProspectCampaign }>('PATCH', `/prospects/campaigns/${id}`, { status }),
  retryProspectCampaign: (id: string) => request<{ retried: boolean }>('POST', `/prospects/campaigns/${id}/retry`),
  getProspectCampaignTasks: (id: string) => request<{ tasks: ProspectCampaignTask[] }>('GET', `/prospects/campaigns/${id}/tasks`),
  createProspect: async (data: Partial<Prospect> & { name: string }) =>
    (await request<{ prospect: Prospect }>('POST', '/prospects', data)).prospect,
  searchGoogleProspects: async (data: { query: string; location?: string; limit?: number; verifyWebsite?: boolean }) =>
    (await request<{ prospects: Prospect[] }>('POST', '/prospects/search-google', data)).prospects,
  searchWebProspects: async (data: { query: string; businessType?: string; rubro?: string; country?: string; province?: string; city?: string; zone?: string; location?: string; verificationMode?: 'auto' | 'always' | 'never'; verifyWebsite?: boolean }) =>
    (await request<{ prospects: Prospect[] }>('POST', '/prospects/search-web', data)).prospects,
  verifyProspect: async (id: string) =>
    (await request<{ prospect: Prospect }>('POST', `/prospects/${id}/verify`)).prospect,
  updateProspect: async (id: string, data: Partial<Prospect>) =>
    (await request<{ prospect: Prospect }>('PUT', `/prospects/${id}`, data)).prospect,

  // Budgets
  getBudgets: () => request<Budget[]>('GET', '/budgets'),
  getBudget: (id: string) => request<Budget>(`GET`, `/budgets/${id}`),
  createBudget: (data: Omit<Budget, 'id'>) => request<Budget>('POST', '/budgets', data),
  updateBudget: (id: string, data: Partial<Budget>) => request<Budget>(`PUT`, `/budgets/${id}`, data),

  // Settings
  getSettings: async () => (await request<{ settings: UserSettings }>('GET', '/auth/settings')).settings,
  updateSettings: async (data: UserSettings) => (await request<{ settings: UserSettings }>('PATCH', '/auth/settings', data)).settings,
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('PATCH', '/auth/password', data),

  // Direct HTTP methods (for ad-hoc calls)
  get: <T>(path: string, config?: { useAuth?: boolean; noJsonParse?: boolean }) =>
    request<T>('GET', path, undefined, config),
  post: <T>(path: string, data?: any, config?: { useAuth?: boolean; noJsonParse?: boolean }) =>
    request<T>('POST', path, data, config),
  put: <T>(path: string, data?: any, config?: { useAuth?: boolean; noJsonParse?: boolean }) =>
    request<T>('PUT', path, data, config),
  patch: <T>(path: string, data?: any, config?: { useAuth?: boolean; noJsonParse?: boolean }) =>
    request<T>('PATCH', path, data, config),
  delete: <T>(path: string, config?: { useAuth?: boolean; noJsonParse?: boolean }) =>
    request<T>('DELETE', path, undefined, config),
};

// Types
interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  price?: number;
  duration_minutes: number;
  service_type: 'home' | 'remote' | 'hybrid';
  image_url?: string | null;
  image_alt?: string | null;
  marketing_title?: string | null;
  display_order?: number;
  is_featured?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'client' | 'technician' | 'system';
  sender_name?: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface InboxTicket {
  id: string;
  title: string;
  status: string;
  client_name: string | null;
  technician_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  unseen_ticket: boolean;
  updated_at: string;
}

interface Provider {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  tax_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  min_quantity: number;
  unit: string;
  location: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  client_id: string;
  ticket_id: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'check';
  transaction_id: string | null;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  enterprise_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Enterprise {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  tax_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  client_id: string;
  service_id: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'pending_client' | 'resolved' | 'closed';
  scheduled_date: string | null;
  scheduled_time: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  diagnosis_notes: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

export interface RemoteSupportSession {
  id: string;
  ticket_id: string;
  requested_by: string;
  assigned_to: string | null;
  consented_by: string | null;
  ended_by: string | null;
  status: 'requested' | 'consented' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  consented_at: string | null;
  started_at: string | null;
  ended_at: string | null;
}

interface Visit {
  id: string;
  ticket_id: string;
  technician_id: string;
  visit_date: string;
  visit_time: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: string;
  ticket_id: string | null;
  ticket_title?: string | null;
  client_id: string | null;
  client_full_name?: string | null;
  client_email?: string | null;
  enterprise_id: string | null;
  enterprise_name?: string | null;
  device_type: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'peripheral' | 'other';
  device_brand: string | null;
  device_model: string | null;
  serial_number: string | null;
  problem_description: string;
  diagnosis: string | null;
  solution_details: string | null;
  parts_used: string[] | null;
  parts_cost: number;
  labor_hours: number;
  labor_rate: number;
  labor_cost: number | null;
  total_cost: number | null;
  status: 'pending' | 'diagnosed' | 'in_repair' | 'ready' | 'delivered' | 'closed';
  technician_full_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  name: string;
  business_type: string | null;
  category: string | null;
  phone_google: string | null;
  phone_web: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  opening_hours: string | null;
  country_evidence_status: 'confirmed' | 'inferred' | 'conflict';
  country: string | null;
  city: string | null;
  zone: string | null;
  locality: string | null;
  province: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  contact_page_url: string | null;
  description: string | null;
  confidence_score: number | null;
  google_place_id: string | null;
  google_rating: number | null;
  reviews_count: number | null;
  source_engine: string | null;
  source_google: string | null;
  source_web: string | null;
  verification_status: 'pending' | 'verified' | 'incomplete' | 'no_email' | 'needs_review' | 'failed';
  contact_status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'follow_up';
  notes: string | null;
  last_verified_at: string | null;
  first_searched_at: string | null;
  last_searched_at: string | null;
  search_count: number;
  created_at: string;
  updated_at: string;
}

export type CrmChannel = 'email' | 'phone' | 'whatsapp' | 'web' | 'in_person' | 'other';
export type CrmDirection = 'inbound' | 'outbound';
export type CrmOutcome = 'attempted' | 'sent' | 'connected' | 'replied' | 'no_answer' | 'failed' | 'meeting_scheduled' | 'other';
export interface CrmInteraction {
  id: string;
  channel: CrmChannel;
  direction: CrmDirection;
  outcome: CrmOutcome;
  occurred_at: string;
  notes: string | null;
  follow_up_at: string | null;
  created_by_name?: string;
}
export interface CrmMatch {
  type: 'client' | 'enterprise';
  id: string;
  display_name: string;
  signals: Array<'email' | 'phone'>;
  country_verified: boolean;
}
export interface CrmAnalytics {
  window: '7d' | '30d' | 'all';
  generated_at: string;
  totals: { interactions: number; outbound: number; inbound: number; replies: number; unique_targets: number; prospects_contacted: number; followups_overdue: number };
  channels: Array<{ channel: CrmChannel; interactions: number }>;
  directions: Array<{ direction: CrmDirection; interactions: number }>;
  outcomes: Array<{ outcome: CrmOutcome; interactions: number }>;
  daily: Array<{ day: string; interactions: number }>;
}

export interface ProspectJob {
  id: string;
  name: string;
  category: string;
  business_type: string | null;
  country: string;
  province: string | null;
  city: string | null;
  zone: string | null;
  verification_mode: 'auto' | 'always' | 'never';
  active: boolean;
  local_time: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

export interface ProspectCategory {
  id: string;
  name: string;
  active: boolean;
  approved: boolean;
  source: string;
  usage_count: number;
  business_count: number;
}

export interface ProspectCampaign {
  id: string;
  name: string;
  countries: string[];
  status: 'running' | 'paused' | 'completed' | 'completed_with_errors' | 'cancelled';
  cycle: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  scanned_count: number;
  found_count: number;
  new_count: number;
  updated_count: number;
  next_run_at: string | null;
  last_error: string | null;
}

export interface ProspectCampaignCoverage {
  campaign_id: string;
  cycle: number;
  complete: boolean;
  countries: Array<{
    country: string;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    places: number;
    unparented_places: number;
    planned_sectors: number;
    sector_backlog: number | null;
    untranslated_categories: number;
    new_count: number;
    updated_count: number;
    repeated_count: number;
    with_phone: number;
    with_email: number;
    verified_contacts: number;
    country_conflicts: number;
    uncovered_reason: string | null;
  }>;
  attribution: { areas: string; businesses: string };
}

export interface ProspectCampaignProgress {
  phase: 'scanning' | 'processing' | 'cooling' | 'paused' | 'completed' | 'completed_with_errors' | 'cancelled';
  temperature_c: number | null;
  elapsed_seconds: number;
  remaining_seconds: number | null;
  remaining_count: number;
  rate_per_hour: number | null;
  eta_basis: 'last_10_minutes' | 'last_hour' | 'last_day' | null;
  eta_scope: 'partial' | 'campaign' | null;
  percent: number | null;
  scanned_count: number;
  processed_count: number;
  last_activity_at: string | null;
  countries: Array<{
    country: string;
    phase: 'preparing' | 'scanning' | 'processing' | 'completed';
    scanned_count: number;
    processed_count: number;
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    last_activity_at: string | null;
  }>;
}

export interface ProspectScrapeMetrics {
  total_prospects: number;
  stored_additions: { last_10_minutes: number; last_hour: number; last_day: number };
  last_10_minutes: { reviewed: number; new: number; updated: number; unchanged: number; per_hour: number };
  last_hour: { reviewed: number; new: number; updated: number; unchanged: number; per_hour: number };
  last_day: { reviewed: number; new: number; updated: number; unchanged: number; per_hour: number };
  global_search: {
    last_10_minutes: { reviewed: number; per_hour: number };
    last_hour: { reviewed: number; per_hour: number };
    last_day: { reviewed: number; per_hour: number };
  };
  workers: Array<{ worker_name: string; reviewed: number }>;
  active_workers: Array<{ worker_name: string; origin: string; started_at: string | null }>;
  known_backlog: {
    businesses_remaining: number;
    tasks_pending: number;
    tasks_running: number;
    discovering: boolean;
  };
}

export interface ProspectWorkerMonitor {
  worker: {
    owner: 'ubuntu' | 'mac' | null;
    requestedOwner: 'mac' | null;
    status: 'working' | 'handoff' | 'waiting' | 'idle' | 'conflict' | 'cooling' | 'thermal_unavailable' | 'catching_up';
    connected: boolean;
    session_started_at: string | null;
    checked_at: string;
  };
  current_task: null | {
    campaign_id: string;
    campaign_name: string;
    cycle: number;
    task_id: string;
    stage: string;
    task_status: string;
    country: string;
    province: string | null;
    city: string | null;
    zone: string | null;
    category: string | null;
    processed_count: number;
    new_count: number;
    updated_count: number;
    scan_replay_count: number;
    scan_examined_count: number | string;
    scan_heartbeat_at: string | null;
    task_updated_at: string;
  };
  progress: null | {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    processed: number;
    new_count: number;
    updated_count: number;
  };
}

export interface ProspectCampaignLatestTask {
  country: string;
  province: string | null;
  city: string | null;
  zone: string | null;
  category: string | null;
  stage: 'scan' | 'segment' | 'discover';
  status: 'running' | 'completed';
  updated_at: string;
}

export interface ProspectCampaignTask {
  id: string;
  country: string;
  stage: 'scan' | 'segment' | 'discover';
  province: string | null;
  city: string | null;
  zone: string | null;
  business_type: string | null;
  category: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  processed_count: number;
  new_count: number;
  updated_count: number;
  attempts: number;
  last_error: string | null;
}

export interface UserSettings {
  country: 'AR' | 'CL' | 'ES' | 'NL' | 'US';
  locale: 'es-AR' | 'es-CL' | 'es-ES' | 'nl-NL' | 'en-US';
  email_notifications: boolean;
}

export interface AdminRecent {
  clients: Array<{ id: string; name: string; email: string; city: string | null; created_at: string }>;
  tickets: Array<{ id: string; title: string; status: string; priority: string; customer_name: string; created_at: string }>;
  enterprises: Array<{ id: string; name: string; contact_name: string; contact_email: string; city: string | null; created_at: string }>;
}

interface Budget {
  id: string;
  client_id: string;
  ticket_id: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export default api;

export type StaffTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'done';
export type StaffTaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface MarketingOverview {
  contacts: { total: number; active: number };
  drafts: number;
  queued: number;
  deliveries: { sent: number; bounced: number; failed: number };
  delivery: { provider: string; ready: boolean; hourly_limit: number; daily_limit: number; reason: string; last_bounce_sync_at: string | null; last_bounce_sync_error: string | null };
}

export interface MarketingContact {
  id: string;
  email: string;
  name: string;
  country: string;
  locale: string;
  consent_source: string;
  consent_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  country: string;
  locale: string | null;
  status: 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface MarketingDelivery {
  id: string;
  contact_id: string;
  status: 'queued' | 'cancelled' | 'sent' | 'failed' | 'bounced' | 'replied' | 'unsubscribed';
  scheduled_at: string;
  created_at: string;
  email?: string;
  name?: string;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  progress_notes: string;
  assigned_to: string;
  assignee_name?: string;
  assignee_role?: string;
  priority: StaffTaskPriority;
  status: StaffTaskStatus;
  starts_at: string | null;
  due_at: string | null;
  duration_minutes: number | null;
  ticket_id: string | null;
  visit_id: string | null;
}

export interface StaffTaskInput {
  title: string;
  description?: string;
  assigned_to: string;
  priority?: StaffTaskPriority;
  starts_at?: string | null;
  due_at?: string | null;
  duration_minutes?: number | null;
  ticket_id?: string | null;
  visit_id?: string | null;
}

export interface StaffCalendarEvent {
  id: string;
  kind: 'task' | 'visit';
  title: string;
  start: string;
  end: string;
  assignee_id: string;
  status: string;
  href: string;
}

export interface StaffAssignee {
  id: string;
  full_name: string;
  role_name: string;
}
