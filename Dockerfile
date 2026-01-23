# ---------- Stage 1: Build Angular ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

RUN npm ci

# Copy rest of the project
COPY . .

# Build for production
RUN npm run build -- --configuration production


# ---------- Stage 2: Serve with Nginx ----------
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Angular build output
COPY --from=build /app/dist/prime/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
