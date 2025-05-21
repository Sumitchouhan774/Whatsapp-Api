# Use an official Node.js image as base
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port (change if your app uses another)
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
