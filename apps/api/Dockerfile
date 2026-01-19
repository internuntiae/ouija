FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3001

HEALTHCHECK --interval=5s --timeout=10s --retries=5 CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health/ || exit 10

CMD ["npm", "start"]