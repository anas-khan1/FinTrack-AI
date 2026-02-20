# AWS Architecture — FinTrack AI

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser] -->|HTTPS| B[CloudFront CDN]
    end

    subgraph "Frontend Hosting"
        B --> C[S3 Bucket<br/>Static Assets]
    end

    subgraph "API Layer"
        A -->|REST API| D[API Gateway]
        D --> E[Lambda Functions]
    end

    subgraph "Auth Layer"
        E --> F[Cognito User Pool]
        F -->|JWT Token| A
    end

    subgraph "Data Layer"
        E --> G[DynamoDB<br/>Users Table]
        E --> H[DynamoDB<br/>Expenses Table]
        E --> I[DynamoDB<br/>Income Table]
        E --> J[DynamoDB<br/>Budgets Table]
    end

    subgraph "AI Layer"
        E --> K[AI Advisor<br/>Lambda Function]
        K -->|Pattern Analysis| H
        K -->|Budget Check| J
    end

    subgraph "Monitoring"
        E --> L[CloudWatch<br/>Logs & Metrics]
        L --> M[CloudWatch<br/>Alarms]
    end

    style A fill:#6366f1,stroke:#8b5cf6,color:#fff
    style B fill:#f59e0b,stroke:#d97706,color:#fff
    style C fill:#22c55e,stroke:#16a34a,color:#fff
    style D fill:#3b82f6,stroke:#2563eb,color:#fff
    style E fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style F fill:#ec4899,stroke:#db2777,color:#fff
    style G fill:#06b6d4,stroke:#0891b2,color:#fff
    style H fill:#06b6d4,stroke:#0891b2,color:#fff
    style I fill:#06b6d4,stroke:#0891b2,color:#fff
    style J fill:#06b6d4,stroke:#0891b2,color:#fff
    style K fill:#f97316,stroke:#ea580c,color:#fff
    style L fill:#64748b,stroke:#475569,color:#fff
    style M fill:#ef4444,stroke:#dc2626,color:#fff
```

## DynamoDB Table Schemas

### Users Table
| Attribute | Type | Key |
|-----------|------|-----|
| id | String | Partition Key |
| email | String | GSI Partition |
| name | String | — |
| password | String | — |
| currency | String | — |
| created_at | String | — |

### Expenses Table
| Attribute | Type | Key |
|-----------|------|-----|
| id | String | Partition Key |
| user_id | String | GSI Partition |
| date | String | GSI Sort Key |
| amount | Number | — |
| category | String | — |
| description | String | — |

### Income Table
| Attribute | Type | Key |
|-----------|------|-----|
| id | String | Partition Key |
| user_id | String | GSI Partition |
| date | String | GSI Sort Key |
| amount | Number | — |
| source | String | — |

### Budgets Table
| Attribute | Type | Key |
|-----------|------|-----|
| id | String | Partition Key |
| user_id | String | GSI Partition |
| month | String | — |
| category | String | — |
| amount | Number | — |

## Data Flow

1. **User Auth**: Browser → API Gateway → Cognito → JWT Token → Browser
2. **Add Expense**: Browser → API Gateway → Lambda → DynamoDB → Response
3. **AI Analytics**: Browser → API Gateway → Lambda → Read DynamoDB → Pattern Analysis → Recommendations
4. **Dashboard**: Browser → CloudFront → S3 (static) + API Gateway → Lambda → DynamoDB
