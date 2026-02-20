# AWS Deployment Guide — FinTrack AI (Free Tier)

> All services below use **AWS Free Tier** — no costs if you stay within limits.

---

## Step 1: AWS Account Setup

1. Go to [aws.amazon.com](https://aws.amazon.com) and create a free account
2. Sign in to the **AWS Management Console**
3. Set your region (e.g., `ap-south-1` for Mumbai)

---

## Step 2: DynamoDB — Database

**Free Tier: 25 GB storage, 25 Read/Write Capacity Units**

1. Go to **DynamoDB** in the console
2. Create 4 tables with these settings:

| Table Name | Partition Key | Sort Key |
|------------|--------------|----------|
| `fintrack-users` | `id` (String) | — |
| `fintrack-expenses` | `id` (String) | — |
| `fintrack-income` | `id` (String) | — |
| `fintrack-budgets` | `id` (String) | — |

3. For each table, add a **Global Secondary Index** (GSI):
   - Index name: `user_id-index`
   - Partition key: `user_id` (String)
   - Sort key: `date` (String) for expenses/income, `month` (String) for budgets

4. Set capacity to **On-Demand** (stays within free tier for hackathon usage)

---

## Step 3: Cognito — Authentication

**Free Tier: 50,000 Monthly Active Users**

1. Go to **Amazon Cognito** → **User Pools** → **Create User Pool**
2. Configure:
   - Sign-in: Email
   - Password policy: Minimum 6 characters
   - MFA: Optional (adds to security score in judging)
   - Self-registration: Enabled
3. Create an **App Client**:
   - No client secret
   - Auth flows: `USER_PASSWORD_AUTH`
4. Note your **User Pool ID** and **App Client ID**

---

## Step 4: Lambda — Backend Functions

**Free Tier: 1 Million requests/month, 400,000 GB-seconds**

1. Go to **AWS Lambda** → **Create Function**
2. Runtime: **Node.js 18.x**
3. Create these functions:
   - `fintrack-auth` — handles login/signup
   - `fintrack-expenses` — CRUD for expenses
   - `fintrack-income` — CRUD for income
   - `fintrack-budgets` — CRUD for budgets
   - `fintrack-analytics` — analytics & AI recommendations

4. For each function:
   - Upload the corresponding route file as a handler
   - Set environment variables:
     ```
     DYNAMODB_TABLE_PREFIX=fintrack
     COGNITO_USER_POOL_ID=<your-pool-id>
     ```
   - Attach **IAM role** with DynamoDB and Cognito permissions

5. **IAM Policy** for Lambda:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"],
         "Resource": "arn:aws:dynamodb:*:*:table/fintrack-*"
       }
     ]
   }
   ```

---

## Step 5: API Gateway — REST API

**Free Tier: 1 Million API calls/month**

1. Go to **API Gateway** → **Create API** → **REST API**
2. Create resources and methods matching the routes:

   ```
   /api/auth/signup      → POST → fintrack-auth
   /api/auth/login       → POST → fintrack-auth
   /api/auth/me          → GET  → fintrack-auth
   /api/expenses         → GET, POST → fintrack-expenses
   /api/expenses/{id}    → PUT, DELETE → fintrack-expenses
   /api/income           → GET, POST → fintrack-income
   /api/income/{id}      → DELETE → fintrack-income
   /api/budgets          → GET, POST → fintrack-budgets
   /api/budgets/{id}     → DELETE → fintrack-budgets
   /api/analytics/*      → GET → fintrack-analytics
   ```

3. Enable **CORS** on all resources
4. **Deploy** the API to a stage called `prod`
5. Note your API endpoint URL

---

## Step 6: S3 — Frontend Hosting

**Free Tier: 5 GB storage, 20,000 GET requests**

1. Go to **S3** → **Create Bucket**
   - Name: `fintrack-ai-frontend`
   - Region: Same as your API
   - Uncheck "Block all public access"

2. Upload the `public/` folder contents

3. Enable **Static Website Hosting**:
   - Index document: `index.html`
   - Error document: `index.html`

4. Add a **Bucket Policy** for public read:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::fintrack-ai-frontend/*"
     }]
   }
   ```

5. Update the `API.BASE` in `public/js/api.js` to your API Gateway URL

---

## Step 7: CloudFront — CDN

**Free Tier: 1 TB data transfer/month**

1. Go to **CloudFront** → **Create Distribution**
2. Origin: Your S3 bucket website endpoint
3. Default root object: `index.html`
4. Enable HTTPS
5. Your app is now available at the CloudFront URL!

---

## Step 8: CloudWatch — Monitoring

**Free Tier: 10 custom metrics, 10 alarms**

1. Go to **CloudWatch** → **Dashboards** → **Create Dashboard**
2. Add widgets for:
   - Lambda invocation count
   - Lambda errors
   - API Gateway 4xx/5xx errors
   - DynamoDB read/write capacity
3. Set up **Alarms**:
   - Lambda error rate > 5%
   - API Gateway 5xx errors > 10/minute

---

## Quick Checklist

- [ ] AWS Account created
- [ ] DynamoDB tables created (4 tables)
- [ ] Cognito User Pool configured
- [ ] Lambda functions deployed (5 functions)
- [ ] API Gateway configured and deployed
- [ ] S3 bucket created with frontend files
- [ ] CloudFront distribution created
- [ ] CloudWatch dashboard set up
- [ ] Frontend API base URL updated
- [ ] Test signup / login / add expense flow
