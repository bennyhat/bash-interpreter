import {flattenArray} from './state';
import BlockFile from './block-file';
import {configuration} from '../bash-interpreter';

function interpretPipeline(pipeline, state) {
  return flattenArray(pipeline.commands.map((command) => {
    let output = configuration.commandTypeMap[command.type](command, state);
    state.fileDescriptors.stdin = new BlockFile();
    state.fileDescriptors.stdin.write(output[output.length - 1].stdout);
    return output;
  }));
}

export {interpretPipeline};