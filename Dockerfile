# Use world-class node base image for maximum stability
FROM node:20-slim

# Set working directory to the obsidian social core
WORKDIR /app

# Install system dependencies for high-end media processing (if needed)
# Since you have ffmpeg-static, we'll ensure common libs are present
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for efficient caching
COPY package*.json ./

# High-fidelity dependency installation
RUN npm install --production

# Transfer the core application logic
COPY . .

# Expose the API gateway (defaulting to 7000 as per your ServerUrl)
EXPOSE 7000

# Launch the world-class social engine
CMD ["npm", "start"]
