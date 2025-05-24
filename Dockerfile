# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# The node:18-slim image already includes a 'node' user and group
# So we don't need to create them - we'll use the existing ones

# Copy package.json and package-lock.json (if available)
# package-lock.json should be available after npm install from the previous step
COPY package*.json ./

# Install only production dependencies
# chown node_modules to the node user before switching user
RUN npm install --omit=dev && chown -R node:node /usr/src/app/node_modules

# Copy the rest of your application code
# This includes index.js, logger.js, .env.example, tools/, models/
COPY index.js ./
COPY logger.js ./
COPY .env.example ./
COPY tools ./tools/
COPY models ./models/

# Change ownership of all app files to the node user
RUN chown -R node:node /usr/src/app

# Switch to the non-root user
USER node

# Expose the port your app runs on (default 3000, configurable via PORT env var)
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "start" ]
