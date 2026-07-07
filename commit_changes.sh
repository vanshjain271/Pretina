#!/bin/bash
cd /Users/vanshjain/Documents/Projects/Pretina-V2

# Fetch all currently modified and untracked files that git knows about
# This automatically respects .gitignore so no secrets will be added
files=$(git status --porcelain | awk '{print $2}')

count=0
for file in $files; do
  # Skip dotfiles just to be extra safe
  if [[ "$file" == .* ]]; then
    continue
  fi
  
  git add "$file"
  
  basename=$(basename "$file")
  dir=$(dirname "$file")
  
  # Determine prefix for clean commit messages
  prefix="feat"
  if [[ "$dir" == *"backend/src/models"* ]]; then
    prefix="feat(models)"
  elif [[ "$dir" == *"backend/src/routes"* ]]; then
    prefix="feat(routes)"
  elif [[ "$dir" == *"backend/src/controllers"* ]]; then
    prefix="feat(controllers)"
  elif [[ "$dir" == *"backend/src/services"* ]]; then
    prefix="feat(services)"
  elif [[ "$dir" == *"admin/src/pages"* ]]; then
    prefix="feat(ui-pages)"
  elif [[ "$dir" == *"admin/src/components"* ]]; then
    prefix="feat(ui-components)"
  elif [[ "$dir" == *"admin/src/utils"* ]]; then
    prefix="feat(ui-utils)"
  fi
  
  # Commit the individual file
  git commit -m "$prefix: integrate YouthQit feature parity for $basename"
  ((count++))
done

echo "Successfully created $count systematic commits."

# Push all 40+ commits to GitHub
git push origin main
