# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of your application code
COPY index.js ./
COPY logger.js ./
COPY .env.example ./
COPY tools ./tools/
COPY models ./models/

# Expose the port your app runs on (default 3000, configurable via PORT env var)
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "start" ]
