import { program } from 'commander';
import * as main from './main';

program
  .name('function-runner')
  .description('CLI to run specific functions from main module with optional arguments')
  .version('0.1.0')
  .argument('<functionName>', 'name of the function to execute')
  .argument('[arg]', 'optional argument for the function')
  .action((functionName, arg) => {
    const fn = (main as any)[functionName];
    if (typeof fn === 'function') {
      fn(arg); // Passing the optional argument to the function
    } else {
      console.error('Function does not exist:', functionName);
    }
  });

program.parse(process.argv);