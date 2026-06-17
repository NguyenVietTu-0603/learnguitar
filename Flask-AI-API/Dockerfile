FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxcb1 \
    libxext6 \
    libx11-6 \
    libxrender1 \
    libfontconfig1 \
    libice6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

RUN mkdir -p uploads outputs

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health', timeout=5)" || exit 1

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "180", "--access-logfile", "-", "--error-logfile", "-"]
