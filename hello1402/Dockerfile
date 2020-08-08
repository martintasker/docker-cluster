FROM node:14.7-alpine3.10 as builder

WORKDIR /app
COPY package.json .
RUN npm install

FROM node:14.7-alpine3.10
WORKDIR /app
COPY --from=builder app/node_modules  node_modules
COPY --from=builder app/package.json .
COPY index.js .
VOLUME /app/src
EXPOSE 1402
CMD ["npm", "start"]
