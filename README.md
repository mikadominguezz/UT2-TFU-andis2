# UT2-TFU Andis II

## Pasos para correrlo:
1. npm install
2. docker compose up --build
3. npx serve

## Pasos para el postman:

### GetHealth
GET http://localhost:8080/health

### LoginWithAlice
POST http://localhost:8080/login <br />
**Body**
{
  "username": "alice",
  "password": "alicepass"
}

### LoginWithAlice
POST http://localhost:8080/login <br />
**Body**
{
  "username": "bob",
  "password": "bobpass"
}

### ProtectedWithTokenAlice
GET http://localhost:8080/protected <br />
**Headers** <br /> 
Key: Authorization <br />
Value: Bearer <Token id de Alice>

### ProtectedWithTokenBob
GET http://localhost:8080/protected <br />
**Headers** <br />
Key: Authorization <br />
Value: Bearer <Token id de Bob>

### AdminOnly
GET http://localhost:3001/admin-only <br />
**Headers** <br />
Key: Authorization <br />
Value: Bearer <Token id de Bob>

### ListOfProductsAlice
GET http://localhost:8080/products <br />
**Headers** <br />
Key: Authorization <br />
Value: Bearer <Token id de Alice> <br />

### CreateProduct
POST http://localhost:8080/products <br />
**Headers** <br />
Key: Authorization <br />
Value: Bearer <Token id de Bob> <br />
**Body** <br />
{
  "name": "Producto 3",
  "price": 300
}

### ModifyProduct
POST http://localhost:8080/products <br />
**Headers** <br />
Key: Authorization <br />
Value: Bearer <Token id de Bob> <br />
**Body** <br />
{
  "name": "Producto 3",
  "price": 300
}