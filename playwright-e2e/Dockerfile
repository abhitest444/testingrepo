FROM mcr.microsoft.com/playwright:v1.54.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test", "--project=chromium", "--project=unauthenticated", "--project=api"]
