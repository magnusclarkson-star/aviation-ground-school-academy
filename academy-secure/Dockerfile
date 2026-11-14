# Isolated private Academy service image. Build context MUST be academy-secure/.
# The public repository's certificate source segments never enter this context.
FROM node:22-alpine
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    ACADEMY_ACCESS_STATE=closed
WORKDIR /srv/academy-private

# Reproducible transitive versions generated and checked by npm on GitHub Actions.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

# Explicit private runtime only: no tests, schema, Git history, original artwork,
# student records or host secrets. Certificate masters mount separately.
COPY --chown=node:node *.mjs *.js *.html *.css ./

USER node
EXPOSE 8787
CMD ["node","server.mjs"]
