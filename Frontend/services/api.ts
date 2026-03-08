// API Configuration and Services for NexaSolft Treasury

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types
export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'GERANT' | 'CAISSIER';
    role_display: string;
    branch?: number;
    branch_name?: string;
    phone?: string;
    is_active: boolean;
    preferred_language: string;
    date_joined: string;
    last_login?: string;
}

export interface Branch {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    is_active: boolean;
    user_count?: number;
    created_at?: string;
}


export interface Folio {
    id: number;
    code: string;
    branch?: number;
    branch_name?: string;
    opened_by: number;
    opened_by_name: string;
    opened_at: string;
    opening_balance: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSURE_PROPOSED' | 'CLOSED' | 'ARCHIVED';
    closure_proposed_by?: number;
    closure_proposed_by_name?: string;
    closure_proposed_at?: string;
    closure_notes?: string;
    closed_by?: number;
    closed_by_name?: string;
    closed_at?: string;
    closing_balance?: string;
    actual_physical_balance?: string;
    running_balance: number;
    variance?: number;
    transaction_count: number;
    notes?: string;
    cash_counts?: CashCount[];
    assigned_users?: number[];
    assigned_user_names?: { id: number; name: string; role: string }[];
}

export interface Transaction {
    id: number;
    folio: number;
    folio_code: string;
    type: 'RECEIPT' | 'PAYMENT';
    type_display: string;
    amount: string;
    currency: string;
    payment_method: string;
    payment_method_display: string;
    reference?: string;
    description?: string;
    created_by: number;
    created_by_name: string;
    created_at: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOID';
    status_display: string;
    requires_approval: boolean;
    approved_by?: number;
    approved_by_name?: string;
    is_void: boolean;
    void_reason?: string;
    void_requested_by?: number;
    void_requested_by_name?: string;
    receipt_number?: string;
    client_name?: string;
    supplier_name?: string;
    debit_account?: number;
    credit_account?: number;
}

export interface Settlement {
    id: number;
    folio: number;
    folio_code: string;
    party_type: 'CLIENT' | 'SUPPLIER';
    party_type_display: string;
    party_name: string;
    amount: string;
    method?: string;
    reference?: string;
    status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    status_display: string;
    created_by: number;
    created_by_name: string;
    created_at: string;
    proposed_at?: string;
    approved_by?: number;
    approved_by_name?: string;
    approved_at?: string;
    rejection_reason?: string;
    notes?: string;
    invoice_numbers: string[];
}

export interface Invoice {
    id: number;
    invoice_number: string;
    invoice_type: 'CLIENT' | 'SUPPLIER';
    type_display: string;
    party_name: string;
    total_amount: string;
    paid_amount: string;
    remaining_amount: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
    status_display: string;
    is_overdue: boolean;
    created_at: string;
    due_date?: string;
    notes?: string;
}

export interface Notification {
    id: number;
    notification_type: string;
    type_display: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    priority_display: string;
    title: string;
    message: string;
    is_read: boolean;
    read_at?: string;
    action_url?: string;
    created_at: string;
}

export interface AuditLog {
    id: number;
    user?: number;
    user_name?: string;
    action: string;
    object_type?: string;
    object_id?: number;
    object_repr?: string;
    before_state?: Record<string, unknown>;
    after_state?: Record<string, unknown>;
    details?: string;
    reason?: string;
    ip_address?: string;
    timestamp: string;
}

export interface SystemSettings {
    id: number;
    key: string;
    value: Record<string, any>;
    description?: string;
    category?: string;
    updated_by?: number;
    updated_at: string;
}

export interface Account {
    id: number;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
    is_active: boolean;
    parent?: number;
    branch?: number;
}

export interface CashDenomination {
    id: number;
    value: number;
    currency: string;
    is_coin: boolean;
    is_active: boolean;
}

export interface CashCount {
    id: number;
    folio: number;
    denomination: number;
    denomination_value: number;
    currency: string;
    quantity: number;
    total: number;
}

