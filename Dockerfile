# Use a specific Node.js image as the base for building
FROM node:20-slim AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json to install dependencies for both frontend and backend
COPY package.json ./

# Install dependencies (both development and production for the builder stage)
RUN npm install --no-cache-dir

# Copy the rest of your application code
COPY . .

# Build the production assets for your Vite/React app
RUN npm run build

# --- Start a new, smaller stage for the final image ---
# This stage will contain only what's needed for production, making the final image smaller.
FROM node:20-slim

# Set the working directory for the final image
WORKDIR /app

# Copy package.json from builder to install production dependencies only
COPY --from=builder /app/package.json ./

# Install only production dependencies (no dev dependencies like Vite)
RUN npm install --only=production --no-cache-dir

# Copy the built frontend (dist folder) and your backend server.js file
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Cloud Run will set the PORT environment variable.
ENV PORT 8080
EXPOSE $PORT

# Command to run your application: start the Node.js server
# This tells Cloud Run to execute your server.js file when the container starts.
CMD ["node", "server.js"]
