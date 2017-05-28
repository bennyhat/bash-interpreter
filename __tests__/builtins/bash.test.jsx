jest.mock('../../src/helpers/fs');
jest.mock('bash-parser');
jest.mock('../../src/bash-interpreter');

import bash from '../../src/builtins/bash';
import fs from '../../src/helpers/fs';
import bashParser from 'bash-parser';
import bashInterpreter from '../../src/bash-interpreter';

describe('bash', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fs.readFileSync.mockClear();
    bashParser.mockClear();
    bashInterpreter.mockClear();
    fakeCommand.mockClear();
  });

  describe('given a state, file descriptors, and no arguments', () => {
    let state = {
      shellScope: {
        'a': 'b'
      },
      commandScope: {
        'c': 'd'
      },
      exportedScope: {
        'e': 'f'
      }
    };
    let output = {};

    beforeEach(() => {
      output = bash(state, {}, []);
    });

    it('returns stderr indicating how to use this command', () => {
      expect(output.stderr).toMatch(/^USAGE:.*?/);
    });
    it('returns nothing to stdout', () => {
      expect(output.stdout).toEqual('');
    });
    it('returns a non-zero exit code', () => {
      expect(output.exitCode).not.toEqual(0);
      expect(output.exitCode).toBeDefined();
    });
  });
  describe('given a state, file descriptors, and a script file that fails to read/parse/interpret, etc.', () => {
    let state = {
      shellScope: {
        'a': 'b'
      },
      commandScope: {
        'c': 'd'
      },
      exportedScope: {
        'e': 'f'
      }
    };
    let output = {};

    beforeEach(() => {
      fs.readFileSync.mockImplementation(() => {
        throw 'file not found'
      });
      output = bash(state, {}, ['script-file']);
    });

    it('returns text indicating that the file was not found/or read', () => {
      expect(output.stderr).toMatch(/^ERROR:.*?error interpreting script/);
    });
    it('returns nothing to stdout', () => {
      expect(output.stdout).toEqual('');
    });
    it('returns a non-zero exit code', () => {
      expect(output.exitCode).not.toEqual(0);
      expect(output.exitCode).toBeDefined();
    });
  });
  describe('given a state, file descriptors, a script file, and a list of arguments', () => {
    let state = {
      shellScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e',
        'x': 'z'
      },
      commandScope: {
        'c': 'd'
      },
      exportedScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e'
      }
    };

    let scriptFileContents = 'fakeCommand something';
    let parsedScriptFileContents = {
      "type": "Script",
      "commands": [
        {
          "type": "Command",
          "name": {
            "text": "fakeCommand",
            "type": "Word"
          },
          "suffix": [
            {
              "text": "something",
              "type": "Word"
            }
          ]
        }
      ]
    };
    let interpreterInput = {
      "type": "Script",
      "commands": [
        {
          "type": "Command",
          "fileDescriptors": {
            "stdin": "something"
          },
          "name": {
            "text": "fakeCommand",
            "type": "Word"
          },
          "suffix": [
            {
              "text": "something",
              "type": "Word"
            }
          ]
        }
      ]
    };

    let output = {};

    beforeEach(() => {
      fs.readFileSync.mockReturnValue(scriptFileContents);
      bashParser.mockImplementation((script) => {
        if (script === 'fakeCommand something') {
          return parsedScriptFileContents;
        }
      });
      bashInterpreter.mockImplementation((incomingState) => {
        if (incomingState.parserOutput === parsedScriptFileContents) {
          return {
            interpreterOutput: {
              stdout: '',
              stderr: 'error',
              exitCode: 1
            }
          };
        }
      });

      output = bash(state, {stdin: 'something'}, ['script-file', 'arg1', 'arg2']);
    });

    it('reads from the file, then parses and interprets the contents', () => {
      expect(output.stdout).toEqual('');
    });
    it('returns nothing to stdout', () => {
      expect(output.stderr).toEqual('error');
    });
    it('returns a non-zero exit code', () => {
      expect(output.exitCode).toEqual(1);
    });

    it('passes the combined scopes and argument into the interpreter as shell and exported scopes', () => {
      expect(bashInterpreter).toBeCalledWith({
        parserOutput: interpreterInput,
        interpreterState: {
          exportedScope: {
            'a': 'b',
            'c': 'd',
            'd': 'e'
          },
          shellScope: {
            'a': 'b',
            'c': 'd',
            'd': 'e',
            '0': 'script-file',
            '1': 'arg1',
            '2': 'arg2'
          },
          commandScope: {}
        }
      });
    });
    it('does not mutate the state that was passed in', () => {
      expect(state.commandScope).not.toEqual({});
    });
  });
  describe('given a state, file descriptors, a -c argument nothing else', () => {
    let state = {
      shellScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e',
        'x': 'z'
      },
      commandScope: {
        'c': 'd'
      },
      exportedScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e'
      }
    };

    let output = {};

    beforeEach(() => {
      output = bash(state, {}, ['-c']);
    });

    it('returns text indicating proper usage of the command', () => {
      expect(output.stderr).toMatch(/^USAGE:.*?/);
    });
    it('returns nothing to stdout', () => {
      expect(output.stdout).toEqual('');
    });
    it('returns a non-zero exit code', () => {
      expect(output.exitCode).not.toEqual(0);
      expect(output.exitCode).toBeDefined();
    });
  });
  describe('given a state, file descriptors, a -c argument and a script in string form', () => {
    let state = {
      shellScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e',
        'x': 'z'
      },
      commandScope: {
        'c': 'd'
      },
      exportedScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e'
      }
    };

    let parsedScriptString = {
      "type": "Script",
      "commands": [
        {
          "type": "Command",
          "name": {
            "text": "fakeCommand",
            "type": "Word"
          },
          "suffix": [
            {
              "text": "something",
              "type": "Word"
            }
          ]
        }
      ]
    };
    let interpreterInput = {
      "type": "Script",
      "commands": [
        {
          "type": "Command",
          "fileDescriptors": {
            "stdin": "something"
          },
          "name": {
            "text": "fakeCommand",
            "type": "Word"
          },
          "suffix": [
            {
              "text": "something",
              "type": "Word"
            }
          ]
        }
      ]
    };

    let output = {};

    beforeEach(() => {
      bashParser.mockImplementation((script) => {
        if (script === 'fakeCommand something') {
          return parsedScriptString;
        }
      });
      bashInterpreter.mockImplementation((incomingState) => {
        if (incomingState.parserOutput === parsedScriptString) {
          return {
            interpreterOutput: {
              stdout: 'something\n',
              stderr: '',
              exitCode: 0
            }
          };
        }
      });

      output = bash(state, {stdin:'something'}, ['-c', 'fakeCommand something']);
    });

    it('parses the script string and interprets the contents', () => {
      expect(output.stdout).toEqual('something\n');
    });
    it('returns nothing to stdout', () => {
      expect(output.stderr).toEqual('');
    });
    it('returns a non-zero exit code', () => {
      expect(output.exitCode).toEqual(0);
    });

    it('passes the environment and arguments into the interpreter as shell scope', () => {
      expect(bashInterpreter).toBeCalledWith({
        parserOutput: interpreterInput,
        interpreterState: {
          exportedScope: {
            'a': 'b',
            'c': 'd',
            'd': 'e'
          },
          shellScope: {
            'a': 'b',
            'c': 'd',
            'd': 'e',
            '0': 'bash'
          },
          commandScope: {}
        }
      });
    });
  });
  describe('given a state, file descriptors, and any other flags as the first parameter', () => {
    let state = {
      shellScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e',
        'x': 'z'
      },
      commandScope: {
        'c': 'd'
      },
      exportedScope: {
        'a': 'b',
        'c': 'f',
        'd': 'e'
      }
    };

    let output = {};

    beforeEach(() => {
      output = bash(state, {}, ['-d']);
    });

    it('returns text indicating proper usage of the command', () => {
      expect(output.stderr).toMatch(/^USAGE:.*?/);
    });
    it('returns nothing to stdout', () => {
      expect(output.stdout).toEqual('');
    });
    it('returns a non-zero exit code', () => {
      expect(output.exitCode).not.toEqual(0);
      expect(output.exitCode).toBeDefined();
    });
  });
});