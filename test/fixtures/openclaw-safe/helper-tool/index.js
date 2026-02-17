function processText(input) {
  return input.trim().toUpperCase();
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

module.exports = { processText, countWords };
