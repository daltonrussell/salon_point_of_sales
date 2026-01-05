# GitHub Actions and Branch Protection Setup

## GitHub Actions Workflow

A test workflow has been created at `.github/workflows/test.yml`. This workflow will automatically run on all pull requests and pushes to the main and develop branches.

The workflow:
- Installs dependencies
- Runs the linter (if npm script exists)
- Runs all tests with coverage reporting
- Uploads coverage to Codecov
- Builds the application

## Setting Up Branch Protection Rules

To require tests to pass before merging pull requests:

### Steps:

1. **Go to Repository Settings**
   - Navigate to your GitHub repository
   - Click on "Settings" in the top navigation

2. **Access Branch Protection Rules**
   - In the left sidebar, click on "Branches"
   - Click "Add rule" under "Branch protection rules"

3. **Configure the Rule**
   - **Branch name pattern**: Enter `main` (or `develop` if you want to protect that too)
   - **Check the following options:**
     - ✓ "Require a pull request before merging"
     - ✓ "Dismiss stale pull request approvals when new commits are pushed"
     - ✓ "Require status checks to pass before merging"
     - ✓ "Require branches to be up to date before merging"

4. **Select Required Status Checks**
   - Click "Require status checks to pass before merging"
   - Search for and select: `test` (this is the name of our workflow job)
   - The following checks should be required:
     - `test (16.x)`
     - `test (18.x)`
     - `test (20.x)`

5. **Additional Settings (Recommended)**
   - ✓ "Require code reviews before merging" (set to 1 required reviewer)
   - ✓ "Require review from Code Owners"
   - ✓ "Include administrators" (optional - prevents even admins from bypassing checks)

6. **Save the Rule**
   - Click "Create" to save the branch protection rule

## Verifying the Setup

After setting up branch protection:
1. Create a test pull request
2. The GitHub Actions workflow should automatically trigger
3. You should see the test status checks appearing on the PR
4. The PR should not be mergeable until all tests pass

## Running Tests Locally

Before pushing your changes, run tests locally:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- salesCalculations.test.js
```

## Troubleshooting

### Tests fail in GitHub Actions but pass locally
- Check Node version differences (tests run on 16.x, 18.x, and 20.x)
- Ensure all dependencies are in `package.json` (not just `package-lock.json`)
- Check for environment-specific issues

### Workflow not running
- Verify the workflow file is in `.github/workflows/test.yml`
- Check that the branch protection rule is correctly configured
- Look at the "Actions" tab in your GitHub repository to see workflow logs

### Status checks not appearing on PR
- Ensure the workflow has run (check the Actions tab)
- The status check name must match exactly what's configured in branch protection
- Wait a few moments for GitHub to sync the status
