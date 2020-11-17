import { injector, extractKey } from './index';
import { MissingKeyValuePairs, MissingTransformerImplementation } from '../Errors';
import {Config} from '../Config';
import {getConfigObject} from '../Config/index.spec';
describe('templatesCreator -> injector', () => {
	it('should replace all keys matching the folllwing format {{ key }}', () => {
		const keys = {
			key1: 'React',
			key2: 'react',
		};
		const testTemplate = 'import {{key1}} from "{{key2}}"';
		const keysInjector = injector(keys);
		expect(keysInjector(testTemplate)).toBe('import React from "react"');
	});

	it('should ignore outer {} so this is also valid { {{}} }', () => {
		const keys = {
			key1: 'The',
			key2: 'Fuck',
		};
		const testTemplate = 'What {{{ key1 }}} {{{key2}}}';
		const keysInjector = injector(keys);
		expect(keysInjector(testTemplate)).toBe('What {The} {Fuck}');
	});

	it('should throw MissingKeyValuePairs if there is no key matching one of the keys in the template', () => {
		const keys = {
			key1: 'The',
			key2: 'Fuck',
		};
		const testTemplate = 'What {{{key1}}} {{{key2}}} {{key3}}';
		const keysInjector = injector(keys);
		expect(() => keysInjector(testTemplate)).toThrow(MissingKeyValuePairs);
	});

	it('should ignore white spaces around the keys', () => {
		const keys = {
			key1: 'The',
			key2: 'Fuck',
		};
		const testTemplate = 'What {{{key1 }}} {{{  key2  }}} {{  key3 }}';
		const keysInjector = injector(keys);
		expect(() => keysInjector(testTemplate)).toThrow(MissingKeyValuePairs);
	});

	it('should handle a full template', () => {
		const keys = {
			key1: 'yeah',
			key2: 'whats',
			key3: 'up',
		};
		const testTemplate = `
      {{key1}}{{key2}}{{key3}}
      const handleError = {{ key1 }} => {
        if ({{ key1 }}.getDisplayErrorMessage) {
          console.log({{ key1 }}.getDisplayErrorMessage());
        } else {
          console.error({{ key2 }});
        }
      };
      
      const generate{{key2}}Values = cmd =>
        cmd.parent.rawArgs
          .filter(arg => arg.includes('='))
          .map(keyValuePair => keyValuePair.split('='))
          .reduce(
            (accm, [{{key2}}, value]) => ({
              ...accm,
              [{{key2}}.trim()]: value.trim(),
            }),
            {}
          );
      
      `;
		const keysInjector = injector(keys);
		expect(keysInjector(testTemplate)).toBe(
			`
      ${keys.key1}${keys.key2}${keys.key3}
      const handleError = ${keys.key1} => {
        if (${keys.key1}.getDisplayErrorMessage) {
          console.log(${keys.key1}.getDisplayErrorMessage());
        } else {
          console.error(${keys.key2});
        }
      };
      
      const generate${keys.key2}Values = cmd =>
        cmd.parent.rawArgs
          .filter(arg => arg.includes('='))
          .map(keyValuePair => keyValuePair.split('='))
          .reduce(
            (accm, [${keys.key2}, value]) => ({
              ...accm,
              [${keys.key2}.trim()]: value.trim(),
            }),
            {}
          );
      
      `
		);
	});

	it('Extracts the key as expected', () => {
		const keysBeforeExtraction = [
			'{{ test }}',
			'{{ test}}',
			'{{test }}',
			'{{test}}',
		];
		keysBeforeExtraction.forEach((key) => {
			expect(extractKey(key)).toBe('test');
		});
	});

	describe('injector with applyTransformers', () => {
		it('should handle a full template and apply all transformations', () => {
			const keys = {
				key1: 'YEAH',
				key2: 'whats',
				key3: 'up',
			};
			const testTemplate = `
        {{key1}}{{key2|capitalize}}{{key3}}
        const handleError = {{ key1 | toLowerCase | repeat }} => {
          if ({{ key1 }}.getDisplayErrorMessage) {
            console.log({{ key1 }}.getDisplayErrorMessage());
          } else {
            console.error({{ key2 }});
          }
        };
        {{date()}}
        const generate{{key2}}Values = cmd =>
          cmd.parent.rawArgs
            .filter(arg => arg.includes('='))
            .map(keyValuePair => keyValuePair.split('='))
            .reduce(
              (accm, [{{key2}}, value]) => ({
                ...accm,
                [{{key2}}.trim()]: value.trim(),
              }),
              {}
            );
        
        `;

			const transformers = {
				toLowerCase: jest.fn().mockImplementation((key) => key.toLowerCase()),
				repeat: jest.fn().mockImplementation((key) => `${key}${key}`),
			};

			const functions = {
				date: jest.fn().mockImplementation((ctx) => new Date().getDate()),
			};

			const config = new Config(getConfigObject({transformers,functions}));


			const globalCtx = {
				templateName: 'what',
				templateRoot: 'yay',
				parametersValues: { ...keys },
				executedAt: process.cwd(),
			};

			const localCtx = {
				type: 'FILE',
				targetRoot: 'here/the/file/is/created',
			};

			const keysInjector = injector(
				keys,
				config,
				globalCtx
			);

			const result = keysInjector(testTemplate, localCtx);

			const expectedCtx = {
				...globalCtx,
				...localCtx,
			};
			expect(transformers.toLowerCase).toHaveBeenCalledWith('YEAH', expectedCtx);
			expect(transformers.repeat).toHaveBeenCalledWith('yeah', expectedCtx);
			expect(functions.date).toHaveBeenCalledWith(expectedCtx);

			expect(result).toBe(
				`
        ${keys.key1}Whats${keys.key3}
        const handleError = ${
	keys.key1.toLowerCase() + keys.key1.toLowerCase()
} => {
          if (${keys.key1}.getDisplayErrorMessage) {
            console.log(${keys.key1}.getDisplayErrorMessage());
          } else {
            console.error(${keys.key2});
          }
        };
        ${new Date().getDate()}
        const generate${keys.key2}Values = cmd =>
          cmd.parent.rawArgs
            .filter(arg => arg.includes('='))
            .map(keyValuePair => keyValuePair.split('='))
            .reduce(
              (accm, [${keys.key2}, value]) => ({
                ...accm,
                [${keys.key2}.trim()]: value.trim(),
              }),
              {}
            );
        
        `
			);
		});

		it('should apply functions given a key with ()', () => {
			const testTemplate = '{{date()}}';

			const functions = {
				date: jest.fn().mockImplementation((ctx) => new Date().getDate()),
			};
			const transformers = {};
			const config = new Config(getConfigObject({transformers,functions}));

			const globalCtx = {
				templateName: 'what',
				templateRoot: 'yay',
				keyValuePairs: {},
			};

			const localCtx = {
				type: 'FILE',
				targetRoot: 'here/the/file/is/created',
			};
			
			const keysInjector = injector({}, config, globalCtx);

			const result = keysInjector(testTemplate, localCtx);

			expect(result).toEqual(`${new Date().getDate()}`);
		});

		it('should throw a "MissingTransformerImplementation" error when there is no transformer defined for a specific transformer key', () => {
			const keys = {
				key1: 'YEAH',
			};
			const testTemplate = `
        const handleError = {{ key1 | toLowerCase | repeat }} => {
        `;

			const transformers = {
				someTransformer: () => {},
			};
			const config = new Config(getConfigObject({transformers}));


			const keysInjector = injector(keys, config);

			expect(() => keysInjector(testTemplate)).toThrowError(
				MissingTransformerImplementation
			);
		});
	});
});
