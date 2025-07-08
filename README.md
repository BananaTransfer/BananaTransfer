# BananaTransfer
BananaTransfer

## Install Node.js

Make sure to have Node.js 22 installed on the machine.

To install it, the version manager nvm can be used:

```bash
nvm install 22
nvm use 22
```

```bash
# or install it manually
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Project setup for local development

```bash
npm install
```

Create file `.env` with the configuration variables
```
# .env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=bananatransfer_user
DB_PASS=bananatransfer_password
DB_NAME=bananatransfer

S3_ENDPOINT=http://localhost:9000
S3_REGION=eu-west-1
S3_CLIENT_ID=minio_user
S3_CLIENT_SECRET=minio_password
S3_BUCKET=bananatransfer
```

Start the local infrastructure with: 
```bash
docker compose up 
```

Then you can run the app in watch mode with
```bash
npm run start:dev
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).
