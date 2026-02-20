# FinTrack AI — Smart Expense & Budget Planner

> 🏆 Built for **Prompt Builder 2026 — AWS Cloud Innovation Hackathon**

A full-stack personal finance management platform with AI-powered budgeting recommendations, real-time analytics, and cloud-native architecture.

## ✨ Features

- **📊 Dashboard** — Financial overview with interactive Chart.js charts
- **💸 Expense Tracking** — Add, categorize, filter, and manage expenses
- **💵 Income Tracking** — Track multiple income sources
- **🎯 Budget Planner** — Set category budgets with visual progress bars
- **🤖 AI Recommendations** — Smart spending advice powered by pattern analysis
- **🏥 Financial Health Score** — 0-100 score based on savings, budget adherence, and diversification
- **🔒 Secure Auth** — JWT + bcrypt authentication
- **📱 Responsive** — Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Chart.js |
| Backend | Node.js, Express.js |
| Database | NeDB (embedded, DynamoDB-ready schema) |
| Auth | JWT + bcrypt |
| AI Engine | Rule-based pattern analysis |
| Security | Helmet, CORS, Rate Limiting |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

## ☁️ AWS Architecture

See [docs/aws-deployment.md](docs/aws-deployment.md) for full AWS free-tier deployment guide.

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Cognito | Authentication | 50K MAU |
| DynamoDB | Database | 25 GB, 25 RCU/WCU |
| Lambda | Backend | 1M requests/month |
| API Gateway | REST API | 1M calls/month |
| S3 | Static Hosting | 5 GB |
| CloudFront | CDN | 1 TB/month |
| CloudWatch | Monitoring | 10 metrics |

## 📁 Project Structure

```
FinTrack-AI/
├── server.js              # Express entry point
├── database/db.js         # NeDB database setup
├── middleware/auth.js      # JWT auth middleware
├── routes/
│   ├── auth.js            # Login/signup
│   ├── expenses.js        # Expense CRUD
│   ├── income.js          # Income CRUD
│   ├── budgets.js         # Budget management
│   └── analytics.js       # Analytics & AI
├── services/ai-advisor.js # AI recommendation engine
├── public/                # Frontend
│   ├── index.html         # Landing page
│   ├── dashboard.html     # Main dashboard
│   ├── expenses.html      # Expense tracker
│   ├── income.html        # Income tracker
│   ├── budgets.html       # Budget planner
│   ├── analytics.html     # AI analytics
│   ├── css/style.css      # Design system
│   └── js/                # Frontend logic
└── docs/                  # Documentation
```

## 📄 License

MIT — Built for Prompt Builder 2026 Hackathon
