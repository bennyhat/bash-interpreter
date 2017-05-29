import BlockFile from '../../src/helpers/block-file';

describe('BlockFile', () => {
  let subject;
  beforeEach(() => {
    subject = new BlockFile();
  });
  describe('#write() given a string', () => {
    beforeEach(() => {
      subject.write('something');
    });
    it('writes the string so its readable once', () => {
      expect(subject.read()).toEqual('something');
    });
  });
  describe('#write() given a multi-line string', () => {
    beforeEach(() => {
      subject.write('something\nmore stuff');
    });
    it('writes the string so its readable twice', () => {
      expect(subject.read()).toEqual('something');
      expect(subject.read()).toEqual('more stuff');
      expect(subject.read()).toEqual(null);
    });
  });
});