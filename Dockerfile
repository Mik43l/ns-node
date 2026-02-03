# Immagine leggera Node.js Alpine
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "start"]
