const { Readable } = require('stream');

/**
 * @param {Buffer} binary
 * @returns {Readable} readableInstanceStream
 */
const bufferToStream = binary => {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    }
  });

  return readableInstanceStream;
}

module.exports = bufferToStream;