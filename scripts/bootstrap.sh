#!/bin/bash

echo "🚀 Bootstrapping Ai-Agent Monorepo (Linux/Mac/WSL)..."

# Utility function to process a directory
process_dir() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo "====================================="
        echo "📦 Setting up: $dir"
        cd "$dir" || exit

        # 1. Setup Environment Variables
        if [ -f ".env.example" ] && [ ! -f ".env" ]; then
            echo "🔧 Creating .env from .env.example"
            cp .env.example .env
        fi

        # 2. Install Node Dependencies
        if [ -f "package.json" ]; then
            echo "📦 Found package.json. Installing node modules..."
            npm install
        fi

        # 3. Install Python Dependencies
        if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
            if command -v uv &> /dev/null; then
                echo "⚡ Found python deps. Installing via uv..."
                if [ -f "pyproject.toml" ]; then
                    uv sync
                else
                    uv venv
                    # .venv is created, install packages into it
                    uv pip install -r requirements.txt
                fi
            else
                echo "🐍 Found python deps. uv not found, falling back to pip..."
                if [ -f "requirements.txt" ]; then
                    pip install -r requirements.txt
                fi
            fi
        fi

        cd - > /dev/null
    fi
}

# Scan apps directory
if [ -d "apps" ]; then
    for app in apps/*/; do
        process_dir "$app"
    done
fi

# Scan bots directory
if [ -d "bots" ]; then
    for bot in bots/*/; do
        process_dir "$bot"
    done
fi

echo "====================================="
echo "✅ Bootstrap complete! Ready for development."
