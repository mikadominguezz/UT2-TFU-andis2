// productos hardcodeados

const _products = [
  { id: 'p1', name: 'Producto 1', price: 100 },
  { id: 'p2', name: 'Producto 2', price: 200 },
];

function generateId() {
  return 'p' + (_products.length + 1);
}

function getAll() {
  return _products;
}

function findById(id) {
  return _products.find(p => p.id === id);
}

function create({ name, price }) {
  const newProduct = { id: generateId(), name, price };
  _products.push(newProduct);
  return newProduct;
}

function update(id, { name, price }) {
  const product = findById(id);
  if (!product) return null;
  if (name) product.name = name;
  if (price !== undefined) product.price = price;
  return product;
}

module.exports = { getAll, findById, create, update };
