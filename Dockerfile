FROM node:20-alpine

WORKDIR /usr/src/app

# Keep NODE_ENV=production for the runtime
ENV NODE_ENV=production

# Install dependencies (use package-lock for reproducible installs)
COPY package*.json ./
RUN npm ci --production=false

# Copy the source and build
COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm","start"]
