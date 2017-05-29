import Stream from 'stream';
const dataKey = Symbol('data');

class BlockFile extends Stream.Duplex {
  constructor(source, options = {}) {
    super(options);
    this.setEncoding('utf8');
    this[dataKey] = source || [];
  }

  _write(chunk, encoding, callback) {
    chunk = chunk.toString();
    this[dataKey] = this[dataKey].concat(chunk.split('\n'));
    callback();
  }

  _read(size) {
    let chunk = this[dataKey].shift() || '';
    this.push(Buffer.from(chunk));
    return chunk;
  }
}

export default BlockFile;