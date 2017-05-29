import {flattenArray} from './state';
import {configuration} from '../bash-interpreter';

function interpretPipeline(pipeline, state) {
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

    let output = configuration.commandTypeMap[subShelledCommand.type](subShelledCommand, state);
    state.fileDescriptors.stdin = [];
    state.fileDescriptors.stdin.push(output[output.length - 1].stdout);
    return output;
  }));
}

export {interpretPipeline};