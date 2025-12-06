# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --production --silent && npm cache clean --force

# Copy existing backend folders/files
COPY routes ./routes
COPY models ./models
COPY controllers ./controllers
COPY middleware ./middleware
COPY utils ./utils
COPY services ./services
COPY config ./config
COPY uploads ./uploads
COPY server.js .
COPY socket.js .

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
