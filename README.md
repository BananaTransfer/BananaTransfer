<div align="center">
  <img src="public/images/logo.png" alt="Logo" width="200"/>
</div>

# BananaTransfer  
## Decentralized Secure File Sharing with End-to-End Encryption
Despite the rise of cloud-based file sharing platforms like SwissTransfer, and WeTransfer, or even some services trying to offer better security features like Tresorit, there remains a gap in the market for a truly decentralized, secure, and user-controlled file sharing solution. Existing services often rely on centralized infrastructure, exposing users to risks around privacy, data ownership, and single points of failure. **BananaTransfer** addresses these limitations by introducing an innovative approach allowing users to share files securely and privately, without depending on intermediaries or centralized servers. **BananaTransfer** is the most secure way to share files with your team, featuring zero-knowledge architecture and complete transparency via open-source code. Your files are encrypted before they leave your device - your data remains yours and you don't rely on cloud providers' servers to transfer and store your data.

## Features
- End-to-End Encryption: Files are protected with AES-256 encryption and RSA-4096 key exchange—security standards trusted by banks and governments.
- Zero-Knowledge Architecture: Even BananaTransfer can’t access your files.
- Self-Managed Security: You control your encryption keys. Your master password never leaves your device.
- Open Source: No black boxes, no hidden backdoors. Host your own server for full control.
- Cross-Platform: Access BananaTransfer from any device, anywhere. No downloads required.
- Enterprise Federation: Share files securely between organizations while maintaining end-to-end encryption.
- Intuitive & Fast: Secure file sharing is as easy as email. Onboard your team in minutes.

## How It Works
1. Create Your Account: Sign up with your organization’s BananaTransfer server. Registration takes less than 5 minutes!
2. Generate Your Keys: Automatic RSA-4096 key generation in your browser. Your keys and master password never leave your device.
3. Share Files: Drag, drop, and share files instantly. Files are encrypted before upload, recipients are notified immediately.
4. Receive & Download: Access shared files from any device, anywhere, anytime. Files decrypt automatically upon download.

## Secure by Design:
- Military-Grade Encryption: AES-256 and RSA-4096 for file transfer and storage.
- Self-Managed Keys: Total ownership of your encryption keys and master password.
- Open Source Trust: Audit, fork, or self-host BananaTransfer.
- Works Everywhere: Responsive design for desktop, tablet, and mobile.
- Enterprise Federation: Scalable for partnerships and multi-organization workflows.
- User-Friendly: 5-minute setup, guided onboarding for end users.

## Meet the team

| Gwenaël Ansermoz | Glodi Domingos | Dominik Saul | Maxime Schaller |
|:-----------------|:---------------|:-------------|:----------------|
| Data Engineering | IT Security | IT Security | Data Engineering |

## Support
Any questions? [Open an issue](https://github.com/BananaTransfer/BananaTransfer/issues)

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

Setup the project git hooks:
```bash
make setup
```

Install the required dependencies:
```bash
npm install
```

Create file `.env` with the configuration variables
```
# .env
# Environment configuration
PORT=3000

# Application configuration
DOMAIN=domain.com

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=bananatransfer_user
DB_PASS=bananatransfer_password
DB_NAME=bananatransfer

# S3 configuration
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
