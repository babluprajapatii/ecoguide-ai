## Summary

<!-- Provide a brief description of the changes in this PR -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔒 Security fix
- [ ] ♿ Accessibility improvement
- [ ] ⚡ Performance improvement
- [ ] 🔧 Refactor (no functional changes)
- [ ] 🧪 Test addition or improvement

## Related Issues

<!-- Link to related issues: Closes #123, Fixes #456 -->

## Changes Made

<!-- Describe your changes in detail -->

-
-
-

## Testing

### Unit / Integration Tests

- [ ] New tests added for new functionality
- [ ] Existing tests updated (if behavior changed)
- [ ] All tests pass locally: `npm run test`

### E2E Tests

- [ ] E2E tests pass: `npx playwright test`
- [ ] New E2E tests added (if applicable)

### Manual Testing

Describe the manual testing steps you performed:

1.
2.
3.

## Accessibility

- [ ] Keyboard navigation tested and working
- [ ] Screen reader tested (if applicable)
- [ ] Color contrast meets WCAG AA (4.5:1 ratio for normal text)
- [ ] ARIA labels and roles are correct
- [ ] Focus management is correct (especially for modals/dialogs)
- [ ] No axe violations: `npm run test -- --reporter=verbose`
- [ ] Touch targets are ≥ 44×44px

## Security

- [ ] No sensitive data (tokens, keys, PII) committed to the repository
- [ ] Input validation added for any new user inputs
- [ ] API routes have appropriate authentication and authorization
- [ ] Rate limiting applied where appropriate
- [ ] CSP is not weakened by this change
- [ ] No new external dependencies without security review
- [ ] `npm audit` shows no new high/critical vulnerabilities

## Performance

- [ ] Bundle size impact assessed (is this a significant addition?)
- [ ] Dynamic imports used for large components
- [ ] Images optimized and use Next.js `<Image>` component
- [ ] No unnecessary re-renders introduced

## Screenshots / Recordings

<!-- Add before/after screenshots or recordings for UI changes -->

**Before:**

**After:**

## Deployment Notes

<!-- Any special deployment steps, environment variable changes, or migration scripts needed -->

## Checklist

- [ ] My code follows the project's TypeScript strict mode requirements
- [ ] I have run `npm run typecheck` with zero errors
- [ ] I have run `npm run lint` with zero warnings
- [ ] I have run `npm run build` successfully
- [ ] I have updated documentation where relevant
- [ ] I have assigned reviewers

---

> By submitting this PR, I confirm that my contribution is made under the terms of the MIT License.
