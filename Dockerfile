FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . ./
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', (r)=>{if(r.statusCode!==200) process.exit(1);});"

CMD ["npm", "start"]
