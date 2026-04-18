FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG SERVICE
ENV SERVICE=$SERVICE
EXPOSE 3000
CMD node ${SERVICE}.js