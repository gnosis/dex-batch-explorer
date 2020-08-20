FROM node:lts-alpine as builder
WORKDIR /usr/src/dex-solutions
COPY . .
RUN yarn --frozen-lockfile && yarn build

FROM nginx:stable-alpine
WORKDIR /root
COPY --from=builder /usr/src/dex-solutions/build /usr/share/nginx/html
