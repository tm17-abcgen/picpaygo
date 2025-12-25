FROM python:3.11-slim

WORKDIR /app

COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Schema file path is now relative to root
COPY docs/db/schema.sql ./schema.sql

# Copy api application files
COPY api/ ./

ENV PYTHONUNBUFFERED=1

EXPOSE 8081

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
