FROM node:20-alpine

WORKDIR /app

# Copy backend package files from subfolder
COPY learn-guitar-backend/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy backend source
COPY learn-guitar-backend/ ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/app.js"]
