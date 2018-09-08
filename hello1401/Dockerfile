FROM node:8-alpine

WORKDIR /app
COPY package.json .
RUN npm install --no-shrinkwrap
COPY . .
EXPOSE 1401
CMD ["npm", "start"]
