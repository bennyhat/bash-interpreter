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

    let output = configuration.commandTypeMap[subShelledCommand.type](subShelledCommand, subShelledState);
    subShelledState = copyAndMergeState(state);
    subShelledState.fileDescriptors.stdin = [];
    subShelledState.fileDescriptors.stdin.push(output[output.length - 1].stdout);
    return output;
  }));
}

export {interpretPipeline};