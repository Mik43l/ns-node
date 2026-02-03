# Immagine leggera Node.js Alpine
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN addgroup --gid 1001 nodejs && \
    adduser --uid 1001 --ingroup nodejs node && \
    chown -R node:nodejs /app
USER node

EXPOSE 3000

CMD ["npm", "start"]