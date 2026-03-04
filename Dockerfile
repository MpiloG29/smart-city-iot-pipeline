FROM node:20-alpine

WORKDIR /app

# Install app dependencies from the dashboard package
COPY smart-city-iot-js/package*.json ./smart-city-iot-js/
RUN npm --prefix smart-city-iot-js ci --omit=dev

# Copy full repository (includes dashboard source)
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run dashboard directly (do not depend on root package scripts)
CMD ["node", "smart-city-iot-js/server.js"]