export interface DashboardData {
    total_liquidity: number;
    open_folios_count: number;
    today_receipts: number;
    today_payments: number;
    pending_approvals: number;
    today_transactions_count: number;
    branch_name?: string;
    users_count?: number;
    security_alerts_24h?: number;
    pending_settlements?: Settlement[];
    pending_closure_requests?: number;
    caissiers_performance?: { created_by__username: string; created_by__first_name: string; count: number; total: number }[];
    current_folio?: Folio | null;
    opening_balance?: number;
    running_balance?: number;
    last_receipt_number?: string;
    recent_transactions?: Transaction[];
    today_registered_count?: number;
    processing_amount?: number;
    recent_settlements?: Settlement[];
    recent_invoices?: Invoice[];
    cash_flow_data?: { name: string; receipts: number; payments: number }[];
    payment_methods_data?: { name: string; value: number }[];
    [key: string]: unknown;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
}

// Helper functions
function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
        // Unauthorized - clear token and redirect
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        throw new Error('Session expirée');
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType || 'unknown'}. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.detail || 'Une erreur est survenue');
    }

    return data;
}

// Auth API
export const authApi = {
    login: async (username: string, password: string): Promise<{ success: boolean; token: string; user: User; message?: string }> => {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        // Don't use handleResponse here — it redirects on 401 which is a valid login failure response
        const data = await response.json();
        return data;
    },

    logout: async (): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
        const response = await fetch(`${API_BASE_URL}/auth/me/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
        const response = await fetch(`${API_BASE_URL}/auth/me/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    changePassword: async (data: { current_password: string; new_password: string }): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};


// Dashboard API
export const dashboardApi = {
    getAdminDashboard: async (): Promise<DashboardData> => {
        const response = await fetch(`${API_BASE_URL}/dashboard/admin/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getGerantDashboard: async (): Promise<DashboardData> => {
        const response = await fetch(`${API_BASE_URL}/dashboard/gerant/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCaissierDashboard: async (): Promise<DashboardData> => {
        const response = await fetch(`${API_BASE_URL}/dashboard/caissier/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

};

// Folio API
export const folioApi = {
    list: async (params?: { status?: string }): Promise<Folio[]> => {
        const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
        const response = await fetch(`${API_BASE_URL}/folios/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    get: async (id: number): Promise<Folio> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: { opening_balance: number; notes?: string }): Promise<{ success: boolean; folio: Folio; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/folios/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    proposeClosure: async (id: number, data: { notes?: string; actual_physical_balance?: number; cash_counts?: { denomination: number; quantity: number }[] }): Promise<{ success: boolean; folio: Folio; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/propose_closure/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    approveClosure: async (id: number, data?: { notes?: string; actual_physical_balance?: number }): Promise<{ success: boolean; folio: Folio; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/approve_closure/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data || {}),
        });
        return handleResponse(response);
    },

    rejectClosure: async (id: number, reason: string): Promise<{ success: boolean; folio: Folio; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/reject_closure/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        return handleResponse(response);
    },

    directClose: async (id: number, data?: { notes?: string; actual_physical_balance?: number }): Promise<{ success: boolean; folio: Folio; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/direct_close/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data || {}),
        });
        return handleResponse(response);
    },

    assignUsers: async (id: number, userIds: number[]): Promise<{ success: boolean; folio: Folio; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/assign_users/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ user_ids: userIds }),
        });
        return handleResponse(response);
    },

    printSummary: async (id: number): Promise<Blob> => {
        const response = await fetch(`${API_BASE_URL}/folios/${id}/print_summary/`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Erreur lors de la génération du PDF');
        return response.blob();
    },
};

