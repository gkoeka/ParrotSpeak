# Push Code to GitHub

## Commands to run in Replit Shell:

```bash
# 1. Remove any git lock
rm -f .git/index.lock

# 2. Add all your files
git add .

# 3. Create initial commit
git commit -m "Initial commit: ParrotSpeak voice translation platform"

# 4. Add your GitHub repository
git remote add origin https://github.com/gkoeka/ParrotSpeak.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

## If you get an error about existing remote:
```bash
git remote remove origin
git remote add origin https://github.com/gkoeka/ParrotSpeak.git
git push -u origin main
```

## If you need to authenticate:
- GitHub will prompt for your username and password/token
- Use your GitHub username
- For password, use a Personal Access Token (not your GitHub password)
- Create token at: https://github.com/settings/tokens

That's it! Your code will be on GitHub.