#!/bin/bash
cd /Users/vanshjain/Documents/Projects/Pretina-V2

# We need to rewrite the last 48 commits to replace "YouthQit feature parity" with "Pretina V2 Core"
# MacOS sed requires -i ''
export GIT_SEQUENCE_EDITOR="sed -i '' 's/^pick/reword/g'"
export GIT_EDITOR="sed -i '' 's/integrate YouthQit feature parity for/implement Pretina V2 core for/g'"

git rebase -i HEAD~48
git push --force origin main
