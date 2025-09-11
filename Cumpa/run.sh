#!/bin/bash
source venv/bin/activate

# If you want to run Cumpa in authoring mode, use: ./run.sh --authored
# else, use: ./run.sh

if [ "$1" == "--authored" ]; then
    echo "🧠 Running in AUTHORED mode..."
    DISPLAY=:0 python -m src.main --authored
else
    echo "💬 Running in LLM (default) mode..."
    DISPLAY=:0 python -m src.main
fi