import yargs from 'yargs'
import {fromFiles} from './lib'

const argv = yargs
  .option('type', {
    alias: 't',
    default: 'State',
    describe: 'The root state type name'
  })
  .usage('$0 <file>', 'Generate lenses from a state tree', () => {
    return yargs.positional('file', {
      describe: 'Entry point'
    })
  }).argv

const statements = fromFiles(yargs.argv._, argv.type)
statements.forEach(statement => console.log(statement))
