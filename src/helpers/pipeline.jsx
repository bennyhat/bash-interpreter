import {flattenArray, copyAndMergeState} from './state';
import {configuration} from '../bash-interpreter';

function interpretPipeline(pipeline, state) {
  let subShelledState = copyAndMergeState(state);
  subShelledState.fileDescriptors = state.fileDescriptors;

  return flattenArray(pipeline.commands.map((command) => {

    let subShelledCommand = command.type === 'Subshell' ?
      command :
      {
        "type": "Subshell",
        "list": {
          "type": "CompoundList",
          "commands": [
            command
          ]
        }
      };

    let outputList = flattenArray(configuration.commandTypeMap[subShelledCommand.type](subShelledCommand, subShelledState));
    let output = flattenArray(outputList.map((output) => {
      return output.stdout;
    })).filter((output) => {
      return output !== '';
    });

    subShelledState = copyAndMergeState(state);
    subShelledState.fileDescriptors.stdin = output;
    return outputList;
  }));
}

export {interpretPipeline};