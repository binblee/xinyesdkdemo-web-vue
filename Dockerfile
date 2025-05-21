# Stage 1: Build the Vue.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you use Yarn)
# If you only have package.json, that's fine too.
COPY package*.json ./
# If using yarn, uncomment the next line and comment out npm install
# COPY yarn.lock ./

# Install dependencies
RUN npm install
# If using yarn, uncomment the next line and comment out the npm install above
# RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application (assuming your build script is 'build' in package.json)
RUN npm run build
# If using yarn, uncomment the next line
# RUN yarn build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the built static files from the builder stage
# The default output directory for Vite is 'dist'. If yours is different, update the path below.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration if you have one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
