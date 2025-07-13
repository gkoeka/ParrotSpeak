# Contributing to ParrotSpeak

Thank you for your interest in contributing to ParrotSpeak! This guide will help you get started with contributing to our AI-powered voice translation platform.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contribution Guidelines](#contribution-guidelines)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Basic knowledge of TypeScript, React, and React Native

### Development Environment
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/parrotspeak.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see `.env.example`)
5. Initialize database: `npm run db:push && npm run db:seed`
6. Start development: `npm run dev`

## Contribution Guidelines

### Types of Contributions
- **Bug Fixes**: Fix existing issues or unexpected behavior
- **New Features**: Add new functionality or improve existing features
- **Documentation**: Improve README, code comments, or guides
- **Performance**: Optimize code, reduce bundle size, improve responsiveness
- **Mobile**: Enhance mobile app experience or add mobile-specific features
- **Security**: Address security vulnerabilities or improve security measures

### Before Contributing
1. Check existing issues to avoid duplicates
2. For new features, create an issue to discuss the proposal
3. For mobile changes, test on both iOS and Android
4. Ensure changes maintain platform parity between web and mobile

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Provide proper type annotations
- Import types from `@shared/schema.ts` when available
- Use interface over type when possible

### React Components
- Use functional components with hooks
- Follow naming conventions: PascalCase for components
- Keep components focused and single-purpose
- Use proper prop typing with TypeScript

### Database
- Use Drizzle ORM for all database operations
- Define schemas in `shared/schema.ts`
- Run `npm run db:push` after schema changes
- Include proper validation with Zod schemas

### Styling
- Use Tailwind CSS with consistent spacing
- Follow mobile-first responsive design
- Use shadcn/ui components when possible
- Maintain dark mode compatibility

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Include input validation and error handling
- Maintain consistent response formats
- Protect subscription-required endpoints

## Testing

### Required Testing
- **Type Checking**: `npm run type-check` must pass
- **Build Process**: Both web and mobile builds must succeed
- **Database Migrations**: Test schema changes thoroughly
- **Cross-Platform**: Test on web and mobile platforms
- **Subscription Flow**: Verify access control works correctly

### Testing Guidelines
- Test with different subscription states (guest, subscribed, expired)
- Verify analytics tracking respects user consent
- Test with multiple languages, especially French (known edge cases)
- Ensure voice features work across different devices

## Pull Request Process

### Before Submitting
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes with clear, focused commits
3. Test thoroughly on both web and mobile platforms
4. Update documentation if needed
5. Ensure CI/CD pipeline passes

### PR Requirements
- Fill out the complete PR template
- Include screenshots for UI changes
- Test on mobile devices for mobile changes
- Verify subscription access control
- Ensure no sensitive data is exposed

### Review Process
1. Automated CI/CD checks must pass
2. Code review by maintainers
3. Security review for sensitive changes
4. Mobile testing for mobile changes
5. Final approval and merge

## Issue Reporting

### Bug Reports
Use the bug report template and include:
- Clear reproduction steps
- Platform information (web/mobile)
- Screenshots or videos
- Error logs if available
- User account status (guest/subscribed)

### Feature Requests
Use the feature request template and include:
- Clear problem statement
- Proposed solution
- Target platform(s)
- Use cases and examples

### Mobile Issues
Use the mobile-specific template for:
- Device-specific problems
- Performance issues
- Permission-related problems
- Platform-specific bugs

## Development Tips

### Working with Voice Features
- Test with multiple languages
- Verify French TTS functionality (known issue area)
- Check voice selection and fallback logic
- Test with different device microphones

### Subscription System
- Always test subscription-protected endpoints
- Verify modal displays for non-subscribers
- Test subscription status changes
- Ensure graceful degradation for free features

### Mobile Development
- Use `expo start` for development
- Test on both iOS and Android simulators
- Verify camera and microphone permissions
- Test offline functionality

### Database Changes
- Always create migrations, don't edit directly
- Test with production-like data
- Verify encryption for sensitive data
- Include rollback procedures

## Code Review Guidelines

### For Contributors
- Keep changes focused and atomic
- Write clear commit messages
- Respond to feedback promptly
- Update based on review comments

### For Reviewers
- Focus on functionality and security
- Verify mobile/web platform parity
- Check for subscription access control
- Ensure code follows project conventions

## Communication

### GitHub Issues
- Use appropriate templates
- Provide complete information
- Be respectful and constructive
- Follow up on requested information

### Pull Requests
- Be open to feedback
- Explain complex changes clearly
- Update documentation as needed
- Test thoroughly before requesting review

## Security Considerations

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables for configuration
- Follow data encryption practices
- Implement proper input validation

### Authentication
- Maintain session security
- Follow subscription access patterns
- Implement proper error handling
- Use secure communication protocols

## Getting Help

- Check existing documentation first
- Search through closed issues
- Create a new issue with detailed information
- Be patient and respectful when seeking help

## License

By contributing to ParrotSpeak, you agree that your contributions will be licensed under the same terms as the project.

---

Thank you for contributing to ParrotSpeak! Your help makes this platform better for users worldwide. 🌍