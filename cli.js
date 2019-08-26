#!/usr/bin/env node
const cli = require('commander');
const { createCommandHandler, listCommandHandler, showCommandHandler, interactiveCreateCommandHandler } = require('./src/cliCommandHandlers')
cli
  .command('create <commandName>')
  .option(
    '-f, --folder <folder>',
    'Folder name that the template will be generated into', ''
  )
  .option(
    '--entry-point <value>',
    'The entry point to generate the template into (Absolute path)'
  )
  .option(
    '--load-from <value>',
    'A path to a ctf folder from which to load the templates.'
  )
  .alias('c')
  .description('Create template folder structure')
  .action(createCommandHandler);


cli
  .command('interactive-create', 'The same as create but in interactive mod')
  .option(
    '--entry-point <value>',
    'The entry point to be used instead of the current working directory'
  )
  .alias('i')
  .description('Create template folder structure')
  .action(interactiveCreateCommandHandler);

cli
  .command('list')
  .alias('ls')
  .description('Show all available commands and their paths')
  .action(listCommandHandler);

cli
  .command('show <commandName>')
  .alias('s')
  .description('Show specific command corresponding template files')
  .option('-w, --showContent')
  .action(showCommandHandler);

cli.parse(process.argv);
