# GitHub Repository Setup Guide for ParrotSpeak

## Pre-Setup Cleanup ✅
The repository has been prepared with proper `.gitignore` settings to exclude:
- Debug and test files
- Temporary assets and screenshots  
- Development configuration files
- Sensitive documentation with potential credentials

## Repository Structure

Your repository will include these essential directories:
```
ParrotSpeak/
├── client/                 # React web application
├── server/                 # Express.js backend
├── mobile-app/            # React Native mobile app
├── db/                    # Database schema and migrations
├── shared/                # Shared types and utilities
├── public/                # Static assets
├── scripts/               # Database and utility scripts
├── README.md              # Main documentation
├── DEPLOYMENT.md          # Deployment instructions
├── package.json           # Dependencies and scripts
└── replit.md             # Development context
```

## Step-by-Step GitHub Setup

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `parrotspeak` or `ParrotSpeak`
3. Description: "AI-powered voice translation platform with subscription management"
4. Choose Public or Private (recommend Private during development)
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 2. Initialize Local Git (Run these commands in terminal)
```bash
# Remove any existing git lock
rm -f .git/index.lock

# Initialize repository
git init

# Add all files (the .gitignore will exclude unwanted files)
git add .

# Create initial commit
git commit -m "Initial commit: ParrotSpeak voice translation platform

- Complete web application with React/TypeScript
- React Native mobile app with Expo
- Express.js backend with PostgreSQL
- Subscription-based access control
- Real-time voice translation via WebSocket
- Comprehensive analytics and admin features"

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/parrotspeak.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Set Up Repository Settings

#### Branch Protection
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

#### Secrets for GitHub Actions
1. Go to Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `DATABASE_URL`: Your production database URL
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `SENDGRID_API_KEY`: Your SendGrid API key
   - `MIXPANEL_TOKEN`: Your Mixpanel token (optional)

#### Topics/Tags
Add relevant topics:
- `voice-translation`
- `ai-translation`  
- `react-native`
- `typescript`
- `subscription-saas`
- `real-time-audio`

## GitHub Actions CI/CD (Optional)

I'll create a workflow file for automated testing and deployment. This will:
- Run TypeScript type checking
- Test database migrations
- Build both web and mobile apps
- Deploy to staging environment

## Repository Best Practices

### Commit Message Format
```
type(scope): description

- feat: new feature
- fix: bug fix  
- docs: documentation
- refactor: code refactoring
- test: adding tests
- ci: CI/CD changes

Examples:
- feat(mobile): add voice recording controls
- fix(auth): resolve session timeout issue
- docs(api): update authentication endpoints
```

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/feature-name`: New features
- `fix/bug-description`: Bug fixes
- `mobile/feature-name`: Mobile-specific features

### Pull Request Template
I'll create a PR template to ensure consistent reviews.

## Security Considerations

### What's Included ✅
- Application source code
- Database schema
- Configuration templates
- Documentation

### What's Excluded ✅  
- Environment variables (.env files)
- Debug/test files
- Temporary assets
- User data or screenshots
- API keys or secrets

### Repository Security
- Use branch protection rules
- Require PR reviews for main branch
- Store secrets in GitHub Secrets
- Use Dependabot for dependency updates

## Next Steps After Setup

1. **Set up development environment documentation**
2. **Create issue templates for bugs/features**
3. **Set up automated testing with GitHub Actions**
4. **Configure Dependabot for security updates**
5. **Create deployment workflows for staging/production**

## Troubleshooting

### Git Lock Issues
If you encounter `.git/index.lock` errors:
```bash
rm -f .git/index.lock
git add .
git commit -m "Your commit message"
```

### Large File Issues
If any files are too large for GitHub:
```bash
# Check file sizes
find . -size +100M -not -path './node_modules/*'

# Use Git LFS for large files if needed
git lfs track "*.png" "*.jpg" "*.pdf"
```

## Support

After repository setup, you can:
- Use GitHub Issues for bug tracking
- Set up GitHub Discussions for Q&A
- Configure GitHub Projects for task management
- Enable GitHub Pages for documentation hosting