// Transaction API
export const transactionApi = {
    list: async (params?: { folio?: number; type?: string; status?: string; date_from?: string; date_to?: string }): Promise<Transaction[]> => {
        const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
        const response = await fetch(`${API_BASE_URL}/transactions/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    get: async (id: number): Promise<Transaction> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: {
        folio: number;
        type: 'RECEIPT' | 'PAYMENT';
        amount: number;
        payment_method: string;
        reference?: string;
        description?: string;
        client_name?: string;
        supplier_name?: string;
    }): Promise<{ success: boolean; transaction: Transaction; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: number, data: Partial<Transaction>): Promise<{ success: boolean; transaction: Transaction; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    void: async (id: number, reason: string): Promise<{ success: boolean; transaction?: Transaction; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}/void/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        return handleResponse(response);
    },

    approveVoid: async (id: number): Promise<{ success: boolean; transaction: Transaction; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}/approve_void/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    rejectVoid: async (id: number, reason: string): Promise<{ success: boolean; transaction: Transaction; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}/reject_void/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        return handleResponse(response);
    },

    printReceipt: async (id: number): Promise<Blob> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}/print_receipt/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Erreur lors de la génération du reçu');
        return response.blob();
    },

    export: async (params?: Record<string, string>): Promise<Blob> => {
        const queryString = params ? new URLSearchParams(params).toString() : '';
        const response = await fetch(`${API_BASE_URL}/transactions/export/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Erreur lors de l\'export');
        return response.blob();
    },
};

// Settlement API
export const settlementApi = {
    list: async (params?: { status?: string; party_type?: string }): Promise<Settlement[]> => {
        const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
        const response = await fetch(`${API_BASE_URL}/settlements/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    get: async (id: number): Promise<Settlement> => {
        const response = await fetch(`${API_BASE_URL}/settlements/${id}/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: {
        folio: number;
        party_type: 'CLIENT' | 'SUPPLIER';
        party_name: string;
        amount: number;
        method?: string;
        reference?: string;
        notes?: string;
        invoice_ids?: number[];
    }): Promise<{ success: boolean; settlement: Settlement; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/settlements/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    propose: async (id: number): Promise<{ success: boolean; settlement: Settlement; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/settlements/${id}/propose/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    approve: async (id: number): Promise<{ success: boolean; settlement: Settlement; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/settlements/${id}/approve/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    reject: async (id: number, reason: string): Promise<{ success: boolean; settlement: Settlement; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/settlements/${id}/reject/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason }),
        });
        return handleResponse(response);
    },
};

// Invoice API
export const invoiceApi = {
    list: async (params?: { type?: string; status?: string; open_only?: boolean }): Promise<Invoice[]> => {
        const queryParams: Record<string, string> = {};
        if (params?.type) queryParams.type = params.type;
        if (params?.status) queryParams.status = params.status;
        if (params?.open_only) queryParams.open_only = 'true';

        const queryString = Object.keys(queryParams).length ? new URLSearchParams(queryParams).toString() : '';
        const response = await fetch(`${API_BASE_URL}/invoices/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    get: async (id: number): Promise<Invoice> => {
        const response = await fetch(`${API_BASE_URL}/invoices/${id}/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: {
        invoice_number: string;
        invoice_type: 'CLIENT' | 'SUPPLIER';
        party_name: string;
        total_amount: number;
        due_date?: string;
        notes?: string;
    }): Promise<Invoice> => {
        const response = await fetch(`${API_BASE_URL}/invoices/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};

// Notification API
export const notificationApi = {
    list: async (): Promise<NotificationData[]> => {
        const response = await fetch(`${API_BASE_URL}/notifications/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getUnreadCount: async (): Promise<{ count: number }> => {
        const response = await fetch(`${API_BASE_URL}/notifications/unread_count/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    markRead: async (id: number): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/mark_read/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    markAllRead: async (): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/notifications/mark_all_read/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// User API (Admin only)
export const userApi = {
    list: async (params?: { role?: string; branch?: number; is_active?: boolean }): Promise<User[]> => {
        const queryParams: Record<string, string> = {};
        if (params?.role) queryParams.role = params.role;
        if (params?.branch) queryParams.branch = params.branch.toString();
        if (params?.is_active !== undefined) queryParams.is_active = params.is_active.toString();

        const queryString = Object.keys(queryParams).length ? new URLSearchParams(queryParams).toString() : '';
        const response = await fetch(`${API_BASE_URL}/users/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    get: async (id: number): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: {
        username: string;
        password: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
        branch?: number;
        phone?: string;
    }): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: number, data: Partial<User>): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    resetPassword: async (id: number, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}/reset_password/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ new_password: newPassword }),
        });
        return handleResponse(response);
    },

    toggleActive: async (id: number): Promise<{ success: boolean; is_active: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}/toggle_active/`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// Branch API (Admin only)
export const branchApi = {
    list: async (): Promise<Branch[]> => {
        const response = await fetch(`${API_BASE_URL}/branches/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    get: async (id: number): Promise<Branch> => {
        const response = await fetch(`${API_BASE_URL}/branches/${id}/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: { code: string; name: string; address?: string; phone?: string; is_active?: boolean }): Promise<Branch> => {
        const response = await fetch(`${API_BASE_URL}/branches/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: number, data: Partial<Branch>): Promise<Branch> => {
        const response = await fetch(`${API_BASE_URL}/branches/${id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    delete: async (id: number): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/branches/${id}/`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Cannot delete branch');
        }
        return { success: true };
    },
};

