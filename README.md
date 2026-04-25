# Serverless REST API — AWS CDK

A fully serverless REST API built with AWS CDK (TypeScript), deployed on AWS Free Tier.

## Architecture

```
Client → API Gateway → Lambda → DynamoDB
                          ↓
                     CloudWatch (error alarm)
```

All infrastructure is defined as code using AWS CDK and provisioned via CloudFormation.

## Stack

| Service | Role |
|---|---|
| AWS CDK + CloudFormation | Infrastructure as code |
| AWS Lambda (Node.js 20) | Business logic |
| Amazon API Gateway | HTTP endpoint |
| Amazon DynamoDB | NoSQL data store |
| Amazon CloudWatch | Error monitoring & alarms |
| AWS IAM | Least-privilege roles (auto-managed by CDK) |

## Prerequisites

- Node.js 18+
- AWS CLI configured (`aws configure --profile <name>`)
- AWS CDK CLI (`npm install -g aws-cdk`)

## Getting started

```bash
# Install dependencies
npm install

# Bootstrap CDK in your account (one-time)
cdk bootstrap aws://YOUR_ACCOUNT_ID/YOUR_REGION --profile YOUR_PROFILE

# Preview changes
cdk diff --profile YOUR_PROFILE

# Deploy
cdk deploy --profile YOUR_PROFILE
```

The deployed API URL is printed in the output:
```
Outputs:
MyCdkApiStack.ApiUrl = https://xxxx.execute-api.eu-north-1.amazonaws.com/prod/
```

## Usage

```bash
# Create an item
curl -X POST https://YOUR_API_URL/prod/ \
  -H "Content-Type: application/json" \
  -d '{"name": "my item"}'

# List all items
curl https://YOUR_API_URL/prod/
```

## Cleanup

```bash
cdk destroy --profile YOUR_PROFILE
```

Tears down all AWS resources. No residual charges.

## IAM & security

CDK automatically creates least-privilege IAM roles. The Lambda function is granted only `dynamodb:GetItem`, `dynamodb:PutItem`, and `dynamodb:Scan` on the specific table — nothing else.

## What's next

- [ ] Authentication with Amazon Cognito
- [ ] CI/CD pipeline with AWS CodePipeline
- [ ] Additional endpoints (PUT, DELETE)
- [ ] Unit tests with Jest