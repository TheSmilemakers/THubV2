#!/bin/bash

echo "🚀 Starting ngrok tunnel for THub V2 backend..."
echo "Make sure your backend is running on http://localhost:3000"
echo ""

./ngrok http 3000

# After ngrok starts, copy the https URL and use it in n8n as APP_URL