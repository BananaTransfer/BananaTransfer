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
if you check those things before commiting. 

### Git 

We don't enforce any commit message format but use git flow like branch naming convention. 

* Any branch that add a feature must be name `feature/<feature name>`
* Any branch that fix a bug must be named `hotfix/<bug name>`

Documentation and changes to the infrastructure are considered as features.

## Infrastructure    

### CI/CD

Currently, we have two different CI/CD workflows:
* the first one runs on every PR to main and will check that all tests pass, that the code build and respect the rules specified by our linter.
* the second one runs on every commit on main and does:
  * check the same things as in the workflow executed on PR
  * build and push a docker image of our sever tagged with 'latest' on the package repository of our GitHub organisation
  * deploy this latest build on our AWS staging environment

#### Staging deployment

##### Credentials

All the credentials needed for the deployment are stored in GitHub secrets. Each of those credentials must 
respect the least privilege principle. For example, the credentials for AWS are for a special IAM user having only 
access to the resources required by our terraform deployment. 

##### Process

The deployments are made using Terraform and Ansible to have a fully reproducible and versioned infrastructure. 

With Terraform, we are creating an EC2 instance to host the app, defining strict firewall rule to protect it and
configuring a DNS entry dynamically to be able to access the instance. 

With Ansible, we install docker on the EC2 instance created (the instance is located using an Ansible dynamic inventory),
login to the organization Docker registry, and deploy our app using a simple docker-compose. It's important to note
that this docker-compose uses Caddy to automatically provision HTTPS certificates from LetsEncrypt.

### Dockerfile

***it's important to maintain the [.dockerignore](../.dockerignore) to keep our image size as small as possible***

Our application docker image is using a multi-stage build to keep the final
image size as small as possible. It's based on an Alpine distribution to also reduce the size.
