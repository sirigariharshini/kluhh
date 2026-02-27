// CardiiiiX/services/apiClient.ts
// Frontend HTTP client for backend API communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    statusCode?: number;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    private async request<T>(
        method: string,
        endpoint: string,
        body?: any
    ): Promise<ApiResponse<T>> {
        try {
            const url = `${API_URL}${endpoint}`;
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                return {
                    error: errorData.error || `HTTP ${response.status}`,
                    statusCode: response.status,
                };
            }

            const data = await response.json();
            return { data };
        } catch (error: any) {
            return { error: error.message || 'Request failed' };
        }
    }

    // Auth endpoints
    async signup(email: string, password: string, fullName?: string) {
        return this.request<{ user: any; session: any }>(
            'POST',
            '/auth/signup',
            { email, password, fullName }
        );
    }

    async signin(email: string, password: string) {
        return this.request<{ user: any; session: any }>(
            'POST',
            '/auth/signin',
            { email, password }
        );
    }

    async getCurrentUser() {
        return this.request('GET', '/auth/me');
    }

    async logout() {
        return this.request('POST', '/auth/logout');
    }

    // Chat endpoints
    async createChat(title?: string, medicalContext?: string) {
        return this.request<any>(
            'POST',
            '/chats',
            { title, medical_context: medicalContext }
        );
    }

    async getChats(limit = 20) {
        return this.request<any[]>(
            'GET',
            `/chats?limit=${limit}`
        );
    }

    async sendMessage(chatId: string, content: string, medicalContext?: string) {
        return this.request<any>(
            'POST',
            `/chats/${chatId}/messages`,
            { content, medical_context: medicalContext }
        );
    }

    // Simple chat endpoint for direct messages (no chat history needed)
    async askAI(message: string) {
        return this.request<{ reply: string; sessionId: string }>(
            'POST',
            '/chat',
            { message }
        );
    }

    async deleteChat(chatId: string) {
        return this.request('DELETE', `/chats/${chatId}`);
    }

    // Report endpoints
    async uploadReport(file: File, title: string) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);

            const url = `${API_URL}/reports/upload`;
            const headers: HeadersInit = {};

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                return { error: errorData.error };
            }

            const data = await response.json();
            return { data };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async getReports(limit = 50) {
        return this.request<any[]>('GET', `/reports?limit=${limit}`);
    }

    async getReport(reportId: string) {
        return this.request('GET', `/reports/${reportId}`);
    }

    async analyzeReport(reportId: string) {
        return this.request<any>('POST', `/reports/${reportId}/analyze`);
    }

    async deleteReport(reportId: string) {
        return this.request('DELETE', `/reports/${reportId}`);
    }

    async getHighRiskReports(limit = 10) {
        return this.request<any[]>('GET', `/reports/stats/high-risk?limit=${limit}`);
    }

    // Health endpoints
    async addHealthMetric(
        heartRate?: number,
        oxygen?: number,
        temperature?: number,
        bloodPressure?: string,
        notes?: string
    ) {
        return this.request<any>('POST', '/health', {
            heartRate,
            oxygen,
            temperature,
            bloodPressure,
            notes,
        });
    }

    async getHealthMetrics(limit = 100) {
        return this.request<any[]>('GET', `/health?limit=${limit}`);
    }

    async getHealthSummary() {
        return this.request<any>('GET', '/health/stats/summary');
    }

    async deleteHealthMetric(metricId: string) {
        return this.request('DELETE', `/health/${metricId}`);
    }
}

export const apiClient = new ApiClient();
