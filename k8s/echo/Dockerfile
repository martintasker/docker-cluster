FROM node:14.7-alpine3.10

ARG PORT=1401
ENV PORT=${PORT}
WORKDIR /app
COPY package.json .
RUN npm install --no-shrinkwrap
COPY . .
EXPOSE ${PORT}
CMD ["npm", "start"]
