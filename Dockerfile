FROM node:24-alpine3.20
WORKDIR /app
COPY package*.json ./
RUN npm install --verbose
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]

