# Infrastructure Project — CI/CD Automation & Security Pipeline

## Pipeline Architecture
The Cloud Infrastructure (`INFRA`) automated deployment pipeline is powered by GitHub Actions and automated container registry workflows.

## Build Stages
1. **Lint & Static Analysis**: Executes ESLint, Helm lint, and Terraform validate checks on pull requests.
2. **Automated Testing**: Runs unit, integration, and security test suites.
3. **Container Security Scan**: Uses Trivy to scan Docker container images for OS and dependency vulnerability CVEs.
4. **Staging Deployment**: Deploys approved pull requests to staging Kubernetes namespace for automated smoke testing.
5. **Production Promotion**: Manual approval gate triggers zero-downtime rolling deployment to production Kubernetes cluster.
