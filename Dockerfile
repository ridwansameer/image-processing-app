FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

WORKDIR /app

# Copy everything
COPY . .

# Install Python dependencies with uv
RUN uv sync

# Install Node dependencies
RUN cd backend && npm install

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "backend/server.js"]