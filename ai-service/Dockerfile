FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway sets $PORT dynamically; default to 8000 for local
EXPOSE 8000

# Use PORT env var if set (Railway), else default 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
