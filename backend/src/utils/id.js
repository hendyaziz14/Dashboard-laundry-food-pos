function nextOrderNo(prefix, counterValue) {
  const padded = String(counterValue).padStart(4, "0");
  return `${prefix}-${padded}`;
}

module.exports = { nextOrderNo };
