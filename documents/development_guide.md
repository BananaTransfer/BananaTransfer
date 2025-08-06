# Development guide

This document is here to help new dev get on board with the project.

## Development 

### Code quality check before opening a PR

Before opening a PR, you must check that:
* the code you added is tested through automatic test
* all the existing test are still passing `npm test`
* the code follow the linter configuration `npm run lint`
* the project build `npm run build`

All those tests will be done for you by the GitHub actions once you open the PR, but we prefer 
if you check those things before commiting. If you ran the `make setup` script when installing 
the repository you will have a pre-commit hook ensuring all those test passes before accepting your commit.

### Git 

We don't enforce any commit message format but use git flow like branch naming convention. 

* Any branch that add a feature must be name `feature/<feature name>`
* Any branch that fix a bug must be named `hotfix/<bug name>`

Documentation and changes to the infrastructure are considered as features.

## Code Structure
```md
project-root/
  ├── src/                           # Backend/server code (NestJS, etc.)
  │   ├── auth/                      # Authentication module
  │   │   ├── controllers/           # Auth endpoints (login, register)
  │   │   ├── services/              # Auth business logic
  │   │   ├── guards/                # Route protection (JWT auth)
  │   │   └── dto/                   # Data transfer objects (validation)
  │   ├── database/                  # Database configuration and entities
  │   │   ├── entities/              # TypeORM entities (User, FileTransfer, etc.)
  │   │   └── migrations/            # Database schema changes
  │   ├── transfer/                  # File transfer business logic
  │   ├── user/                      # User management
  │   └── main.ts                    # Application entry point
  ├── dist/                          # Compiled backend JavaScript code
  ├── public/                        # Static assets served to browser
  │   ├── css/                       # Stylesheets (Bootstrap, custom)
  │   ├── js/                        # Compiled frontend JavaScript
  │   │   ├── crypto/                # Client-side encryption modules
  │   │   └── htmx.min.js            # HTMX for dynamic interactions
  │   ├── images/                    # Static images, logos, icons
  │   └── favicon/                  
  ├── frontend/                      # Frontend TypeScript source code
  │   ├── crypto/                    # Encryption/decryption modules
  │   │   ├── encryption.ts          # Streaming file encryption
  │   │   ├── key-manager.ts         # RSA/AES key operations
  │   │   ├── security-utils.ts      # Crypto utilities
  │   │   └── *.spec.ts              # Frontend unit tests
  │   └── components/                # Reusable frontend components
  ├── views/                         # Server-side templates (Pug)
  │   ├── auth/                      # Login/register pages
  │   ├── transfer/                  # File upload/download UI
  │   └── layout.pug                 # Base template
  ├── test/                          # End-to-end tests
  ├── infra/                         # Infrastructure as code
  │   ├── ansible/                   # Deployment automation
  │   └── terraform/                 # Cloud resource provisioning
  ├── documents/                     # Project documentation
  ├── package.json                   # Dependencies and scripts
  ├── tsconfig.json                  # Backend TypeScript config
  ├── tsconfig.public.json           # Frontend TypeScript config
  ├── jest.public.config.json        # Frontend test configuration
  └── docker-compose.yaml            # Local development environment
```

## Infrastructure    

### CI/CD

Currently, we have two different CI/CD workflows:
* the first one runs on every PR to main and will check that all tests pass, that the code build and respect the rules specified by our linter.
* the second one runs on every commit on main and does:
  * check the same things as in the workflow executed on PR
  * build and push a docker image of our sever tagged with 'latest' on the package repository of our GitHub organisation
  * deploy this latest build on our AWS staging environment

#### Deployment

##### Credentials

All the credentials needed for the deployment are stored in GitHub secrets. Each of those credentials must 
respect the least privilege principle. For example, the credentials for AWS are for a special IAM user having only 
access to the resources required by our terraform deployment. 

The EC2 instances also have a role attached to them to manage their access to other AWS resources. Like an S3 access
role dynamically created that only allows operation on the S3 bucket associated with the instance and nothing else.

##### Process

The deployments are made using Terraform and Ansible to have a fully reproducible and versioned infrastructure. 

With Terraform, we are creating an EC2 instance to host the app, defining strict firewall rule to protect it and
configuring a DNS entry dynamically to be able to access the instance. 

With Ansible, we install docker on the EC2 instance created (the instance is located using an Ansible dynamic inventory),
login to the organization Docker registry, and deploy our app using a simple docker-compose. It's important to note
that this docker-compose uses Caddy to automatically provision HTTPS certificates from LetsEncrypt.

#### Databases

The postgresql databases are hosted on the same server as our applicative code but in a separate docker container. 
This decision has been made to try to keep our cost as low as possible. The database is only accessible from within
the host as defined by our firewall configuration.

### Dockerfile

***it's important to maintain the [.dockerignore](../.dockerignore) to keep our image size as small as possible***

Our application docker image is using a multi-stage build to keep the final
image size as small as possible. It's based on an Alpine distribution to also reduce the size.
