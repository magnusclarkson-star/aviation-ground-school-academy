# Build only the private training API, never the public GitHub Pages site.
# Review and pin the upstream base-image digest before any real-data deployment.
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /opt/agsa
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY src/ ./src/
COPY portal/ ./portal/
USER node
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
 CMD node -e "fetch('http://127.0.0.1:3100/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","src/server.mjs"]
