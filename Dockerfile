FROM node:16-alpine

WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

ARG POSTGRES_URI
ENV POSTGRES_URI="postgres://bitespeed:thePass@postgres:5432/contacts"

COPY . .
# RUN npm run prisma:migrate-deploy
# RUN npm run prisma:generate
# RUN npm run build

EXPOSE 3000
CMD npm run start:docker