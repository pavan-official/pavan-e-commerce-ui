#!/bin/bash

# Fix isLoading conflicts in temp-admin directory
echo "🔧 Fixing isLoading conflicts in temp-admin directory..."

# List of files to fix
files=(
  "temp-admin/orders/page.tsx"
  "temp-admin/wishlist/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace isLoading with authLoading in useAuth destructuring
    sed -i '' 's/const { user, isLoading } = useAuth()/const { user, isLoading: authLoading } = useAuth()/g' "$file"
    
    # Replace authentication-related isLoading references
    sed -i '' 's/if (isLoading) return/if (authLoading) return/g' "$file"
    sed -i '' 's/\[user, isLoading,/[user, authLoading,/g' "$file"
    sed -i '' 's/if (isLoading || isLoading)/if (authLoading || isLoading)/g' "$file"
    
    echo "✅ Fixed $file"
  else
    echo "⚠️  File $file not found"
  fi
done

echo "🎉 All isLoading conflicts fixed!"
