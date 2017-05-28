import {flattenArray} from './state';
import {configuration} from '../bash-interpreter';

function interpretPipeline(pipeline, state) {
  let lastOutput = '';

  return flattenArray(pipeline.commands.map((command) => {
    command.fileDescriptors = {
      stdin: lastOutput
    };
    let outputList = configuration.commandTypeMap[command.type](command, state);
    lastOutput = outputList[outputList.length - 1].stdout;
    return outputList;
  }));
}

export {interpretPipeline};