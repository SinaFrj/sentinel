#!/bin/bash
echo "🚀 STARTING SENTINEL SYSTEM..."

# Start Backend
echo "Starting Backend Agent..."
cd backend
pip install -r requirements.txt
python3 orchestrator.py &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend Agent..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ SENTINEL ONLINE."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"

# Trap to kill both on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
