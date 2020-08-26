FROM node:lts-alpine as builder
WORKDIR /usr/src/dex-batch-explorer
COPY . .
RUN yarn --frozen-lockfile && yarn build

FROM nginx:stable-alpine
WORKDIR /root
COPY --from=builder /usr/src/dex-batch-explorer/build /usr/share/nginx/html
