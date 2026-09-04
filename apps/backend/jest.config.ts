/* eslint-disable */
const transformImportMeta = ({ types }: { types: { identifier: (name: string) => unknown } }) => ({
  visitor: {
    MetaProperty(path: {
      node: { meta: { name: string }; property: { name: string } };
      parentPath: {
        isMemberExpression: () => boolean;
        node: { property?: { name?: string } };
        replaceWith: (value: unknown) => void;
      };
      replaceWith: (value: unknown) => void;
    }) {
      if (path.node.meta.name !== 'import' || path.node.property.name !== 'meta') {
        return;
      }

      if (path.parentPath.isMemberExpression() && path.parentPath.node.property?.name === 'url') {
        path.parentPath.replaceWith(types.identifier('__filename'));
        return;
      }

      path.replaceWith(types.identifier('__filename'));
    },
  },
});

module.exports = {
  displayName: 'backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.[cm]?js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }]],
        plugins: [transformImportMeta],
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.[cm]?js$)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/backend',
};
