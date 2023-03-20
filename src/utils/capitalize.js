const capitalize = ([first, ...rest], isRestLower = true) => {
  return first.toUpperCase() + (isRestLower ? rest.join('').toLowerCase() : rest.join(''));
}

module.exports = capitalize;