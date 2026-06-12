set -e

cd repo/taipei-day-trip

git pull origin main

pkill -f "./app/app.py" || true

FLASK_DEBUG=false nohup .venv/bin/python ./app/app.py > nohup.out 2>&1 &

