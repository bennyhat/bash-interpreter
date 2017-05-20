import {expandText} from '../../src/helpers/expansion';

jest.mock('../../src/interpret-script.jsx');
import {interpretScript} from '../../src/interpret-script.jsx';

// TODO - stub the underlying expanders and add unit tests to commands helper
describe('expansion', () => {
  describe('#expandText() given text with replaceable tokens, a parameter expansion list and a from scope', () => {
    const replaceableText = '${c}something$d';
    const expansionList = [
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
    ];
    const fromScopeList = [{
      'c': 'g',
      'd': 'h'
    }];
    let replacedText = '';

    beforeEach(() => {
      replacedText = expandText(replaceableText, expansionList, fromScopeList);
    });

    it('adds the variable to the to scope', () => {
      expect(replacedText).toEqual('gsomethingh');
    });
  });
  describe('#expandText() given text with replaceable tokens, a command expansion list and a from scope', () => {
    const replaceableText = 'a$(fakeCommand something)b';
    const expansionList = [
      {
        "loc": {
          "start": 1,
          "end": 24
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
    ];
    const fromScopeList = [{
      'c': 'g',
    }];
    let replacedText = '';

    beforeEach(() => {
      interpretScript.mockClear();
      interpretScript.mockReturnValue({interpreterOutput: 'something'});
      replacedText = expandText(replaceableText, expansionList, fromScopeList);
    });

    it('adds the variable to the to scope', () => {
      expect(replacedText).toEqual('asomethingb');
    });
  });
});