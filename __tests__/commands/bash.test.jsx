jest.mock('../../src/helpers/fs');
jest.mock('bash-parser');
jest.mock('../../src/interpret-script');

import bash from '../../src/commands/bash';
import fs from '../../src/helpers/fs';
import bashParser from 'bash-parser';
import {interpretScript} from '../../src/interpret-script';

describe('bash', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fs.readFileSync.mockClear();
    bashParser.mockClear();
    interpretScript.mockClear();
    fakeCommand.mockClear();
  });
  describe('given an environment scope, and no arguments', () => {
    let environment = {
      'a': 'b'
    };
    let output = '';

    beforeEach(() => {
      output = bash(environment, []);
    });

    it('returns text indicating that interactive bash is not supported', () => {
      expect(output).toMatch(/^ERROR:.*?not supported/);
    });
  });
  describe('given an environment scope, and a script file that fails to read/parse/interpret, etc.', () => {
    let environment = {
      'a': 'b'
    };
    let output = '';

    beforeEach(() => {
      fs.readFileSync.mockImplementation(() => {
        throw 'file not found'
      });
      output = bash(environment, ['script-file']);
    });

    it('returns text indicating that the file was not found/or read', () => {
      expect(output).toMatch(/^ERROR:.*?error interpreting script-file/);
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
            },
            {
              "text": "arg1",
              "type": "Word"
            },
            {
              "text": "arg2",
              "type": "Word"
            }
          ]
        }
      ]
    };

    let output = '';

    beforeEach(() => {
      fs.readFileSync.mockReturnValue(scriptFileContents);
      bashParser.mockImplementation((script) => {
        if(script === 'fakeCommand something') {
          return parsedScriptFileContents;
        }
      });
      interpretScript.mockImplementation((incomingState) => {
        if (incomingState.parserOutput === parsedScriptFileContents) {
          return {interpreterOutput: 'something\n'};
        }
      });

      output = bash(environment, ['script-file', 'arg1', 'arg2']);
    });

    it('reads from the file, then parses and interprets the contents', () => {
      expect(output).toEqual('something\n');
    });

    it('passes the environment and arguments into the interpreter as shell scope', () => {
      expect(interpretScript).toBeCalledWith({
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
});