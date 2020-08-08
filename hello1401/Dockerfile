FROM node:14.7-alpine3.10

WORKDIR /app
COPY package.json .
RUN npm install --no-shrinkwrap
COPY . .
EXPOSE 1401
CMD ["npm", "start"]
