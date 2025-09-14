module.exports.heavyComputation = async function heavyComputation() {
  // simular trabajo async pesado
  await new Promise(r => setTimeout(r, 1500)); // 1.5s
  // resultado pseudo-determinístico
  return { ts: Date.now(), payload: 'resultado-costoso' };
};