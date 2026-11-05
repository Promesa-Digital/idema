// Simple simulation of cart merging logic (slug|modality key)
function keyOf(product, modality) {
  return `${product.slug}|${modality ?? ''}`
}

function addItem(items, product, price, modality) {
  const key = keyOf(product, modality)
  const existing = items.find(i => keyOf(i.product, i.modality) === key)
  if (existing) {
    return items.map(i => keyOf(i.product, i.modality) === key ? { ...i, quantity: i.quantity + 1 } : i)
  }
  return [...items, { product, quantity: 1, modality, price }]
}

function updateQuantity(items, identifier, quantity) {
  if (quantity <= 0) return items.filter(i => keyOf(i.product, i.modality) !== identifier)
  return items.map(i => keyOf(i.product, i.modality) === identifier ? { ...i, quantity } : i)
}

function totals(items) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)
  return { totalItems, totalPrice }
}

// Test products
const cursoA = { slug: 'curso-x', title: 'Curso X' }
const cursoB = { slug: 'curso-y', title: 'Curso Y' }

let items = []
items = addItem(items, cursoA, 100, 'presencial')
items = addItem(items, cursoA, 100, 'virtual')
items = addItem(items, cursoA, 100, 'presencial')
items = addItem(items, cursoB, 200)

console.log('Items after adds:')
console.log(items)
console.log('Totals:', totals(items))

// Update quantity for presencial
items = updateQuantity(items, keyOf(cursoA, 'presencial'), 1)
console.log('\nAfter updating presencial quantity to 1:')
console.log(items)
console.log('Totals:', totals(items))

// Remove virtual
items = updateQuantity(items, keyOf(cursoA, 'virtual'), 0)
console.log('\nAfter removing virtual:')
console.log(items)
console.log('Totals:', totals(items))

process.exit(0)
