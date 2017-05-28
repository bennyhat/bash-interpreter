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
    let output = {};

    beforeEach(() => {
      output = builtinExport(incomingState, {stdin: ''}, ['a=b']);
    });

    it('adds the variable to the exported scope', () => {
      expect(incomingState.exportedScope).toEqual({
        'a': 'b'
      });
    });
    it('adds the variable to the shell scope', () => {
      expect(incomingState.shellScope).toEqual({
        'a': 'b',
        'c': 'd',
        'd': 'e'
      });
    });
    it('returns a successful output', () => {
      expect(output).toEqual({
        stdout: '',
        stderr: '',
        exitCode: 0
      })
    });
  });
});