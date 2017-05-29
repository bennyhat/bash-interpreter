jest.mock('../../src/helpers/fs');
jest.mock('bash-parser');
jest.mock('../../src/bash-interpreter');

import bash from '../../src/builtins/bash';
import fs from '../../src/helpers/fs';
import bashParser from 'bash-parser';
import {configuration} from '../../src/bash-interpreter';

describe('bash', () => {
  let fakeSubShell = jest.fn();

  beforeEach(() => {
    fakeSubShell.mockReset();
    fs.readFileSync.mockReset();
    bashParser.mockReset();

    configuration.commandTypeMap.Subshell = fakeSubShell;
  });

  describe('given a state, and no arguments', () => {
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
      output = bash(state, []);
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
  describe('given an environment scope, and a script file that fails to read/parse/interpret, etc.', () => {
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
      output = bash(state, ['script-file']);
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
  describe('given an environment scope, a script file, and a list of arguments', () => {
    let state = {
      fileDescriptors: {
        stdin: ['something']
      },
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

    let output = {};
    let passedState = {};

    beforeEach(() => {
      fs.readFileSync.mockReturnValue(scriptFileContents);
      bashParser.mockImplementation((script) => {
        if (script === 'fakeCommand something') {
          return parsedScriptFileContents;
        }
      });
      fakeSubShell.mockImplementation((subShell, state) => {
        passedState = state;
        return [{
          stdout: '',
          stderr: 'error',
          exitCode: 1
        }]
      });

      output = bash(state, ['script-file', 'arg1', 'arg2']);
    });

    it('reads from the file, then parses and interprets the contents', () => {
      expect(output[0].stdout).toEqual('');
    });
    it('returns nothing to stdout', () => {
      expect(output[0].stderr).toEqual('error');
    });
    it('returns a non-zero exit code', () => {
      expect(output[0].exitCode).toEqual(1);
    });
    it('passes the combined scopes and argument into a sub-shell as the state', () => {
      expect(fakeSubShell).toBeCalledWith(
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
            "commands": parsedScriptFileContents.commands
          }
        },
        {
          fileDescriptors: {
            stdin: ['something']
          },
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
        });
    });
    it('does not mutate the state that was passed in', () => {
      expect(state.commandScope).not.toEqual({});
    });
    it('passes the global file descriptors to the sub-shell', () => {
      expect(passedState.fileDescriptors === state.fileDescriptors).toEqual(true);
    });
  });
  describe('given an environment scope, a -c argument nothing else', () => {
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
      output = bash(state, ['-c']);
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
  describe('given an environment scope, a -c argument and a script in string form', () => {
    let state = {
      fileDescriptors: {
        stdin: ['something']
      },
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

    let output = {};
    let passedState = {};

    beforeEach(() => {
      bashParser.mockImplementation((script) => {
        if (script === 'fakeCommand something') {
          return parsedScriptString;
        }
      });

      fakeSubShell.mockImplementation((subShell, state) => {
        passedState = state;
        return [{
          stdout: 'something\n',
          stderr: '',
          exitCode: 0
        }]
      });

      output = bash(state, ['-c', 'fakeCommand something']);
    });

    it('parses the script string and interprets the contents', () => {
      expect(output[0].stdout).toEqual('something\n');
    });
    it('returns nothing to stdout', () => {
      expect(output[0].stderr).toEqual('');
    });
    it('returns a non-zero exit code', () => {
      expect(output[0].exitCode).toEqual(0);
    });

    it('passes the environment and arguments into the subshell', () => {
      expect(fakeSubShell).toBeCalledWith(
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
            "commands": parsedScriptString.commands
          }
        },
        {
          fileDescriptors: {
            stdin: ['something']
          },
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
      );
    });
    it('does not mutate the state that was passed in', () => {
      expect(state.commandScope).not.toEqual({});
    });
    it('passes the global file descriptors to the sub-shell', () => {
      expect(passedState.fileDescriptors === state.fileDescriptors).toEqual(true);
    });
  });
  describe('given an environment scope, and any other flags as the first parameter', () => {
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
      output = bash(state, ['-d']);
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