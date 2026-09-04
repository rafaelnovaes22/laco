FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public
ENV NODE_ENV=production
ENV MEDIA_PATH=/data
RUN mkdir /data && chown node:node /data
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', (r)=>{if(r.statusCode!==200) process.exit(1);});"

CMD ["npm", "start"]
