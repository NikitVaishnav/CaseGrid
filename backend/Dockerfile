FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY . .

# Expose port
EXPOSE 5001

# Startup: push DB schema, seed data, then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node prisma/seed.js && node src/index.js"]
