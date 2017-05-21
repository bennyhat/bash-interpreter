jest.mock('../../src/helpers/fs');
jest.mock('bash-parser');
jest.mock('../../src/bash-interpreter');

import bash from '../../src/commands/bash';
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

  describe('given an environment scope, and no arguments', () => {
    let environment = {
      'a': 'b'
    };
    let output = {};

    beforeEach(() => {
      output = bash(environment, []);
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
    let environment = {
      'a': 'b'
    };
    let output = {};

    beforeEach(() => {
      fs.readFileSync.mockImplementation(() => {
        throw 'file not found'
      });
      output = bash(environment, ['script-file']);
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
    let environment = {
      'a': 'b'
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

    beforeEach(() => {
      fs.readFileSync.mockReturnValue(scriptFileContents);
      bashParser.mockImplementation((script) => {
        if(script === 'fakeCommand something') {
          return parsedScriptFileContents;
        }
      });
      bashInterpreter.mockImplementation((incomingState) => {
        if (incomingState.parserOutput === parsedScriptFileContents) {
          return {interpreterOutput: 'something\n'};
        }
      });

      output = bash(environment, ['script-file', 'arg1', 'arg2']);
    });

    it('reads from the file, then parses and interprets the contents', () => {
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
        parserOutput: parsedScriptFileContents,
        interpreterState: {
          shellScope: {
            'a':'b',
            '0':'script-file',
            '1':'arg1',
            '2':'arg2'
          }
        }
      });
    });
  });
  describe('given an environment scope, a -c argument nothing else', () => {
    let environment = {
      'a': 'b'
    };

    let output = {};

    beforeEach(() => {
      output = bash(environment, ['-c']);
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
    let environment = {
      'a': 'b'
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

    beforeEach(() => {
      bashParser.mockImplementation((script) => {
        if(script === 'fakeCommand something') {
          return parsedScriptString;
        }
      });
      bashInterpreter.mockImplementation((incomingState) => {
        if (incomingState.parserOutput === parsedScriptString) {
          return {interpreterOutput: 'something\n'};
        }
      });

      output = bash(environment, ['-c', 'fakeCommand something']);
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
        parserOutput: parsedScriptString,
        interpreterState: {
          shellScope: {
            'a':'b',
            '0':'bash'
          }
        }
      });
    });
  });
  describe('given an environment scope, and any other flags as the first parameter', () => {
    let environment = {
      'a': 'b'
    };

    let output = {};

    beforeEach(() => {
      output = bash(environment, ['-d']);
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