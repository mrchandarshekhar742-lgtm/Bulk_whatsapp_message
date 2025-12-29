#!/bin/bash

echo "🔧 Fixing port configuration issue..."

# Fix backend .env
echo "📝 Updating backend .env..."
sed -i 's/PORT=80/PORT=8080/g' backend/.env
echo "✅ Backend port set to 8080"

# Fix frontend API client
echo "📝 Updating frontend API client..."
sed -i 's/:80/:8080/g' Frontend/src/api/client.js
echo "✅ Frontend API client updated to use port 8080"

# Update server.js
echo "📝 Updating server.js..."
sed -i 's/process.env.PORT || 80/process.env.PORT || 8080/g' backend/server.js
echo "✅ Server.js updated to use port 8080"

echo "🎉 Port configuration fixed!"
echo "📋 Next steps:"
echo "1. Restart backend server"
echo "2. Rebuild frontend"
echo "3. Update VPS configuration if needed"