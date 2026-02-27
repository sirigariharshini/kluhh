# Frontend Integration Guide

Complete guide for integrating the CardiiiiX frontend with the production-grade backend API.

## Overview

The frontend communicates with the backend via RESTful API endpoints. All communication is authenticated using JWT tokens from Supabase Auth.

## Environment Setup

Ensure `.env` file in `CardiiiiX/` contains:

```env
VITE_SUPABASE_URL=https://fuhawgevwdjjnrwclvgg.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
```

## API Client Usage

Import the `apiClient` service in any component:

```typescript
import { apiClient } from '../services/apiClient';

// Set auth token after login (from Supabase session)
apiClient.setToken(session.access_token);

// Use API methods
const response = await apiClient.getChats();
if (response.error) {
  console.error('Error:', response.error);
} else {
  console.log('Chats:', response.data);
}
```

## Component Updates

### ChatAssistant.tsx - Backend Integration

Replace the `handleSend` function to use backend API:

```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  // Add user message to UI
  const userMessage: Message = { role: 'user', text: input, timestamp: new Date() };
  setMessages(prev => [...prev, userMessage]);
  const userInput = input;
  setInput('');
  setIsLoading(true);

  try {
    // Send to backend
    const response = await apiClient.sendMessage(
      currentChatId,
      userInput,
      medicalContext
    );

    if (response.error) {
      throw new Error(response.error);
    }

    // Add AI response
    const botMessage: Message = {
      role: 'model',
      text: response.data.assistantMessage.content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);

  } catch (error: any) {
    console.error('Error:', error);
    const errorMsg = error.message || 'An error occurred';
    setMessages(prev => [...prev, {
      role: 'model',
      text: `❌ Error: ${errorMsg}`,
      timestamp: new Date()
    }]);
  } finally {
    setIsLoading(false);
  }
};
```

### ReportAnalyzer.tsx - File Upload Integration

```typescript
import { apiClient } from '../services/apiClient';

const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsLoading(true);
  try {
    // Upload report
    const uploadResponse = await apiClient.uploadReport(file, file.name);
    
    if (uploadResponse.error) {
      throw new Error(uploadResponse.error);
    }

    const reportId = uploadResponse.data.reportId;

    // Analyze report
    const analysisResponse = await apiClient.analyzeReport(reportId);
    
    if (analysisResponse.error) {
      throw new Error(analysisResponse.error);
    }

    // Display results
    setAnalysisResult(analysisResponse.data);

  } catch (error: any) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Dashboard.tsx - Health Metrics

```typescript
import { apiClient } from '../services/apiClient';

useEffect(() => {
  const fetchHealthData = async () => {
    const response = await apiClient.getHealthMetrics(50);
    if (!response.error && response.data) {
      // Transform backend data to match frontend
      const readings = response.data.map(m => ({
        id: m.id,
        bpm: m.heart_rate,
        spo2: m.oxygen_level,
        timestamp: new Date(m.created_at),
        created_at: m.created_at
      }));
      setHealthReadings(readings);
    }
  };

  fetchHealthData();
}, []);

// Add new health reading
const handleAddReading = async (heartRate: number, oxygen: number) => {
  const response = await apiClient.addHealthMetric(heartRate, oxygen);
  
  if (!response.error) {
    // Refresh health data
    await fetchHealthData();
  }
};
```

## Authentication Flow

### 1. Signup

```typescript
import { apiClient } from '../services/apiClient';
import { supabase } from '../services/supabaseService';

const handleSignup = async (email: string, password: string, fullName: string) => {
  try {
    // Signup via backend (which creates Supabase user)
    const response = await apiClient.signup(email, password, fullName);
    
    if (response.error) {
      throw new Error(response.error);
    }

    // Set token for future requests
    apiClient.setToken(response.data.session.access_token);

    // Also set in Supabase client
    await supabase.auth.refreshSession
    
    // Redirect to dashboard
    navigate('/dashboard');

  } catch (error) {
    setError(error.message);
  }
};
```

### 2. Login

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await apiClient.signin(email, password);
    
    if (response.error) {
      throw new Error(response.error);
    }

    // Set token
    apiClient.setToken(response.data.session.access_token);
    
    navigate('/dashboard');

  } catch (error) {
    setError(error.message);
  }
};
```

### 3. Token Refresh

```typescript
// In your app initialization or interceptor
const refreshToken = async () => {
  const { data: session } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    apiClient.setToken(session.access_token);
  }
};

// Call on app mount
useEffect(() => {
  refreshToken();
  
  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session) {
        apiClient.setToken(session.access_token);
      } else {
        apiClient.setToken(null);
      }
    }
  );

  return () => subscription?.unsubscribe();
}, []);
```

## Error Handling

All API methods return:

