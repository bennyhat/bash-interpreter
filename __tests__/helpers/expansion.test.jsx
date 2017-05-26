jest.mock('../../src/helpers/commands');
jest.mock('../../src/helpers/parameters');
import {expandCommand} from '../../src/helpers/commands';
import {expandParameter} from '../../src/helpers/parameters';
import {expandTextBlocks} from '../../src/helpers/expansion'

describe('expansion', () => {
  describe('#expandTextBlocks() given text with replaceable tokens, a parameter expansion list and an interpreter state', () => {
    const suffixes = [
      {
        "text": "${c}something$d",
        "expansion": [
          {
            "loc": {
              "start": 0,
              "end": 3
            },
            "parameter": "c",
            "type": "ParameterExpansion"
          },
          {
            "loc": {
              "start": 13,
              "end": 14
            },
            "parameter": "d",
            "type": "ParameterExpansion"
          }
        ],
        "type": "Word"
      }
    ];
    const state = {
      commandScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let replacedText = '';

    beforeEach(() => {
      replacedText = expandTextBlocks(suffixes, state);
    });

    it('calls the expandParameter function with the first expansion parameter and the state', () => {
      expect(expandParameter).toBeCalledWith('c', state);
    });
    it('calls the expandParameter function with the second expansion parameter and the state', () => {
      expect(expandParameter).toBeCalledWith('d', state);
    });
  });
  describe('#expandTextBlocks() given text with replaceable tokens, a command expansion list and an interpreter state', () => {
    const suffixes = [
      {
        "text": "$(fakeCommand something)",
        "expansion": [
          {
            "loc": {
              "start": 0,
              "end": 23
            },
            "command": "fakeCommand something",
            "type": "CommandExpansion",
            "commandAST": {
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
            }
          }
        ],
        "type": "Word"
      }
    ];
    const state = {
      exportedScope: {
        'c': 'd'
      },
      shellScope: {
        'a': 'b'
      }
    };
    let replacedText = '';

    beforeEach(() => {
      expandCommand.mockReset();
      replacedText = expandTextBlocks(suffixes, state);
    });

    it('calls expandCommand with the expansions and the state', () => {
      expect(expandCommand).toBeCalledWith(suffixes[0].expansion[0], state);
    });
  });
});