// Notification Data Interface
export interface NotificationData {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    type_display?: string;
    priority: string;
    priority_display?: string;
    is_read: boolean;
    action_url: string | null;
    action_data?: Record<string, any>;
    created_at: string;
}

// System Settings API
export const settingsApi = {
    getPublic: async (): Promise<{ company: { name: string; logo: string; } }> => {
        const response = await fetch(`${API_BASE_URL}/public-settings/`);
        return handleResponse(response);
    },

    list: async (): Promise<SystemSettings[]> => {
        const response = await fetch(`${API_BASE_URL}/settings/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    create: async (data: { key: string; value: Record<string, any>; description?: string }): Promise<SystemSettings> => {
        const response = await fetch(`${API_BASE_URL}/settings/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    update: async (id: number, data: Partial<SystemSettings>): Promise<SystemSettings> => {
        const response = await fetch(`${API_BASE_URL}/settings/${id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};


// Audit Log API
export const auditLogApi = {
    list: async (params?: { action?: string; user?: number; date_from?: string; date_to?: string }): Promise<AuditLog[]> => {
        const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
        const response = await fetch(`${API_BASE_URL}/audit-logs/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

// Accounting API
export const accountApi = {
    list: async (params?: { type?: string; is_active?: boolean }): Promise<Account[]> => {
        const queryParams: Record<string, string> = {};
        if (params?.type) queryParams.type = params.type;
        if (params?.is_active !== undefined) queryParams.is_active = params.is_active.toString();

        const queryString = Object.keys(queryParams).length ? new URLSearchParams(queryParams).toString() : '';
        const response = await fetch(`${API_BASE_URL}/accounts/${queryString ? `?${queryString}` : ''}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    }
};

export const cashDenominationApi = {
    list: async (): Promise<CashDenomination[]> => {
        const response = await fetch(`${API_BASE_URL}/cash-denominations/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    }
};

// Utility to download file
export function downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

export const reportPdfApi = {
    downloadPDF: async (params: { date_from?: string; date_to?: string; type?: string }): Promise<Blob> => {
        const query = new URLSearchParams();
        if (params.date_from) query.set('date_from', params.date_from);
        if (params.date_to) query.set('date_to', params.date_to);
        if (params.type) query.set('type', params.type);

        const response = await fetch(`${API_BASE_URL}/reports/pdf/?${query.toString()}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error('Erreur lors de la génération du PDF');
        }
        return response.blob();
    }
};

