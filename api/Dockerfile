FROM python:3.11-slim

WORKDIR /app

# Install libheif for HEIC image support (iPhone photos)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libheif-dev libheif1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Schema file path is now relative to root
COPY docs/db/schema.sql ./schema.sql

# Copy api application files
COPY api/ ./

ENV PYTHONUNBUFFERED=1

EXPOSE 8081

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
