## Description

Test assignment for Simplicity

## Project setup

1. Install dependencies from package-lock.json
```bash 
  npm ci
```
2. Install and start [Docker](https://docs.docker.com/compose/install/)
3. Start container and check its status
```bash
  docker-compose up -d
  docker ps
 ```
4. Run migrations 
```bash 
  npm run migrations:run
```
5. Seed database for testing
```bash 
  npm run db:seed
```
6. Run project in DEV mode
```bash 
  npm run start:dev
```

## Endpoints

GraphQL allows schema introspection and endpoints overview.  
For endpoints documentation and testing use [Postman](https://www.postman.com/downloads/) or [Apollo Sandbox](https://studio.apollographql.com/sandbox/explorer)


--------
Produced By
```
 ___  ____   _____     ____    ____  ____  _____  
|_  ||_  _| |_   _|   |_   \  /   _||_   \|_   _| 
  | |_/ /     | |       |   \/   |    |   \ | |   
  |  __'.     | |   _   | |\  /| |    | |\ \| |   
 _| |  \ \_  _| |__/ | _| |_\/_| |_  _| |_\   |_  
|____||____||________||_____||_____||_____|\____| 
```
