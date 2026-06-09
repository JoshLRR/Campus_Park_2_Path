#!/bin/bash
set -e

PROFILE=cpp-backend
REGION=us-west-2
APP_ID=d115m74zwic3yb
BRANCH=main
API_URL=https://cp-e0652cad34484454b6057ceeabb7bac9.ecs.us-west-2.on.aws

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP=/tmp/cpp-frontend-deploy.zip

echo "==> building..."
cd "$REPO_ROOT"
VITE_API_BASE_URL=$API_URL npx vite build

echo "==> zipping dist/..."
cd "$REPO_ROOT/dist"
zip -qr "$ZIP" .
cd "$REPO_ROOT"

echo "==> creating deployment slot..."
DEP=$(aws amplify create-deployment \
  --profile $PROFILE --region $REGION \
  --app-id $APP_ID --branch-name $BRANCH \
  --output json)

JOB_ID=$(echo "$DEP" | grep '"jobId"' | tr -d ' ",' | cut -d: -f2)
echo "$DEP" | grep '"zipUploadUrl"' | sed 's/.*"zipUploadUrl": "\(.*\)".*/\1/' > /tmp/amplify_upload_url.txt

echo "==> uploading (job $JOB_ID)..."
curl -s -o /dev/null -w "upload: HTTP %{http_code}\n" \
  -X PUT -H "Content-Type: application/zip" \
  --data-binary @"$ZIP" \
  --url "$(cat /tmp/amplify_upload_url.txt)"

echo "==> deploying..."
aws amplify start-deployment \
  --profile $PROFILE --region $REGION \
  --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID \
  --query 'jobSummary.status' --output text

echo "==> waiting for deploy to finish..."
until aws amplify get-job \
  --profile $PROFILE --region $REGION \
  --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID \
  --query 'job.summary.status' --output text | grep -qE 'SUCCEED|FAILED|CANCELLED'; do
  sleep 8
done

STATUS=$(aws amplify get-job \
  --profile $PROFILE --region $REGION \
  --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID \
  --query 'job.summary.status' --output text)

echo "==> deploy $STATUS"
[ "$STATUS" = "SUCCEED" ] && echo "live at: https://$BRANCH.$APP_ID.amplifyapp.com"
[ "$STATUS" != "SUCCEED" ] && exit 1

rm -f "$ZIP" /tmp/amplify_upload_url.txt
