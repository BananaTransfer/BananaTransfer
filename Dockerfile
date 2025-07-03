FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json .
RUN npm install --omit=dev


FROM base AS builder

# add only in the builder the library necesseray for build
RUN npm install

# the files are copied after the installation to avoid reinstalling everytime we change our
# applicative code
COPY . .

RUN npm run build


FROM base

# only copy the necessary files
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/views /app/views
COPY --from=builder /app/public /app/public

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
