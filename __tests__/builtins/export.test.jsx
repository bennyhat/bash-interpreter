import builtinExport from '../../src/builtins/export';

describe('builtinExport', () => {
  describe('given the interpreter state, and an export command with an assignment', () => {
    let incomingState = {
      shellScope: {
        'c': 'd',
        'd': 'e'
      },
      commandScope: {},
      exportedScope: {}
    };
    let newState = {};

    beforeEach(() => {
      newState = builtinExport(incomingState, ['a=b']);
    });

    it('adds the variable to the exported scope', () => {
      expect(newState.exportedScope).toEqual({'a': 'b'});
    });
    it('adds the variable to the shell scope', () => {
      expect(newState.shellScope).toEqual({
        'a': 'b',
        'c': 'd',
        'd': 'e'
      });
    });
  });
});