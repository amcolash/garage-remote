# Dependency Stage
FROM mhart/alpine-node:14

# Create app directory
WORKDIR /usr/src/app

# For caching purposes, install deps without other changed files
COPY package.json package-lock.json ./

# Install deps
RUN npm ci

# Copy source code
COPY . ./

# Set things up
EXPOSE 8003