```typescript
interface ApiResponse<T> {
  data?: T;        // Success data
  error?: string;  // Error message
  statusCode?: number; // HTTP status
}
```

Always check for `error` property:

```typescript
const response = await apiClient.getChats();

if (response.error) {
  if (response.statusCode === 401) {
    // Unauthorized - refresh token
    refreshToken();
  } else if (response.statusCode === 404) {
    // Not found
    console.error('Resource not found');
  } else {
    console.error('Error:', response.error);
  }
} else {
  // Use response.data
  console.log(response.data);
}
```

## Chat System

### Create Chat

```typescript
const createNewChat = async () => {
  const response = await apiClient.createChat(
    'New Chat',
    'Type 2 diabetes patient'
  );

  if (!response.error) {
    setChatId(response.data.id);
  }
};
```

### Send Message

```typescript
const response = await apiClient.sendMessage(
  chatId,
  'What should I eat for breakfast?',
  'Diabetic, watching carbs'
);

// Response contains:
// {
//   userMessage: { id, content, created_at, ... },
//   assistantMessage: { id, content, created_at, ... }
// }
```

### Load Chat History

```typescript
const loadChatHistory = async (chatId: string) => {
  const response = await apiClient.getChats();
  const chat = response.data?.find(c => c.id === chatId);
  // Chat includes recent messages in its data
};
```

## Report Management

### Upload Medical Document

```typescript
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const response = await apiClient.uploadReport(file, 'Lab Results');
  
  // Returns: { reportId, extractedText, confidence, processingTime }
  console.log('Extracted text:', response.data.extractedText);
}
```

### Analyze Report

```typescript
const response = await apiClient.analyzeReport(reportId);

// Returns:
// {
//   riskScore: 65,
//   abnormalMetrics: [{ name, value, unit, severity }, ...],
//   emergencyFlags: ['CRITICAL: ...'],
//   recommendations: ['...'],
//   summary: 'markdown formatted analysis',
//   aiAnalysis: '...'
// }

displayRiskScore(response.data.riskScore);
createRecommendationsList(response.data.recommendations);
```

### Get High-Risk Reports

```typescript
const response = await apiClient.getHighRiskReports(10);

// Filter and display reports with risk_score >= 70
response.data?.forEach(report => {
  if (report.risk_score >= 70) {
    addHighRiskAlert(report);
  }
});
```

## Health Metrics

### Add New Reading

```typescript
const response = await apiClient.addHealthMetric(
  72,      // heartRate
  98,      // oxygen
  37.2,    // temperature
  '120/80' // bloodPressure
);

// Automatically updates Dashboard
```

### Get Weekly Summary

```typescript
const response = await apiClient.getHealthSummary();

// Returns:
// {
//   latest: { heartRate, oxygen, temperature, ... },
//   weeklyAverage: { heartRate, oxygen, temperature },
//   totalReadings: 45
// }

updateDashboardMetrics(response.data);
```

## Real-Time Updates (Optional)

For chat messages and health metrics, implement Supabase real-time subscriptions:

```typescript
import { supabase } from '../services/supabaseService';

useEffect(() => {
  // Subscribe to new messages in chat
  const subscription = supabase
    .channel(`chat_${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload) => {
        // Add new message to UI
        setMessages(prev => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [chatId]);
```

## Common Patterns

### Protected Route

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

export function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate('/login');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return children;
}
```

### Error Boundary

```typescript
export function ErrorBoundary({ children }) {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold text-red-700">{error}</h3>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return children;
}
```

## Debugging

Enable request logging:

```typescript
// Add to apiClient.ts in the request method
console.log(`[API] ${method} ${endpoint}`, { body, response });
```

Check network requests in browser DevTools → Network tab.

## Performance Tips

1. **Pagination**: Use `limit` parameter for large datasets
2. **Caching**: Store reports/chats in localStorage temporarily
3. **Lazy Loading**: Load reports only when needed
4. **Debouncing**: Debounce health metric submissions

```typescript
import { debounce } from 'lodash';

const debouncedAddMetric = debounce(async (hr, o2) => {
  await apiClient.addHealthMetric(hr, o2);
}, 2000);
```

## Testing

Mock API responses for development:

```typescript
// mock-api.ts
export const mockApiClient = {
  getChats: async () => ({
    data: [
      { id: '1', title: 'First Chat', created_at: new Date() }
    ]
  }),
  sendMessage: async () => ({
    data: {
      userMessage: { content: 'Hello' },
      assistantMessage: { content: 'Hi there!' }
    }
  })
};
```

## Support

- Backend API docs: [Backend README.md](../backend/README.md)
- TypeScript types: Check `CardiiiiX/services/apiClient.ts`
- Supabase docs: https://supabase.com/docs
- Troubleshooting: See backend README troubleshooting section
