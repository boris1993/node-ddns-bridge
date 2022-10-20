FROM node:lts-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY . .

EXPOSE 8080
USER node
CMD ["node", "main.js"]
