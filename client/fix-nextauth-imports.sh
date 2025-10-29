#!/bin/bash

# Fix NextAuth imports in temp-admin directory
echo "🔧 Fixing NextAuth imports in temp-admin directory..."

# List of files to fix
files=(
  "temp-admin/orders/[id]/page.tsx"
  "temp-admin/checkout/page.tsx"
  "temp-admin/wishlist/page.tsx"
  "temp-admin/orders/page.tsx"
  "temp-admin/cart/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace import
    sed -i '' 's/import { useSession } from '\''next-auth\/react'\''/import { useAuth } from '\''@\/hooks\/useAuth'\''/g' "$file"
    
    # Replace usage patterns
    sed -i '' 's/const { data: session, status } = useSession()/const { user, isLoading } = useAuth()/g' "$file"
    sed -i '' 's/status === '\''loading'\''/isLoading/g' "$file"
    sed -i '' 's/!session/!user/g' "$file"
    sed -i '' 's/session\.user\./user\./g' "$file"
    sed -i '' 's/\[session, status,/[user, isLoading,/g' "$file"
    
    echo "✅ Fixed $file"
  else
    echo "⚠️  File $file not found"
  fi
done

echo "🎉 All NextAuth imports fixed!"
