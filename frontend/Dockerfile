# Build Stage
FROM oven/bun:1-alpine as build-stage
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build

# Production Stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
