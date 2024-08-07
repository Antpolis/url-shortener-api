FROM node:21-alpine3.17
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

WORKDIR /app
COPY ./.build/ /app
COPY node_modules /app/node_modules


EXPOSE 1900
CMD ["node", "./main.js"]