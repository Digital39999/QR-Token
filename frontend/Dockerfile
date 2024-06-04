FROM node:20.3.0
WORKDIR /app
COPY . .
COPY package.json ./
RUN npm install -g pnpm
RUN pnpm install
CMD ["pnpm", "run", "rebuild"]