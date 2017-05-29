import {configuration} from '../../src/bash-interpreter';
import {interpretSubShell} from '../../src/helpers/sub-shell';

describe('subShell', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    configuration.commandTypeMap.Command = fakeCommand;
  });

  describe('#interpretSubShell() given pipeline of commands', () => {
    const subShell = {
      "type": "Subshell",
      "list": {
        "type": "CompoundList",
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
      }
    };
    const state = {
      fileDescriptors: {
        stdin: ['something', 'more']
      },
      exportedScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let output = {};
    let statePassedToCommand = {};

    beforeEach(() => {
      fakeCommand.mockImplementation((command, state) => {
        statePassedToCommand = state;
      });
      output = interpretSubShell(subShell, state);
    });

    it('calls the command with the correct arguments', () => {
      expect(fakeCommand).toBeCalledWith(subShell.list.commands[0], state);
    });

    it('sends a copy of the state to the command in the sub-shell', () => {
      expect(state === statePassedToCommand).toEqual(false);
    });
  });
});