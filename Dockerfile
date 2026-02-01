# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ---- runtime stage ----
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf

# Angular output for project "prime" (common with the new application builder)
COPY --from=build /app/dist/prime/browser /usr/share/nginx/html
