# Use a slim Python 3.12 image
FROM python:3.12-slim AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1

# Install uv (The ultra-fast Python package installer and resolver)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files
# We support both requirements.txt and pyproject.toml patterns
COPY requirements.txt ./
# COPY pyproject.toml uv.lock* ./

# Install dependencies extremely fast using uv
# If pyproject.toml is used later, change to `RUN uv sync`
RUN uv pip install -r requirements.txt

# Copy the rest of the application
COPY . .

# Run as non-root
RUN useradd -m -u 1000 ai_user
USER ai_user

EXPOSE 8000
ENV PORT=8000

# Placeholder CMD (update to your actual FastAPI entrypoint)
# CMD ["fastapi", "run", "main.py", "--port", "8000"]
CMD ["python", "main.py"]
