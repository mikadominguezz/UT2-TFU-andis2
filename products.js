// products.js
// Almacén de productos en memoria para demo

const _products = [
  { id: 'p1', name: 'Producto 1', price: 100 },
  { id: 'p2', name: 'Producto 2', price: 200 },
];

// Generar ID simple incremental
function generateId() {
  return 'p' + (_products.length + 1);
}

// Listar todos los productos
function getAll() {
  return _products;
}

// Buscar producto por ID
function findById(id) {
  return _products.find(p => p.id === id);
}

// Crear un producto nuevo
function create({ name, price }) {
  const newProduct = { id: generateId(), name, price };
  _products.push(newProduct);
  return newProduct;
}

// Modificar un producto existente
function update(id, { name, price }) {
  const product = findById(id);
  if (!product) return null;
  if (name) product.name = name;
  if (price !== undefined) product.price = price;
  return product;
}

module.exports = { getAll, findById, create, update };
